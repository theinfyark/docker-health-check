import { describe, it } from "node:test";
import assert from "node:assert/strict";
import net from "node:net";
import http from "node:http";
import {
  healthCheck,
  checkTcp,
  checkHttp,
  checkDisk,
  checkMemory,
} from "../src/index.js";

function listenTcp() {
  return new Promise((resolve) => {
    const server = net.createServer(() => {});
    server.listen(0, "127.0.0.1", () => {
      const addr = /** @type {import('net').AddressInfo} */ (server.address());
      resolve({ server, port: addr.port });
    });
  });
}

describe("docker-health-kit", () => {
  it("returns booleans for configured checks", async () => {
    const { server, port } = await listenTcp();

    try {
      const result = await healthCheck({
        db: { host: "127.0.0.1", port },
        redis: { host: "127.0.0.1", port: 1 }, // closed
        // High ceilings so CI/dev hosts near capacity do not flake.
        disk: { path: process.cwd(), maxUsedPercent: 100 },
        memory: { maxUsedPercent: 100 },
      });

      assert.equal(result.db, true);
      assert.equal(result.redis, false);
      assert.equal(result.disk, true);
      assert.equal(result.memory, true);
      assert.equal(result.healthy, false);
    } finally {
      server.close();
    }
  });

  it("checks HTTP endpoints", async () => {
    const server = http.createServer((_req, res) => {
      res.writeHead(200);
      res.end("ok");
    });

    await new Promise((r) => server.listen(0, "127.0.0.1", r));
    const addr = /** @type {import('net').AddressInfo} */ (server.address());

    try {
      assert.equal(
        await checkHttp(`http://127.0.0.1:${addr.port}/health`),
        true,
      );
      assert.equal(await checkHttp("http://127.0.0.1:1/nope"), false);
    } finally {
      server.close();
    }
  });

  it("supports custom check functions", async () => {
    const result = await healthCheck({
      db: async () => true,
      rabbitmq: async () => false,
    });

    assert.deepEqual(
      { db: result.db, rabbitmq: result.rabbitmq, healthy: result.healthy },
      { db: true, rabbitmq: false, healthy: false },
    );
  });

  it("TCP probe works", async () => {
    const { server, port } = await listenTcp();
    try {
      assert.equal(await checkTcp({ host: "127.0.0.1", port }), true);
      assert.equal(await checkTcp({ host: "127.0.0.1", port: 1, timeoutMs: 200 }), false);
    } finally {
      server.close();
    }
  });

  it("disk and memory probes return boolean", async () => {
    assert.equal(typeof (await checkDisk()), "boolean");
    assert.equal(typeof (await checkMemory()), "boolean");
    assert.equal(await checkDisk({ path: process.cwd() }), true);
  });

  it("matches the documented shape", async () => {
    const result = await healthCheck({
      db: async () => true,
      redis: async () => true,
      disk: true,
    });

    assert.deepEqual(
      { db: result.db, redis: result.redis, disk: result.disk },
      { db: true, redis: true, disk: true },
    );
  });
});
