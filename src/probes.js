import net from "node:net";

/**
 * TCP connectivity probe.
 *
 * @param {{ host?: string, port: number, timeoutMs?: number }} options
 * @returns {Promise<boolean>}
 */
export function checkTcp(options) {
  const host = options.host ?? "127.0.0.1";
  const port = options.port;
  const timeoutMs = options.timeoutMs ?? 2000;

  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    let settled = false;

    const done = (ok) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(ok);
    };

    socket.setTimeout(timeoutMs);
    socket.on("connect", () => done(true));
    socket.on("timeout", () => done(false));
    socket.on("error", () => done(false));
  });
}

/**
 * HTTP(S) probe via fetch.
 *
 * @param {string | { url: string, method?: string, timeoutMs?: string | number, expect?: number | number[] }} target
 * @returns {Promise<boolean>}
 */
export async function checkHttp(target) {
  const cfg =
    typeof target === "string"
      ? { url: target, method: "GET", timeoutMs: 3000, expect: [200, 204] }
      : {
          url: target.url,
          method: target.method ?? "GET",
          timeoutMs: target.timeoutMs ?? 3000,
          expect: target.expect ?? [200, 204],
        };

  const expect = Array.isArray(cfg.expect) ? cfg.expect : [cfg.expect];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Number(cfg.timeoutMs));

  try {
    const res = await fetch(cfg.url, {
      method: cfg.method,
      signal: controller.signal,
    });
    return expect.includes(res.status);
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
