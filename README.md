# zk-workers-lib

[![npm version](https://badge.fury.io/js/zk-workers-lib.svg)](https://badge.fury.io/js/zk-workers-lib)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/zk-workers-lib.svg)](https://nodejs.org/)
[![Downloads](https://img.shields.io/npm/dm/zk-workers-lib.svg)](https://www.npmjs.com/package/zk-workers-lib)

A modern, **runtime-agnostic ZKTeco Biometric Device SDK** written in TypeScript. Decoupled from native platform modules, this SDK enables communication with physical biometric fingerprint scanners from both **Node.js** and edge-computing runtimes like **Cloudflare Workers**.

---

## ✨ Why This Package? (How It Differs)

Traditional ZKTeco node packages (like `node-zklib` or `zklib-js`) are hardcoded to Node.js's native `net` and `dgram` socket modules. This tightly couples them to a standard server environment and prevents them from executing on edge networks.

* 🌐 **Cloudflare Workers & Edge Support**: The first ZK SDK capable of running inside Cloudflare Workers using the native `cloudflare:sockets` TCP API.
* 📦 **ESM & CommonJS Dual Bundling**: Full TypeScript support, pre-packaged with type declarations (`.d.ts`) and ESM/CJS exports.
* 🔒 **Stateless Request Mutexing**: Solves socket dropouts (`STREAM_CLOSED_PREMATURELY`) and interleaving packet collisions by enforcing a thread-safe connection-per-request mutex lock pattern.
* ⚡ **Zero External Dependencies**: Pure JS/TS implementation using native ArrayBuffer and DataView binary parsing for maximum performance.

---

## 📦 Installation

```bash
npm install zk-workers-lib
```

```bash
yarn add zk-workers-lib
```

```bash
pnpm add zk-workers-lib
```

---

## 🚀 Quick Start

### 1. Node.js Integration
```typescript
import { ZKClient, getUsers, getAttendances } from 'zk-workers-lib';
import { NodeTransport } from 'zk-workers-lib/transports/node';

const transport = new NodeTransport({ ip: '192.168.1.201', port: 4370, timeout: 10000 });
const client = new ZKClient(transport);

async function main() {
  try {
    await client.createSocket();
    console.log('Connected to device!');

    const users = await getUsers(client);
    const logs = await getAttendances(client);

    console.log(`Enrolled Users: ${users.length}`);
    console.log(`Check-in Logs: ${logs.length}`);

    await client.disconnect();
  } catch (error) {
    console.error('Connection failed:', error);
  }
}

main();
```

### 2. Cloudflare Workers Integration
```typescript
import { ZKClient, getUsers } from 'zk-workers-lib';
import { CloudflareTransport } from 'zk-workers-lib/transports/cloudflare';

export default {
  async fetch(request, env, ctx) {
    const transport = new CloudflareTransport({ ip: '122.252.225.190', port: 4370, timeout: 10000 });
    const client = new ZKClient(transport);

    await client.createSocket();
    const users = await getUsers(client);
    await client.disconnect();

    return new Response(JSON.stringify(users), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

---

## 📖 API Reference

### Core Client Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `new ZKClient(transport)` | `transport: ITransport` | Initializes the client with a transport adapter |
| `createSocket()` | - | Connects to the device and establishes a session |
| `disconnect()` | - | Closes the connection to the device |
| `executeCmd()` | `command: number, data: Uint8Array \| string` | Executes a raw ZK command code |

### User Management

| Method / Function | Parameters | Description |
|--------|------------|-------------|
| `getUsers(client)` | `client: ZKClient` | Retrieves all users from the device database |
| `getUser(client, userId)` | `client: ZKClient, userId: string` | Finds a user by their User String ID |
| `setUser(client, ...)` | `client, uid, userid, name, password?, role?, cardno?` | Creates or updates a user on the device |
| `deleteUser(client, uid)` | `client: ZKClient, uid: number` | Deletes a user profile from the device |

### Biometric Management

| Function / Method | Parameters | Description |
|--------|------------|-------------|
| `getUserTemplate(client, ...)` | `client, uid, fingerIndex` | Reads a specific fingerprint template of a user |
| `getAllTemplates(client)` | `client: ZKClient` | Downloads all fingerprint templates inside device memory |
| `client.enrollFingerprint(...)` | `userId: string, fingerIndex: number` | Wakes up the scanner to enroll a specific finger (0-9) |

### Attendance Records

| Function | Parameters | Description |
|--------|------------|-------------|
| `getAttendances(client, cb?)` | `client, cb?` | Reads all attendance records from device memory |
| `clearAttendanceLog(client)` | `client` | Wipes attendance log records from the storage chip |

### Device Maintenance & Option Controls

| Function | Parameters | Description |
|--------|------------|-------------|
| `getInfo(client)` | `client` | Retrieves storage capacity details and count metrics |
| `getTime(client)` | `client` | Reads the current local time of the device clock |
| `setTime(client, date)` | `client, date: Date` | Sets the device's clock to the specified date-time |
| `getOption(client, keyword)` | `client, keyword: string` | Reads a hardware option parameter (e.g., `IPAddress`, `NetMask`) |
| `voiceTest(client)` | `client` | Plays the device's hardware test sound |
| `clearData(client)` | `client` | Clears user and template databases |
| `refreshData(client)` | `client` | Commits changes and flushes device memory |
| `freeData(client)` | `client` | Frees device transmission buffers |

---

## 💡 Examples

### User Registration & Role Configuration
```typescript
import { ZKClient, setUser } from 'zk-workers-lib';
import { NodeTransport } from 'zk-workers-lib/transports/node';

const client = new ZKClient(new NodeTransport({ ip: '192.168.1.201' }));
await client.createSocket();

// Set user 'John Doe' as an Administrator (role code 14)
await setUser(
  client,
  2,           // Unique numeric UID
  'EMP102',    // String User ID
  'John Doe',  // Name
  '',          // Password
  14,          // Role code (0: User, 14: Admin)
  123456       // RFID Card Number
);

await client.disconnect();
```

### Remote Fingerprint Enrollment Flow
Enrolls a user's right index finger (index 1) remotely from the dashboard:
```typescript
import { ZKClient } from 'zk-workers-lib';
import { NodeTransport } from 'zk-workers-lib/transports/node';

const client = new ZKClient(new NodeTransport({ ip: '192.168.1.201' }));
await client.createSocket();

// Put device in enroll mode: stops capturing, sets target parameters, prompts verify scan
await client.enrollFingerprint('EMP102', 1);

// Device speaker will speak "Please press your finger". User scans 3 times.
await client.disconnect();
```

---

## 🔧 Configuration

### Pluggable Transport Construction

Choose the transport layer matching your runtime environment:

```typescript
// For Node.js (CommonJS or ESM)
new NodeTransport({ ip, port, timeout })

// For Cloudflare Workers (ESM)
new CloudflareTransport({ ip, port, timeout })
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `ip` | string | - | Biometric device IP address (required) |
| `port` | number | `4370` | Connection port |
| `timeout` | number | `10000` | Connection socket timeout in milliseconds |

---

## 🤝 Contributing

Contributions are welcome! Feel free to:
1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

---

## 📄 License

This project is licensed under the MIT License.

---

**Author:** [ArunKumar](https://github.com/AhopeZ-Innovations)  
**Email:** arun@ahopez.in
