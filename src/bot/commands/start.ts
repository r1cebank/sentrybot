import config from 'config';
import Lowdb from 'lowdb';
import { Context } from 'telegraf';

import { DBSchema } from '../../db';
import { startKeyboard } from '../keyboard';

/**
 * Return the start command handler
 * @param db Lowdb database
 */
export const start = (db: Lowdb.LowdbAsync<DBSchema>) => async (
  ctx: Context
) => {
  const currentUser = ctx.from.id;

  const userRecord = await db.get('users').find({ id: currentUser }).value();
  if (!userRecord) {
    await db.get('users').push({ id: currentUser, notify: [] }).write();
    await ctx.reply(
      'Welcome to website watcher bot, if you are using this for scalping, FUCK YOU 🖕'
    );
    await ctx.reply(
      `Just wait for the in stock information here, I am checking the store every ${config.get(
        'refresh.interval'
      )} seconds.`
    );
    await ctx.reply(
      'As a new user, please select the notification you want to receive',
      startKeyboard
    );
  } else {
    await ctx.reply('You are an active user already.', startKeyboard);
  }
};
