const IS_DEV = process.env.NODE_ENV === "development";
const IS_SERVER = typeof window === "undefined";

// ANSI colors for terminal (server-side)
const ANSI = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
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
  { ansi: string; ansiBg: string; css: string; label: string }
> = {
  info: {
    ansi: ANSI.cyan,
    ansiBg: ANSI.bgCyan,
    css: "background:#0891b2;color:#fff",
    label: "INFO",
  },
  warn: {
    ansi: ANSI.yellow,
    ansiBg: ANSI.bgYellow,
    css: "background:#ca8a04;color:#fff",
    label: "WARN",
  },
  error: {
    ansi: ANSI.red,
    ansiBg: ANSI.bgRed,
    css: "background:#dc2626;color:#fff",
    label: "ERROR",
  },
  success: {
    ansi: ANSI.green,
    ansiBg: ANSI.bgGreen,
    css: "background:#16a34a;color:#fff",
    label: "OK",
  },
  debug: {
    ansi: ANSI.magenta,
    ansiBg: ANSI.bgMagenta,
    css: "background:#9333ea;color:#fff",
    label: "DEBUG",
  },
};

function formatTimestamp(): string {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}.${now.getMilliseconds().toString().padStart(3, "0")}`;
}

function logServer(
  level: LogLevel,
  namespace: string,
  message: string,
  data?: unknown,
): void {
  const config = LEVEL_CONFIG[level];
  const timestamp = formatTimestamp();

  const formatted = [
    `${ANSI.dim}${timestamp}${ANSI.reset}`,
    `${ANSI.bgBlue}${ANSI.white} SRV ${ANSI.reset}`,
    `${config.ansiBg}${ANSI.black} ${config.label} ${ANSI.reset}`,
    `${config.ansi}[${namespace}]${ANSI.reset}`,
    message,
  ].join(" ");

  if (data !== undefined) {
    console.log(formatted, data);
  } else {
    console.log(formatted);
  }
}

function logClient(
  level: LogLevel,
  namespace: string,
  message: string,
  data?: unknown,
): void {
  const config = LEVEL_CONFIG[level];
  const timestamp = formatTimestamp();

  const parts = [
    `%c ${timestamp} `,
    `%c CLI `,
    `%c ${config.label} `,
    `%c [${namespace}] `,
    `%c${message}`,
  ];

  const styles = [
    "color:#6b7280;font-size:10px",
    "background:#2563eb;color:#fff;border-radius:2px;font-size:10px",
    `${config.css};border-radius:2px;font-size:10px`,
    `color:${config.css.split("background:")[1]?.split(";")[0] || "#9333ea"};font-weight:600`,
    "color:inherit",
  ];

  if (data !== undefined) {
    console.log(parts.join(""), ...styles, data);
  } else {
    console.log(parts.join(""), ...styles);
  }
}

function log(
  level: LogLevel,
  namespace: string,
  message: string,
  data?: unknown,
): void {
  if (!IS_DEV) return;

  if (IS_SERVER) {
    logServer(level, namespace, message, data);
  } else {
    logClient(level, namespace, message, data);
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
