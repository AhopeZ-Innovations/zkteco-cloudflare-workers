import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ZKClient } from '../dist/index.js';
import { NodeTransport } from '../dist/transports/node/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Stateless connection-per-request configuration
let deviceConfig = null; // { ip, port }
let deletedLogSns = new Set();

class Mutex {
  constructor() {
    this.queue = [];
    this.locked = false;
  }

  async acquire() {
    return new Promise((resolve) => {
      if (!this.locked) {
        this.locked = true;
        resolve();
      } else {
        this.queue.push(resolve);
      }
    });
  }

  release() {
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      next();
    } else {
      this.locked = false;
    }
  }
}

const lock = new Mutex();

const server = http.createServer(async (req, res) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders);
    res.end();
    return;
  }

  // Helper for JSON responses
  const sendJSON = (data, status = 200) => {
    res.writeHead(status, { 
      'Content-Type': 'application/json',
      ...corsHeaders
    });
    res.end(JSON.stringify(data));
  };

  const sendError = (err, status = 500) => {
    console.error(err);
    sendJSON({ error: err.message || String(err) }, status);
  };

  // Serve static HTML page
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    fs.readFile(path.join(__dirname, 'index.html'), 'utf8', (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error loading index.html');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
      }
    });
    return;
  }

  // Parse JSON request helper
  const parseJSONBody = () => new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(new Error('Invalid JSON body'));
      }
    });
  });

  // Acquire lock for all API requests to serialize ZK socket actions
  await lock.acquire();

  try {
    if (req.method === 'POST' && req.url === '/api/connect') {
      const { ip, port } = await parseJSONBody();
      if (!ip) throw new Error('IP is required');
      
      // Test the connection
      const testTransport = new NodeTransport({ ip, port: Number(port || 4370), timeout: 5000 });
      const testClient = new ZKClient(testTransport);
      await testClient.createSocket();
      await testClient.disconnect();

      deviceConfig = { ip, port: Number(port || 4370) };
      return sendJSON({ success: true });
    }

    if (req.method === 'POST' && req.url === '/api/disconnect') {
      deviceConfig = null;
      return sendJSON({ success: true });
    }

    // Require client connection configuration for below actions
    if (!deviceConfig) {
      return sendJSON({ error: 'Device not connected' }, 400);
    }

    // Helper to run a block with a temporary client session
    const runWithClient = async (action) => {
      const tempTransport = new NodeTransport({ ip: deviceConfig.ip, port: deviceConfig.port, timeout: 10000 });
      const tempClient = new ZKClient(tempTransport);
      await tempClient.createSocket();
      try {
        return await action(tempClient);
      } finally {
        try { await tempClient.disconnect(); } catch (e) {}
      }
    };

    if (req.method === 'GET' && req.url === '/api/info') {
      const resData = await runWithClient(async (tempClient) => {
        const info = await tempClient.getInfo();
        const serial = await tempClient.getSerialNumber();
        const firmware = await tempClient.getFirmware();
        const platform = await tempClient.getPlatform();
        const vendor = await tempClient.getVendor();
        const time = await tempClient.getTime();
        return { info, serial, firmware, platform, vendor, time: time.toISOString() };
      });
      return sendJSON(resData);
    }

    if (req.method === 'GET' && req.url === '/api/users') {
      const users = await runWithClient(async (tempClient) => {
        return await tempClient.getUsers();
      });
      return sendJSON(users);
    }

    if (req.method === 'POST' && req.url === '/api/users') {
      const { uid, userId, name, password, role, cardno } = await parseJSONBody();
      await runWithClient(async (tempClient) => {
        await tempClient.setUser(Number(uid), userId, name, password || '', Number(role || 0), Number(cardno || 0));
      });
      return sendJSON({ success: true });
    }

    if (req.url.startsWith('/api/users/') && req.method === 'DELETE') {
      const parts = req.url.split('/');
      const uid = Number(parts[parts.length - 1]);
      await runWithClient(async (tempClient) => {
        await tempClient.deleteUser(uid);
      });
      return sendJSON({ success: true });
    }

    if (req.method === 'GET' && req.url === '/api/attendance') {
      const logs = await runWithClient(async (tempClient) => {
        return await tempClient.getAttendances();
      });
      const filtered = logs.filter(log => !deletedLogSns.has(log.sn));
      return sendJSON(filtered);
    }

    if (req.url.startsWith('/api/attendance/') && req.method === 'DELETE') {
      const parts = req.url.split('/');
      const sn = Number(parts[parts.length - 1]);
      deletedLogSns.add(sn);
      return sendJSON({ success: true });
    }

    if (req.method === 'POST' && req.url === '/api/clear-attendance') {
      await runWithClient(async (tempClient) => {
        await tempClient.clearAttendanceLog();
      });
      deletedLogSns.clear();
      return sendJSON({ success: true });
    }

    if (req.method === 'GET' && req.url === '/api/network') {
      const data = await runWithClient(async (tempClient) => {
        const ip = await tempClient.getOption('IPAddress');
        const mask = await tempClient.getOption('NetMask');
        const gateway = await tempClient.getOption('GateWayIPAddress');
        return { ip, mask, gateway };
      });
      return sendJSON(data);
    }

    if (req.method === 'POST' && req.url === '/api/voice-test') {
      await runWithClient(async (tempClient) => {
        await tempClient.voiceTest();
      });
      return sendJSON({ success: true });
    }
    if (req.method === 'POST' && req.url === '/api/enroll-fp') {
      const { userId, fingerIndex } = await parseJSONBody();
      if (!userId) throw new Error('User ID is required');
      await runWithClient(async (tempClient) => {
        await tempClient.enrollFingerprint(userId, Number(fingerIndex ?? 0));
      });
      return sendJSON({ success: true });
    }
    if (req.method === 'POST' && req.url === '/api/sync-time') {
      const timeStr = await runWithClient(async (tempClient) => {
        await tempClient.setTime(new Date());
        const time = await tempClient.getTime();
        return time.toISOString();
      });
      return sendJSON({ success: true, time: timeStr });
    }

    if (req.method === 'POST' && req.url === '/api/reboot') {
      await runWithClient(async (tempClient) => {
        await tempClient.executeCmd(1004, ''); // CMD_RESTART
      });
      deviceConfig = null;
      return sendJSON({ success: true });
    }

    if (req.method === 'POST' && req.url === '/api/option') {
      const { keyword } = await parseJSONBody();
      const value = await runWithClient(async (tempClient) => {
        return await tempClient.getOption(keyword);
      });
      return sendJSON({ keyword, value });
    }

    // 404 Fallback
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  } catch (e) {
    return sendError(e);
  } finally {
    lock.release();
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`ZKTeco Web Controller server running at http://localhost:${PORT}`);
});
