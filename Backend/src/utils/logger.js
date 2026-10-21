import pino from 'pino';
import pinoPretty from 'pino-pretty';
import fs from 'fs';
import path from 'path';

const isDevelopment = process.env.NODE_ENV !== 'production';
const logDir = path.join(process.cwd(), 'logs');

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Sensitive data patterns to redact
const sensitivePatterns = [
  /password/i,
  /otp/i,
  /token/i,
  /refreshToken/i,
  /accessToken/i,
  /privateKey/i,
  /secret/i,
  /balance/i,
  /wallet/i,
  /amount/i,
  /payment/i,
  /credit/i,
  /debit/i,
  /withdrawal/i,
  /deposit/i,
  /transaction/i,
  /trade/i,
];

/**
 * Redact sensitive data from log objects
 */
function redactSensitiveData(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => redactSensitiveData(item));
  }

  const redacted = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const isSensitive = sensitivePatterns.some(pattern => pattern.test(key));
      
      if (isSensitive) {
        redacted[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        redacted[key] = redactSensitiveData(obj[key]);
      } else {
        redacted[key] = obj[key];
      }
    }
  }
  
  return redacted;
}

// Pino configuration
const pinoConfig = {
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  redact: {
    paths: [
      'password',
      'otp',
      'token',
      'refreshToken',
      'accessToken',
      'privateKey',
      'secret',
      'balance',
      'wallet',
      'amount',
      'payment',
    ],
    remove: true,
  },
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
};

// Development: Pretty console output + file logging
let logger;
if (isDevelopment) {
  logger = pino({
    ...pinoConfig,
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  });
} 
// Production: JSON structured logs with file rotation
else {
  logger = pino({
    ...pinoConfig,
    transport: {
      target: 'pino/file',
      options: {
        destination: path.join(logDir, 'app.log'),
        mkdir: true,
        maxSize: '100M',
        maxFiles: 30, // Keep logs for 30 days
      },
    },
  });
}

/**
 * Helper function to log with automatic redaction
 */
logger.logWithRedaction = (level, message, data = {}) => {
  const redactedData = redactSensitiveData(data);
  logger[level]({ ...redactedData }, message);
};

/**
 * Convenience methods
 */
logger.infoSafe = (message, data) => logger.logWithRedaction('info', message, data);
logger.errorSafe = (message, data) => logger.logWithRedaction('error', message, data);
logger.warnSafe = (message, data) => logger.logWithRedaction('warn', message, data);
logger.debugSafe = (message, data) => logger.logWithRedaction('debug', message, data);

export default logger;
