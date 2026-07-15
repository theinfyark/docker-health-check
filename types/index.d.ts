/** Minimal Express/Connect middleware shape (no express dependency required). */
export type RequestHandler = (
  req: any,
  res: any,
  next?: (err?: any) => void,
) => void | Promise<void>;

export interface TcpTarget {
  host?: string;
  port: number;
  timeoutMs?: number;
}

export type ServiceCheck =
  | (() => boolean | Promise<boolean>)
  | TcpTarget
  | boolean;

export interface HttpProbeOptions {
  url: string;
  method?: string;
  timeoutMs?: string | number;
  expect?: number | number[];
}

export interface DiskCheckOptions {
  path?: string;
  maxUsedPercent?: number;
}

export interface MemoryCheckOptions {
  maxUsedPercent?: number;
}

export interface HealthCheckConfig {
  db?: ServiceCheck;
  redis?: ServiceCheck;
  rabbitmq?: ServiceCheck;
  http?:
    | string
    | HttpProbeOptions
    | (() => boolean | Promise<boolean>)
    | false;
  disk?: boolean | DiskCheckOptions;
  memory?: boolean | MemoryCheckOptions;
  timeoutMs?: number;
}

export type HealthCheckResult = Record<string, boolean> & {
  healthy: boolean;
};

export function checkTcp(options: TcpTarget): Promise<boolean>;

export function checkHttp(
  target: string | HttpProbeOptions,
): Promise<boolean>;

export function checkDisk(options?: DiskCheckOptions): Promise<boolean>;

export function checkMemory(options?: MemoryCheckOptions): Promise<boolean>;

export function healthCheck(
  config?: HealthCheckConfig,
): Promise<HealthCheckResult>;

export function healthHandler(config?: HealthCheckConfig): RequestHandler;
