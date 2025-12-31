const IS_DEV = process.env.NODE_ENV === "development";

const COLORS = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",

  // Foreground
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",

  // Background
  bgBlack: "\x1b[40m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
  bgWhite: "\x1b[47m",
} as const;

type LogLevel = "info" | "warn" | "error" | "success" | "debug";

const LEVEL_CONFIG: Record<
  LogLevel,
  { color: string; bg: string; label: string }
> = {
  info: { color: COLORS.cyan, bg: COLORS.bgCyan, label: "INFO" },
  warn: { color: COLORS.yellow, bg: COLORS.bgYellow, label: "WARN" },
  error: { color: COLORS.red, bg: COLORS.bgRed, label: "ERROR" },
  success: { color: COLORS.green, bg: COLORS.bgGreen, label: "OK" },
  debug: { color: COLORS.magenta, bg: COLORS.bgMagenta, label: "DEBUG" },
};

function formatTimestamp(): string {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}.${now.getMilliseconds().toString().padStart(3, "0")}`;
}

function formatMessage(
  level: LogLevel,
  namespace: string,
  message: string,
): string {
  const config = LEVEL_CONFIG[level];
  const timestamp = formatTimestamp();

  return [
    `${COLORS.dim}${timestamp}${COLORS.reset}`,
    `${config.bg}${COLORS.black} ${config.label} ${COLORS.reset}`,
    `${config.color}[${namespace}]${COLORS.reset}`,
    message,
  ].join(" ");
}

function log(
  level: LogLevel,
  namespace: string,
  message: string,
  data?: unknown,
): void {
  if (!IS_DEV) return;

  const formatted = formatMessage(level, namespace, message);

  if (data !== undefined) {
    console.log(formatted, data);
  } else {
    console.log(formatted);
  }
}

type DebugLogger = {
  (message: string, data?: unknown): void;
  info: (message: string, data?: unknown) => void;
  warn: (message: string, data?: unknown) => void;
  error: (message: string, data?: unknown) => void;
  success: (message: string, data?: unknown) => void;
};

export function createDebug(namespace: string): DebugLogger {
  const logger = ((message: string, data?: unknown) => {
    log("debug", namespace, message, data);
  }) as DebugLogger;

  logger.info = (message: string, data?: unknown) =>
    log("info", namespace, message, data);
  logger.warn = (message: string, data?: unknown) =>
    log("warn", namespace, message, data);
  logger.error = (message: string, data?: unknown) =>
    log("error", namespace, message, data);
  logger.success = (message: string, data?: unknown) =>
    log("success", namespace, message, data);

  return logger;
}

export const debug = {
  transport: createDebug("Transport"),
  chat: createDebug("Chat"),
  auth: createDebug("Auth"),
  trpc: createDebug("tRPC"),
  api: createDebug("API"),
};
