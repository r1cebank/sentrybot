import config from 'config';
import mkdirp from 'mkdirp';

import { bot, setupBot } from './bot';
import { getDb } from './db';
import { logger } from './logger';
import { loadRules } from './rules';

async function startBot() {
  logger.info('Loading rules...');
  const rules = await loadRules();

  // Create the images dir
  await mkdirp(config.get('images.path'));

  // Get database, local using lowdb
  const db = await getDb();

  // Setup the bot with current rules
  setupBot(rules, db);
  bot.launch();
}

startBot().catch((error: Error) => {
  logger.error(`Bot encountered an error ${error.message}`, error);
  process.exit(1);
});
