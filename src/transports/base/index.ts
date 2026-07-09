export interface TransportOptions {
  ip: string;
  port: number;
  timeout?: number;
}

export interface ITransport {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  write(data: Uint8Array): Promise<void>;
  read(): Promise<Uint8Array | null>;
}
