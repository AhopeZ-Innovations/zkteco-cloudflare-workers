import { COMMANDS, REQUEST_DATA } from '../protocol/index.js';
import { decodeUserData72 } from '../parsers/index.js';
import { serializeUserData72, serializeDeleteUser, serializeUserTemplateRequest } from '../serializers/index.js';
import { User } from '../types/index.js';

// We define a structural type interface for ZKClient to avoid circular dependencies
export interface IZKClient {
  executeCmd(command: number, data?: Uint8Array | string): Promise<Uint8Array>;
  readWithBuffer(reqData: Uint8Array, cb?: (recv: number, total: number) => void): Promise<{ data: Uint8Array }>;
  refreshData(): Promise<Uint8Array>;
  freeData(): Promise<Uint8Array>;
}

export async function getUsers(client: IZKClient): Promise<User[]> {
  const { data } = await client.readWithBuffer(REQUEST_DATA.GET_USERS);
  if (!data || data.length === 0) return [];

  const USER_PACKET_SIZE = 72;
  const userData = data.slice(4);
  const users: User[] = [];

  for (let i = 0; i + USER_PACKET_SIZE <= userData.length; i += USER_PACKET_SIZE) {
    users.push(decodeUserData72(userData.slice(i, i + USER_PACKET_SIZE)));
  }
  return users;
}

export async function getUser(client: IZKClient, userId: string): Promise<User | undefined> {
  const users = await getUsers(client);
  return users.find(u => u.userId === userId || u.uid === parseInt(userId, 10));
}

export async function setUser(
  client: IZKClient,
  uid: number,
  userid: string,
  name: string,
  password = '',
  role = 0,
  cardno = 0
): Promise<Uint8Array> {
  const data = serializeUserData72(uid, userid, name, password, role, cardno);
  await client.executeCmd(COMMANDS.CMD_USER_WRQ, data);
  return await client.refreshData();
}

export async function deleteUser(client: IZKClient, uid: number): Promise<Uint8Array> {
  const data = serializeDeleteUser(uid);
  await client.executeCmd(COMMANDS.CMD_DELETE_USER, data);
  return await client.refreshData();
}

export async function getUserTemplate(client: IZKClient, uid: number, fingerIndex = 0): Promise<Uint8Array | null> {
  const data = serializeUserTemplateRequest(uid, fingerIndex);
  const res = await client.executeCmd(COMMANDS.CMD_USERTEMP_RRQ, data);
  if (res && res.length > 10) {
    return res.slice(8);
  }
  return null;
}

export async function getAllTemplates(client: IZKClient): Promise<Uint8Array> {
  await client.freeData();
  // Request code 0x02 for templates
  const req = new Uint8Array([0x01, 0x09, 0x00, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
  const { data } = await client.readWithBuffer(req);
  await client.freeData();
  return data;
}
