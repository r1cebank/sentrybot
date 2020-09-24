import path from 'path';

import config from 'config';
import Lowdb from 'lowdb';
import { Context, Telegraf } from 'telegraf';
import LocalSession from 'telegraf-session-local';

import { DBSchema } from '../db';
import { RuleMap } from '../rules/Rule';

import { start } from './commands';
import { setupStartKeyboardHandlers } from './keyboard';
import { setupSelectScreenshotMenu, setupSelectSourceMenu } from './menu';

export const bot = new Telegraf(config.get('telegram.token'));

export type ContextWithSession = Context & {
  // eslint-disable-next-line functional/prefer-readonly-type
  readonly session: { [key: string]: unknown };
};

/**
 * Setup the telegram bot, setup all the handlers and middleware
 * @param rules The rule map loaded from files
 * @param db Lowdb database
 */
export const setupBot = (rules: RuleMap, db: Lowdb.LowdbAsync<DBSchema>) => {
  bot.use(
    new LocalSession({
      database: path.join(
        config.get('session.path'),
        config.get('session.file')
      ),
    }).middleware()
  );
  bot.command('start', start(db));

  const selectSourceMiddleware = setupSelectSourceMenu(db, rules);
  bot.use(selectSourceMiddleware.middleware());

  const selectScreenshotMiddleware = setupSelectScreenshotMenu(rules);
  bot.use(selectScreenshotMiddleware.middleware());

  setupStartKeyboardHandlers(
    bot,
    rules,
    db,
    selectSourceMiddleware,
    selectScreenshotMiddleware
  );
};
