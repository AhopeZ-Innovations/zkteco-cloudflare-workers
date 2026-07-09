import { USHRT_MAX } from '../protocol/index.js';

export function createChkSum(buf: Uint8Array): number {
  let chksum = 0;
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  for (let i = 0; i < buf.length; i += 2) {
    if (i === buf.length - 1) {
      chksum += buf[i];
    } else {
      chksum += view.getUint16(i, true);
    }
    chksum %= USHRT_MAX;
  }
  chksum = USHRT_MAX - chksum - 1;
  return chksum;
}

export function createTCPHeader(command: number, sessionId: number, replyId: number, data: Uint8Array = new Uint8Array([])): Uint8Array {
  const dataBuffer = data instanceof Uint8Array ? data : new Uint8Array(data);
  const buf = new Uint8Array(8 + dataBuffer.length);
  const view = new DataView(buf.buffer);

  view.setUint16(0, command, true);
  view.setUint16(2, 0, true); // Checksum placeholder
  view.setUint16(4, sessionId, true);
  view.setUint16(6, replyId, true);
  buf.set(dataBuffer, 8);

  const chksum = createChkSum(buf);
  view.setUint16(2, chksum, true);

  // Increment replyId for the packet as seen in other libraries
  const finalReplyId = (replyId + 1) % USHRT_MAX;
  view.setUint16(6, finalReplyId, true);

  const prefixBuf = new Uint8Array(8);
  const prefixView = new DataView(prefixBuf.buffer);
  prefixBuf.set([0x50, 0x50, 0x82, 0x7d]);
  prefixView.setUint32(4, buf.length, true);

  const finalBuf = new Uint8Array(prefixBuf.length + buf.length);
  finalBuf.set(prefixBuf);
  finalBuf.set(buf, prefixBuf.length);

  return finalBuf;
}

export function removeTcpHeader(buf: Uint8Array): Uint8Array {
  if (buf.length < 8) return buf;
  if (buf[0] === 0x50 && buf[1] === 0x50 && buf[2] === 0x82 && buf[3] === 0x7d) {
    return buf.slice(8);
  }
  return buf;
}

export interface DecodedTCPHeader {
  commandId: number;
  checkSum: number;
  sessionId: number;
  replyId: number;
  payloadSize: number;
}

export function decodeTCPHeader(header: Uint8Array): DecodedTCPHeader {
  const view = new DataView(header.buffer, header.byteOffset, header.byteLength);
  const payloadSize = view.getUint32(4, true);

  const zkHeader = header.slice(8, 16);
  const zkView = new DataView(zkHeader.buffer, zkHeader.byteOffset, zkHeader.byteLength);

  const commandId = zkView.getUint16(0, true);
  const checkSum = zkView.getUint16(2, true);
  const sessionId = zkView.getUint16(4, true);
  const replyId = zkView.getUint16(6, true);

  return { commandId, checkSum, sessionId, replyId, payloadSize };
}
