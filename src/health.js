import { checkTcp, checkHttp } from "./probes.js";
import { checkDisk, checkMemory } from "./system.js";

/**
 * @typedef {object} TcpTarget
 * @property {string} [host]
 * @property {number} port
 * @property {number} [timeoutMs]
 */

/**
 * @typedef {(() => boolean | Promise<boolean>) | TcpTarget | boolean} ServiceCheck
 */

/**
 * Normalize a check into an async boolean function.
 * @param {ServiceCheck | undefined} value
 * @param {number} defaultPort
 * @returns {null | (() => Promise<boolean>)}
 */
function normalizeService(value, defaultPort) {
  if (value === undefined || value === false) return null;
  if (value === true) {
    return () => checkTcp({ port: defaultPort });
  }
  if (typeof value === "function") {
    return async () => Boolean(await value());
  }
  if (typeof value === "object" && value && "port" in value) {
    return () => checkTcp(value);
  }
  return null;
}

/**
 * Run configured health checks in parallel.
 *
 * @param {{
 *   db?: ServiceCheck,
 *   redis?: ServiceCheck,
 *   rabbitmq?: ServiceCheck,
 *   http?: string | Parameters<typeof checkHttp>[0] | (() => boolean | Promise<boolean>),
 *   disk?: boolean | Parameters<typeof checkDisk>[0],
 *   memory?: boolean | Parameters<typeof checkMemory>[0],
 *   timeoutMs?: number
 * }} [config]
 * @returns {Promise<Record<string, boolean> & { healthy: boolean }>}
 *
 * @example
 * ```js
 * const result = await healthCheck({
 *   db: { host: "localhost", port: 5432 },
 *   redis: { host: "localhost", port: 6379 },
 *   disk: true,
 *   memory: true,
 * });
 * // { db: true, redis: true, disk: true, memory: true, healthy: true }
 * ```
 */
export async function healthCheck(config = {}) {
  /** @type {Record<string, () => Promise<boolean>>} */
  const jobs = {};

  const db = normalizeService(config.db, 5432);
  if (db) jobs.db = db;

  const redis = normalizeService(config.redis, 6379);
  if (redis) jobs.redis = redis;

  const rabbitmq = normalizeService(config.rabbitmq, 5672);
  if (rabbitmq) jobs.rabbitmq = rabbitmq;

  if (config.http !== undefined && config.http !== false) {
    if (typeof config.http === "function") {
      jobs.http = async () => Boolean(await config.http());
    } else {
      jobs.http = () => checkHttp(/** @type {any} */ (config.http));
    }
  }

  if (config.disk !== undefined && config.disk !== false) {
    const diskOpts = config.disk === true ? {} : config.disk;
    jobs.disk = () => checkDisk(diskOpts);
  }

  if (config.memory !== undefined && config.memory !== false) {
    const memOpts = config.memory === true ? {} : config.memory;
    jobs.memory = () => checkMemory(memOpts);
  }

  /** @type {Record<string, boolean>} */
  const result = {};
  const entries = Object.entries(jobs);

  await Promise.all(
    entries.map(async ([key, fn]) => {
      try {
        result[key] = await fn();
      } catch {
        result[key] = false;
      }
    }),
  );

  const healthy = Object.values(result).every(Boolean);
  return { ...result, healthy };
}

/**
 * Express middleware exposing a health endpoint.
 *
 * @param {Parameters<typeof healthCheck>[0]} [config]
 * @returns {import('express').RequestHandler}
 *
 * @example
 * app.get('/health', healthHandler({ redis: true, disk: true }))
 */
export function healthHandler(config = {}) {
  return async (_req, res) => {
    const result = await healthCheck(config);
    const status = result.healthy ? 200 : 503;
    res.status(status).json(result);
  };
}
