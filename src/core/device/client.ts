import { ITransport } from '../../transports/base/index.js';
import { COMMANDS, USHRT_MAX, MAX_CHUNK } from '../protocol/index.js';
import { createTCPHeader, removeTcpHeader } from '../packets/index.js';
import { User, AttendanceRecord, DeviceInfo } from '../types/index.js';

import * as userOps from '../users/index.js';
import * as attendanceOps from '../attendance/index.js';
import * as maintenanceOps from '../maintenance/index.js';

export class ZKClient {
  private transport: ITransport;
  private timeout: number;
  private sessionId = 0;
  private replyId = 0;
  private leftoverBuffer = new Uint8Array(0);

  constructor(transport: ITransport, timeout = 10000) {
    this.transport = transport;
    this.timeout = timeout;
  }

  async createSocket(): Promise<boolean> {
    try {
      await this.transport.connect();
      await this.connect();
      return true;
    } catch (err) {
      console.error('[ZK] Socket creation or initial connect failed:', err);
      throw err;
    }
  }

  async disconnect(): Promise<void> {
    try {
      // Only try to send EXIT if the transport is still connected/active
      await this.executeCmd(COMMANDS.CMD_EXIT, '');
    } catch (e) {
      // Silent catch during disconnect
    } finally {
      await this.transport.disconnect();
      this.leftoverBuffer = new Uint8Array(0);
    }
  }

  async writeMessage(msg: Uint8Array): Promise<void> {
    try {
      await this.transport.write(msg);
    } catch (e) {
      console.log('[ZK] Write failed (socket likely closed).');
    }
  }

  async readMessage(): Promise<Uint8Array> {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT_READING_MESSAGE')), this.timeout)
    );

    const readPromise = (async () => {
      while (true) {
        // 1. Check if we already have a full packet in the leftover buffer
        if (this.leftoverBuffer.length >= 8) {
          const view = new DataView(
            this.leftoverBuffer.buffer,
            this.leftoverBuffer.byteOffset,
            this.leftoverBuffer.byteLength
          );
          if (
            this.leftoverBuffer[0] === 0x50 &&
            this.leftoverBuffer[1] === 0x50 &&
            this.leftoverBuffer[2] === 0x82 &&
            this.leftoverBuffer[3] === 0x7d
          ) {
            const payloadLen = view.getUint32(4, true);
            const totalLen = 8 + payloadLen;

            if (this.leftoverBuffer.length >= totalLen) {
              const packet = this.leftoverBuffer.slice(0, totalLen);
              this.leftoverBuffer = this.leftoverBuffer.slice(totalLen);
              return packet;
            }
          } else {
            // Skip corrupted data until we find the header 0x50 0x50 0x82 0x7d
            console.warn('[ZK] Aligning stream: skipping invalid byte', this.leftoverBuffer[0]);
            this.leftoverBuffer = this.leftoverBuffer.slice(1);
            continue;
          }
        }

        // 2. Not enough data, read more from socket
        const value = await this.transport.read();
        if (value === null) throw new Error('STREAM_CLOSED_PREMATURELY');

        if (value.length > 0) {
          const newBuffer = new Uint8Array(this.leftoverBuffer.length + value.length);
          newBuffer.set(this.leftoverBuffer);
          newBuffer.set(value, this.leftoverBuffer.length);
          this.leftoverBuffer = newBuffer;
        }
      }
    })();

