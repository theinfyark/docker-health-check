# docker-health-check

Docker / Kubernetes-ready **health checks** for cloud engineers.

```bash
npm install docker-health-check
```

## Checks

- Database (TCP or custom)
- Redis
- RabbitMQ
- HTTP endpoints
- Disk
- Memory

## Returns

```json
{
  "db": true,
  "redis": true,
  "disk": true,
  "healthy": true
}
```

## Quick start

```js
import { healthCheck } from "docker-health-check";

const result = await healthCheck({
  db: { host: "postgres", port: 5432 },
  redis: { host: "redis", port: 6379 },
  rabbitmq: { host: "rabbitmq", port: 5672 },
  http: "http://localhost:3000/ready",
  disk: true,
  memory: true,
});

console.log(result);
// { db: true, redis: true, rabbitmq: true, http: true, disk: true, memory: true, healthy: true }
```

## Express / Fastify style endpoint

```js
import express from "express";
import { healthHandler } from "docker-health-check";

const app = express();

app.get(
  "/health",
  healthHandler({
    db: { host: process.env.DB_HOST, port: 5432 },
    redis: true, // localhost:6379
    disk: { path: "/", maxUsedPercent: 90 },
    memory: { maxUsedPercent: 95 },
  }),
);
```

Returns **200** when healthy, **503** when any check fails — perfect for Docker `HEALTHCHECK` and K8s probes.

## Custom checks (real DB clients)

```js
await healthCheck({
  db: async () => {
    await pool.query("SELECT 1");
    return true;
  },
  redis: async () => {
    const pong = await redis.ping();
    return pong === "PONG";
  },
});
```

## Docker example

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "import('docker-health-check').then(async ({healthCheck})=>{const r=await healthCheck({redis:true,disk:true}); process.exit(r.healthy?0:1)})"
```

## Options

| Key | Forms |
|-----|--------|
| `db` / `redis` / `rabbitmq` | `true`, `{ host, port, timeoutMs }`, or `async () => boolean` |
| `http` | URL string, `{ url, method, expect }`, or custom function |
| `disk` | `true` or `{ path, maxUsedPercent }` |
| `memory` | `true` or `{ maxUsedPercent }` |

Default ports: Postgres `5432`, Redis `6379`, RabbitMQ `5672`.

## Zero dependencies

Uses Node built-ins only (`net`, `fs`, `os`, `fetch`).

## License

MIT
