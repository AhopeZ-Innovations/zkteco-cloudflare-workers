export class ZKError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ZKConnectionError extends ZKError {
  constructor(message = 'Failed to connect to the biometric device') {
    super(message);
  }
}

export class ZKTimeoutError extends ZKError {
  constructor(message = 'Socket operation timed out') {
    super(message);
  }
}

export class ZKProtocolError extends ZKError {
  constructor(message: string) {
    super(message);
  }
}
