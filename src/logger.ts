import config from 'config';
import pino from 'pino';

export const logger = pino({
  level: config.get('logLevel'),
  prettyPrint: true,
});
