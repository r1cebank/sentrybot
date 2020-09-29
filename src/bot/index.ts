import path from 'path';

import Bottleneck from 'bottleneck';
import config from 'config';
import Lowdb from 'lowdb';
import { Context, Telegraf } from 'telegraf';
import { MenuMiddleware } from 'telegraf-inline-menu/dist/source';
import LocalSession from 'telegraf-session-local';
import { TelegrafContext } from 'telegraf/typings/context';

import { DBSchema } from '../db';
import { RuleMap } from '../rules/Rule';

import { start, status } from './commands';
import { setupStartKeyboardHandlers } from './keyboard';
import { setupSelectScreenshotMenu, setupSelectSourceMenu } from './menu';
import { authMiddleware } from './middleware';

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
export const setupBot = (
  rules: RuleMap,
  db: Lowdb.LowdbAsync<DBSchema>,
  limiters: ReadonlyMap<string, Bottleneck>
) => {
  // Setup middleware
  bot.use(authMiddleware);

  bot.use(
    new LocalSession({
      database: path.join(
        config.get('session.path'),
        config.get('session.file')
      ),
    }).middleware()
  );
  bot.command('start', start(db));
  bot.command('status', status(db, rules, limiters));

  const selectSourceMiddleware = setupSelectSourceMenu(db, rules);
  bot.use(selectSourceMiddleware.middleware());

  const selectScreenshotMiddleware = setupSelectScreenshotMenu(rules);
  bot.use(selectScreenshotMiddleware.middleware());

  const middlewares = new Map<string, MenuMiddleware<TelegrafContext>>([
    ['select-notification', selectSourceMiddleware],
    ['select-screenshot', selectScreenshotMiddleware],
  ]);

  setupStartKeyboardHandlers(bot, rules, db, middlewares);
};