    return Promise.race([readPromise, timeoutPromise]);
  }

  async executeCmd(command: number, data: Uint8Array | string = ''): Promise<Uint8Array> {
    if (command === COMMANDS.CMD_CONNECT) {
      this.sessionId = 0;
      this.replyId = 0;
    } else {
      this.replyId = (this.replyId + 1) % USHRT_MAX;
    }

    // Small delay to prevent overwhelming some devices
    await new Promise((resolve) => setTimeout(resolve, 100));

    console.log(`[ZK] Executing command ${command} (replyId: ${this.replyId})`);
    const dataBuf = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    const buf = createTCPHeader(command, this.sessionId, this.replyId, dataBuf);
    await this.writeMessage(buf);

    const reply = await this.readMessage();
    const rReply = removeTcpHeader(reply);

    if (command === COMMANDS.CMD_CONNECT && rReply && rReply.length >= 6) {
      const view = new DataView(rReply.buffer, rReply.byteOffset, rReply.byteLength);
      this.sessionId = view.getUint16(4, true);
      console.log(`[ZK] Session established. Session ID: ${this.sessionId}`);

      // Set SDKBuild=1 as required by protocol
      await this.executeCmd(COMMANDS.CMD_OPTIONS_WRQ, new TextEncoder().encode('SDKBuild=1\0'));
    }

    return rReply;
  }

  async readWithBuffer(
    reqData: Uint8Array,
    cb: ((recv: number, total: number) => void) | null = null
  ): Promise<{ data: Uint8Array }> {
    console.log(`[ZK] Requesting data buffer...`);
    const firstReply = await this.executeCmd(COMMANDS.CMD_DATA_WRRQ, reqData);
    if (!firstReply || firstReply.length < 8) throw new Error('NO_REPLY_ON_DATA_WRRQ');

    const zkView = new DataView(firstReply.buffer, firstReply.byteOffset, firstReply.byteLength);
    const commandId = zkView.getUint16(0, true);

    console.log(`[ZK] Initial reply command ID: ${commandId}`);

    if (commandId === COMMANDS.CMD_DATA) {
      return { data: firstReply.slice(8) };
    }

    if (commandId === COMMANDS.CMD_PREPARE_DATA || commandId === COMMANDS.CMD_ACK_OK) {
      const recvData = firstReply.slice(8);
      if (recvData.length < 5) {
        console.log(`[ZK] Device returned empty data payload.`);
        return { data: new Uint8Array(0) };
      }

      const view = new DataView(recvData.buffer, recvData.byteOffset, recvData.byteLength);
      const size = view.getUint32(1, true);
      console.log(`[ZK] Device reports data size: ${size} bytes`);

      const remain = size % MAX_CHUNK;
      const numberChunks = Math.floor(size / MAX_CHUNK);
      let allData = new Uint8Array(0);

      for (let i = 0; i <= numberChunks; i++) {
        const chunkStart = i * MAX_CHUNK;
        const chunkSize = i === numberChunks ? remain : MAX_CHUNK;
        if (chunkSize === 0) continue;

        console.log(
          `[ZK] Requesting chunk ${i + 1}/${numberChunks + (remain > 0 ? 1 : 0)} (start: ${chunkStart}, size: ${chunkSize})`
        );

        const chunkReq = new Uint8Array(8);
        const chunkView = new DataView(chunkReq.buffer);
        chunkView.setUint32(0, chunkStart, true);
        chunkView.setUint32(4, chunkSize, true);

        const reply = await this.executeCmd(COMMANDS.CMD_DATA_RDY, chunkReq);
        const payload = removeTcpHeader(reply);

        let chunkBuffer = new Uint8Array(0);
        let chunkReceived = false;

        if (payload) {
          const pView = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
          const pCmd = pView.getUint16(0, true);

          if (pCmd === COMMANDS.CMD_DATA) {
            const dataPart = payload.slice(8);
            chunkBuffer = dataPart;
            if (chunkBuffer.length >= chunkSize) {
              chunkReceived = true;
            }
          }
        }

        while (!chunkReceived) {
          const packet = await this.readMessage();
          const payload = removeTcpHeader(packet);
          const pView = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
          const pCmd = pView.getUint16(0, true);

          if (pCmd === COMMANDS.CMD_DATA) {
            const dataPart = payload.slice(8);
            const newChunk = new Uint8Array(chunkBuffer.length + dataPart.length);
            newChunk.set(chunkBuffer);
            newChunk.set(dataPart, chunkBuffer.length);
            chunkBuffer = newChunk;

            if (chunkBuffer.length >= chunkSize) {
              chunkReceived = true;
            }
          } else if (pCmd === COMMANDS.CMD_ACK_OK && chunkBuffer.length > 0) {
            chunkReceived = true;
          }
        }

        const newAllData = new Uint8Array(allData.length + chunkBuffer.length);
        newAllData.set(allData);
        newAllData.set(chunkBuffer, allData.length);
        allData = newAllData;

        if (cb) cb(allData.length, size);
      }

      await this.freeData();
      return { data: allData };
    }

    throw new Error('UNEXPECTED_COMMAND_RESPONSE: ' + commandId);
  }

  async connect(): Promise<Uint8Array> {
    const res = await this.executeCmd(COMMANDS.CMD_CONNECT, '');
    // Set SDKBuild=1 as required by protocol
    await this.executeCmd(COMMANDS.CMD_OPTIONS_WRQ, new TextEncoder().encode('SDKBuild=1\0'));
    return res;
  }

  // User Operations
  async getUsers(): Promise<User[]> {
    return userOps.getUsers(this);
  }

  async getUser(userId: string): Promise<User | undefined> {
    return userOps.getUser(this, userId);
  }

  async setUser(
    uid: number,
    userid: string,
    name: string,
    password = '',
    role = 0,
    cardno = 0
  ): Promise<Uint8Array> {
    return userOps.setUser(this, uid, userid, name, password, role, cardno);
  }

  async deleteUser(uid: number): Promise<Uint8Array> {
    return userOps.deleteUser(this, uid);
  }

  async getUserTemplate(uid: number, fingerIndex = 0): Promise<Uint8Array | null> {
    return userOps.getUserTemplate(this, uid, fingerIndex);
  }

  async getAllTemplates(): Promise<Uint8Array> {
    return userOps.getAllTemplates(this);
  }

  // Attendance Operations
  async getAttendances(cb?: (recv: number, total: number) => void): Promise<AttendanceRecord[]> {
    return attendanceOps.getAttendances(this, cb);
  }

  async getAttendanceSize(): Promise<number> {
    const info = await this.getInfo();
    return info.logCounts;
  }

  async clearAttendanceLog(): Promise<Uint8Array> {
    return attendanceOps.clearAttendanceLog(this);
  }

  // Maintenance Operations
  async getInfo(): Promise<DeviceInfo> {
    return maintenanceOps.getInfo(this);
  }

  async getTime(): Promise<Date> {
    return maintenanceOps.getTime(this);
  }

  async setTime(date = new Date()): Promise<Uint8Array> {
    return maintenanceOps.setTime(this, date);
  }

  async getOption(keyword: string): Promise<string> {
    return maintenanceOps.getOption(this, keyword);
  }


  async clearData(): Promise<Uint8Array> {
    return maintenanceOps.clearData(this);
  }

  async voiceTest(): Promise<Uint8Array> {
    return maintenanceOps.voiceTest(this);
  }

  async refreshData(): Promise<Uint8Array> {
    return maintenanceOps.refreshData(this);
  }

  async freeData(): Promise<Uint8Array> {
    return maintenanceOps.freeData(this);
  }

  // Key-value options shorthand
  async getPIN(): Promise<string> { return this.getOption('~PIN2Width'); }
  async getFaceOn(): Promise<string> { return this.getOption('FaceFunOn'); }
  async getSSR(): Promise<string> { return this.getOption('~SSR'); }
  async getDeviceVersion(): Promise<string> { return this.getOption('~ZKFPVersion'); }
  async getDeviceName(): Promise<string> { return this.getOption('~DeviceName'); }
  async getPlatform(): Promise<string> { return this.getOption('~Platform'); }
  async getOS(): Promise<string> { return this.getOption('~OS'); }
  async getVendor(): Promise<string> { return this.getOption('~OEMVendor'); }
  async getProductTime(): Promise<string> { return this.getOption('~ProductTime'); }
  async getMacAddress(): Promise<string> { return this.getOption('MAC'); }
  async getSerialNumber(): Promise<string> { return this.getOption('~SerialNumber'); }
  async getFirmware(): Promise<string> { return this.getOption('~ZKFPVersion'); }

  async getRealTimeLogs(cb: any): Promise<string> {
    await this.executeCmd(COMMANDS.CMD_REG_EVENT, new Uint8Array([0x01, 0x00, 0x00, 0x00]));
    return 'Real-time registration successful. Note: Standard HTTP endpoints in Workers cannot maintain long-lived streams without Durable Objects.';
  }

  async enrollFingerprint(uid: number, fingerIndex: number, create = false): Promise<void> {
    const data = new Uint8Array(26);
    const view = new DataView(data.buffer);
    // CMD_STARTENROLL expects the numeric uid as a uint16 LE in bytes 0-1, NOT a string
    view.setUint16(0, uid, true);
    data[24] = fingerIndex;
    data[25] = create ? 1 : 0; // 0 = enroll on existing user, 1 = create new user

    await this.executeCmd(COMMANDS.CMD_CANCELCAPTURE, '');
    await this.executeCmd(COMMANDS.CMD_STARTENROLL, data);
    await this.executeCmd(COMMANDS.CMD_STARTVERIFY, '');
  }
}
