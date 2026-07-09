import { encodeDateToTime } from '../utils/time.js';

export function serializeUserData72(uid: number, userid: string, name: string, password = '', role = 0, cardno = 0): Uint8Array {
  const data = new Uint8Array(72);
  const view = new DataView(data.buffer);
  const encoder = new TextEncoder();

  view.setUint16(0, uid, true);
  view.setUint8(2, role);

  const pwdBuf = encoder.encode(password + '\0');
  data.set(pwdBuf.slice(0, 8), 3);

  const nameBuf = encoder.encode(name + '\0');
  data.set(nameBuf.slice(0, 24), 11);

  view.setUint32(35, cardno, true);

  const userIdBuf = encoder.encode(userid + '\0');
  data.set(userIdBuf.slice(0, 9), 48);

  return data;
}

export function serializeDeleteUser(uid: number): Uint8Array {
  const data = new Uint8Array(2);
  const view = new DataView(data.buffer);
  view.setUint16(0, uid, true);
  return data;
}

export function serializeUserTemplateRequest(uid: number, fingerIndex = 0): Uint8Array {
  const data = new Uint8Array(4);
  const view = new DataView(data.buffer);
  view.setUint16(0, uid, true);
  view.setUint8(2, fingerIndex);
  view.setUint8(3, 1); // Fixed mark
  return data;
}

export function serializeSetTime(date: Date = new Date()): Uint8Array {
  const encT = encodeDateToTime(date);
  const data = new Uint8Array(4);
  const view = new DataView(data.buffer);
  view.setUint32(0, encT, true);
  return data;
}
