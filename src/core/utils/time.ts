export function parseTimeToDate(time: number): Date {
  const second = time % 60;
  time = (time - second) / 60;
  const minute = time % 60;
  time = (time - minute) / 60;
  const hour = time % 24;
  time = (time - hour) / 24;
  const day = (time % 31) + 1;
  time = (time - (day - 1)) / 31;
  const month = time % 12;
  time = (time - month) / 12;
  const year = time + 2000;

  return new Date(year, month, day, hour, minute, second);
}

export function parseHexToTime(hex: Uint8Array): Date {
  const view = new DataView(hex.buffer, hex.byteOffset, hex.byteLength);
  const year = view.getUint8(0);
  const month = view.getUint8(1);
  const date = view.getUint8(2);
  const hour = view.getUint8(3);
  const minute = view.getUint8(4);
  const second = view.getUint8(5);

  return new Date(2000 + year, month - 1, date, hour, minute, second);
}

export function encodeDateToTime(date: Date = new Date()): number {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();

  return ((year % 100) * 12 * 31 + ((month - 1) * 31) + day - 1) * (24 * 60 * 60) + (hour * 60 + minute) * 60 + second;
}
