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

## Introduction

**docker-health-check** helps you ship reliable Node.js / TypeScript applications with a small, focused API.

## Why this package exists

Popular stacks need small, trustworthy utilities with excellent DX. **docker-health-check** exists to solve one problem well: clear APIs, strong typing, minimal dependencies, and production-ready defaults — without the overhead of larger frameworks.

## Installation

```bash
npm install docker-health-check
# or
pnpm add docker-health-check
yarn add docker-health-check
```

Requires Node.js 18+.

## API Reference

See the exports from `docker-health-check` and the inline TypeScript types for the full surface area. Primary entry points are documented in **Quick Start** and **Examples** above.

## Examples

Minimal usage is shown in **Quick Start**. Prefer copying those snippets first, then expand into your app’s error handling and configuration patterns.

## Advanced Examples

- Combine with environment validation, logging, and health checks in production services
- Prefer dependency injection / custom `fetch` / client injection in tests
- Keep configuration explicit; avoid hidden global state

## Framework Integration

Works with Express, Fastify, Hono, NestJS, and plain Node HTTP servers. Import ESM (or CJS where published) and call the documented APIs from route handlers, middleware, or background jobs.

## TypeScript Usage

```ts
import { /* symbols */ } from "docker-health-check";
```

Types ship with the package (`types` / `exports.types`). Enable `strict` in your `tsconfig` for the best DX.

## Error Handling

- Fail fast with typed / named errors where provided
- Never swallow errors silently in production paths
- Prefer returning structured error payloads in HTTP layers
- Surface actionable messages (what failed + how to fix)

## Performance

- Minimal runtime work on the hot path
- Avoid unnecessary allocations and dependencies
- Tree-shakeable ESM entry points
- Prefer streaming / lazy work when dealing with large payloads

## Best Practices

- Pin major versions with SemVer ranges you trust
- Validate configuration at process startup
- Add health checks and observability around I/O
- Write tests for failure modes (timeouts, bad input, missing credentials)

## FAQ

**Does it work with ESM and CommonJS?**  
Yes where the package publishes dual exports. Prefer ESM for new projects.

**Is it production-ready?**  
Yes — tests, types, and SemVer releases are part of the maintenance model.

**How do I report a bug?**  
Open a GitHub issue using the bug template.

## Migration Guide

### From 0.x / early drafts
This package follows SemVer. Breaking changes land in major releases and are called out in `CHANGELOG.md`.

### Upgrading patch/minor
Patch and minor releases are backward compatible. Run your test suite after upgrading.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `ERR_MODULE_NOT_FOUND` | Wrong Node version / bad import path | Use Node 18+ and package `exports` |
| Types not resolving | Old moduleResolution | Use `bundler` or `node16`+ |
| Auth / network failures | Missing env or blocked egress | Check credentials and firewall |
| Unexpected runtime errors | Invalid input | Validate options; read error message |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). PRs with tests and docs are welcome.

