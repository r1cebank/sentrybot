import config from 'config';
import mkdirp from 'mkdirp';

import { bot, setupBot } from './bot';
import { getDb } from './db';
import { checkLoop, createLimiters } from './exec';
import { logger } from './logger';
import { loadRules } from './rules';

/**
 * Start the bot and start fetching
 */
async function startBot() {
  const rules = await loadRules();

  // Create the images dir
  await mkdirp(config.get('images.path'));

  // Get all the rate limiters for rules
  const limiters = createLimiters(rules);

  // Get database, local using lowdb
  const db = await getDb();

  // Setup the bot with current rules
  setupBot(rules, db, limiters);

  // Launch the bot
  bot.launch();

  // Schedule the refresh jobs
  setInterval(
    checkLoop(bot, db, rules, limiters),
    parseInt(config.get('refresh.interval')) * 1000
  );
}

startBot().catch((error: Error) => {
  logger.error(`Bot encountered an error ${error.message}`, error);
  process.exit(1);
});
