import * as net from 'net';
import { ITransport, TransportOptions } from '../base/index.js';

export class NodeTransport implements ITransport {
  private socket: net.Socket | null = null;
  private ip: string;
  private port: number;
  private timeout: number;
  private readQueue: Uint8Array[] = [];
  private pendingReadPromise: {
    resolve: (val: Uint8Array | null) => void;
    reject: (err: any) => void;
  } | null = null;

  constructor(options: TransportOptions) {
    this.ip = options.ip;
    this.port = options.port;
    this.timeout = options.timeout ?? 10000;
  }

  async connect(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const socket = new net.Socket();
      this.socket = socket;

      socket.setTimeout(this.timeout);

      socket.once('connect', () => {
        socket.removeAllListeners('error');
        
        socket.on('data', (data) => {
          const uint8 = new Uint8Array(data);
          if (this.pendingReadPromise) {
            const p = this.pendingReadPromise;
            this.pendingReadPromise = null;
            p.resolve(uint8);
          } else {
            this.readQueue.push(uint8);
          }
        });

        socket.on('end', () => {
          this.handleClose();
        });

        socket.on('close', () => {
          this.handleClose();
        });

        socket.on('error', (err) => {
          this.handleError(err);
        });

        socket.on('timeout', () => {
          socket.destroy();
          this.handleError(new Error('Socket timeout'));
        });

        resolve();
      });

      socket.once('error', (err) => {
        this.socket = null;
        reject(err);
      });

      socket.connect(this.port, this.ip);
    });
  }

  private handleClose() {
    if (this.pendingReadPromise) {
      const p = this.pendingReadPromise;
      this.pendingReadPromise = null;
      p.resolve(null);
    }
    this.socket = null;
  }

  private handleError(err: Error) {
    if (this.pendingReadPromise) {
      const p = this.pendingReadPromise;
      this.pendingReadPromise = null;
      p.reject(err);
    }
    this.socket = null;
  }

  async disconnect(): Promise<void> {
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }
    this.readQueue = [];
    this.pendingReadPromise = null;
  }

  async write(data: Uint8Array): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.socket) {
        return reject(new Error('Socket not connected'));
      }
      this.socket.write(data, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async read(): Promise<Uint8Array | null> {
    if (this.readQueue.length > 0) {
      return this.readQueue.shift()!;
    }
    if (!this.socket) {
      return null;
    }
    return new Promise<Uint8Array | null>((resolve, reject) => {
      this.pendingReadPromise = { resolve, reject };
    });
  }
}
