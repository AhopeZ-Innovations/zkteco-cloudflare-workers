import { COMMANDS } from '../protocol/index.js';
import { parseTimeToDate } from '../utils/time.js';
import { serializeSetTime } from '../serializers/index.js';
import { DeviceInfo } from '../types/index.js';

export interface IMaintenanceClient {
  executeCmd(command: number, data?: Uint8Array | string): Promise<Uint8Array>;
  refreshData(): Promise<Uint8Array>;
}

export async function getInfo(client: IMaintenanceClient): Promise<DeviceInfo> {
  const data = await client.executeCmd(COMMANDS.CMD_GET_FREE_SIZES, '');
  if (!data || data.length < 40) {
    console.log(`[ZK] Device returned short info payload (${data?.length || 0} bytes). Using defaults.`);
    return { userCounts: 0, logCounts: 0, logCapacity: 0, fpCounts: 0, adminCounts: 0, faceCounts: 0 };
  }
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  return {
    userCounts: data.length >= 28 ? view.getUint32(24, true) : 0,
    logCounts: data.length >= 44 ? view.getUint32(40, true) : 0,
    logCapacity: data.length >= 76 ? view.getUint32(72, true) : 0,
    fpCounts: data.length >= 36 ? view.getUint32(32, true) : 0,
    adminCounts: data.length >= 60 ? view.getUint32(56, true) : 0,
    faceCounts: data.length >= 92 ? view.getUint32(88, true) : 0
  };
}

export async function getTime(client: IMaintenanceClient): Promise<Date> {
  const data = await client.executeCmd(COMMANDS.CMD_GET_TIME, '');
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const encT = view.getUint32(8, true);
  return parseTimeToDate(encT);
}

export async function setTime(client: IMaintenanceClient, date = new Date()): Promise<Uint8Array> {
  const data = serializeSetTime(date);
  await client.executeCmd(COMMANDS.CMD_SET_TIME, data);
  return await client.refreshData();
}

export async function getOption(client: IMaintenanceClient, keyword: string): Promise<string> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const data = await client.executeCmd(COMMANDS.CMD_OPTIONS_RRQ, encoder.encode(keyword + '\0'));
  const str = decoder.decode(data.slice(8)).split('\0')[0];
  return str.replace(`${keyword}=`, '');
}

export async function clearData(client: IMaintenanceClient): Promise<Uint8Array> {
  return await client.executeCmd(COMMANDS.CMD_CLEAR_DATA, '');
}

export async function voiceTest(client: IMaintenanceClient): Promise<Uint8Array> {
  return await client.executeCmd(COMMANDS.CMD_TESTVOICE, '');
}

export async function refreshData(client: IMaintenanceClient): Promise<Uint8Array> {
  return await client.executeCmd(COMMANDS.CMD_REFRESHDATA, '');
}

export async function freeData(client: IMaintenanceClient): Promise<Uint8Array> {
  return await client.executeCmd(COMMANDS.CMD_FREE_DATA, '');
}
