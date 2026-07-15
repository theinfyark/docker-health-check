import os from "node:os";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * Disk usage check.
 * Uses `fs.statfs` when available (Node 18.15+), otherwise verifies path is writable.
 *
 * @param {{ path?: string, maxUsedPercent?: number }} [options]
 * @returns {Promise<boolean>}
 */
export async function checkDisk(options = {}) {
  const target = options.path ?? process.cwd();
  const maxUsedPercent = options.maxUsedPercent ?? 90;

  try {
    if (typeof fs.statfs === "function") {
      const stats = await fs.statfs(target);
      const total = Number(stats.blocks) * Number(stats.bsize);
      const free = Number(stats.bavail) * Number(stats.bsize);
      if (!total) return true;
      const usedPercent = ((total - free) / total) * 100;
      return usedPercent < maxUsedPercent;
    }

    // Fallback: ensure we can write a tiny temp file.
    const probe = path.join(target, `.health-disk-${process.pid}`);
    await fs.writeFile(probe, "ok");
    await fs.unlink(probe);
    return true;
  } catch {
    return false;
  }
}

/**
 * Memory pressure check (system-level).
 *
 * @param {{ maxUsedPercent?: number }} [options]
 * @returns {Promise<boolean>}
 */
export async function checkMemory(options = {}) {
  const maxUsedPercent = options.maxUsedPercent ?? 95;
  const total = os.totalmem();
  const free = os.freemem();
  if (!total) return true;
  const usedPercent = ((total - free) / total) * 100;
  return usedPercent < maxUsedPercent;
}
