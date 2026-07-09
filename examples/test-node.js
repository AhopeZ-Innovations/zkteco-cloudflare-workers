import { ZKClient } from "../dist/index.js";
import { NodeTransport } from "../dist/transports/node/index.js";

console.log("Testing SDK connection with 1.1.1.1:4370...");

try {
  const transport = new NodeTransport({
    ip: "1.1.1.1",
    port: 4370,
    timeout: 10000,
  });
  const client = new ZKClient(transport);

  console.log("Transport and client instantiated. Connecting...");
  await client.createSocket();
  console.log("Connected successfully!");

  const sn = await client.getSerialNumber();
  console.log("Device Serial Number:", sn);

  const info = await client.getInfo();
  console.log("Device Info:", info);

  console.log("Disconnecting...");
  await client.disconnect();
  console.log("SUCCESS: Connection test finished.");
} catch (err) {
  console.error("FAILED:", err);
  process.exit(1);
}
