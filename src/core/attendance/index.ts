import { COMMANDS, REQUEST_DATA } from '../protocol/index.js';
import { decodeRecordData40 } from '../parsers/index.js';
import { AttendanceRecord } from '../types/index.js';

// We define a structural type interface for ZKClient to avoid circular dependencies
export interface IAttendanceClient {
  executeCmd(command: number, data?: Uint8Array | string): Promise<Uint8Array>;
  readWithBuffer(reqData: Uint8Array, cb?: (recv: number, total: number) => void): Promise<{ data: Uint8Array }>;
  refreshData(): Promise<Uint8Array>;
  getAttendanceSize(): Promise<number>;
}

export async function getAttendances(
  client: IAttendanceClient,
  cb?: (recv: number, total: number) => void
): Promise<AttendanceRecord[]> {
  const logCount = await client.getAttendanceSize();
  console.log(`[ZK] Device reports ${logCount} logs available via info command.`);

  if (logCount === 0) {
    return [];
  }

  await client.refreshData();
  const { data } = await client.readWithBuffer(REQUEST_DATA.GET_ATTENDANCE_LOGS, cb);
  if (!data || data.length === 0) return [];

  const RECORD_PACKET_SIZE = 40;
  const recordData = data.slice(4);
  const records: AttendanceRecord[] = [];

  for (let i = 0; i + RECORD_PACKET_SIZE <= recordData.length; i += RECORD_PACKET_SIZE) {
    records.push(decodeRecordData40(recordData.slice(i, i + RECORD_PACKET_SIZE)));
  }
  return records;
}

export async function clearAttendanceLog(client: { executeCmd(command: number, data?: Uint8Array | string): Promise<Uint8Array> }): Promise<Uint8Array> {
  return await client.executeCmd(COMMANDS.CMD_CLEAR_ATTLOG, '');
}
