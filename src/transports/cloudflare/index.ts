import { ITransport, TransportOptions } from '../base/index.js';

export class CloudflareTransport implements ITransport {
  private socket: any = null;
  private reader: any = null;
  private writer: any = null;
  private ip: string;
  private port: number;
  private timeout: number;

  constructor(options: TransportOptions) {
    this.ip = options.ip;
    this.port = options.port;
    this.timeout = options.timeout ?? 10000;
  }

  async connect(): Promise<void> {
    // Dynamic import to prevent bundlers from complaining about 'cloudflare:sockets' in non-worker environments.
    // @ts-ignore
    const { connect } = await import('cloudflare:sockets');
    this.socket = connect({ hostname: this.ip, port: this.port });

    const openedPromise = this.socket.opened;
    const timeoutPromise = new Promise<void>((_, reject) =>
      setTimeout(() => reject(new Error('SOCKET_OPEN_TIMEOUT')), this.timeout)
    );

    await Promise.race([openedPromise, timeoutPromise]);

    this.writer = this.socket.writable.getWriter();
    this.reader = this.socket.readable.getReader();
  }

  async disconnect(): Promise<void> {
    if (this.socket) {
      try {
        this.socket.close();
      } catch (e) {}
      this.socket = null;
      this.reader = null;
      this.writer = null;
    }
  }

  async write(data: Uint8Array): Promise<void> {
    if (!this.writer) {
      throw new Error('Socket not connected');
    }
    await this.writer.write(data);
  }

  async read(): Promise<Uint8Array | null> {
    if (!this.reader) {
      throw new Error('Socket not connected');
    }
    const { value, done } = await this.reader.read();
    if (done) {
      return null;
    }
    return value;
  }
}
