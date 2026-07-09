export interface User {
  uid: number;
  role: number;
  password?: string;
  name: string;
  cardno: number;
  userId: string;
}

export interface AttendanceRecord {
  sn: number;
  user_id: string;
  record_time: string | null;
  type: number;
  state: number;
}

export interface DeviceInfo {
  userCounts: number;
  logCounts: number;
  logCapacity: number;
  fpCounts: number;
  adminCounts: number;
  faceCounts: number;
}
