type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel: LogLevel =
  (import.meta.env.VITE_LOG_LEVEL as LogLevel) ?? 'info';

const shouldLog = (level: LogLevel) =>
  LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];

const formatMessage = (level: LogLevel, message: string, context?: object) => {
  const timestamp = new Date().toISOString();
  return context
    ? `[${timestamp}] [${level.toUpperCase()}] ${message} ${JSON.stringify(context)}`
    : `[${timestamp}] [${level.toUpperCase()}] ${message}`;
};

const logger = {
  debug: (message: string, context?: object) => {
    if (shouldLog('debug')) console.debug(formatMessage('debug', message, context));
  },
  info: (message: string, context?: object) => {
    if (shouldLog('info')) console.info(formatMessage('info', message, context));
  },
  warn: (message: string, context?: object) => {
    if (shouldLog('warn')) console.warn(formatMessage('warn', message, context));
  },
  error: (message: string, context?: object) => {
    if (shouldLog('error')) console.error(formatMessage('error', message, context));
  },
};

export default logger;