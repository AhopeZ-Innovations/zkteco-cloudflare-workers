import { User, AttendanceRecord } from '../types/index.js';
import { parseTimeToDate } from '../utils/time.js';

export function decodeUserData72(userData: Uint8Array): User {
  const view = new DataView(userData.buffer, userData.byteOffset, userData.byteLength);
  const decoder = new TextDecoder('ascii');

  const uid = view.getUint16(0, true);
  const role = view.getUint8(2);

  const password = decoder.decode(userData.subarray(3, 11)).split('\0')[0];
  const name = decoder.decode(userData.subarray(11, 35)).split('\0')[0];
  const cardno = view.getUint32(35, true);
  const userId = decoder.decode(userData.subarray(48, 57)).split('\0')[0].trim();

  return { uid, role, password, name, cardno, userId };
}

export function decodeRecordData40(recordData: Uint8Array): AttendanceRecord {
  const view = new DataView(recordData.buffer, recordData.byteOffset, recordData.byteLength);
  const decoder = new TextDecoder('ascii');

  const sn = view.getUint16(0, true);
  const user_id = decoder.decode(recordData.subarray(2, 11)).replace(/\0/g, '').trim();
  const dt = parseTimeToDate(view.getUint32(27, true));
  const record_time = isNaN(dt.getTime()) ? null : dt.toISOString();
  const type = view.getUint8(26);
  const state = view.getUint8(31);

  return { sn, user_id, record_time, type, state };
}
