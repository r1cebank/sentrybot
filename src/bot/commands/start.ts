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
  context: Context
) => {
  const currentUser = context.from.id;

  const userRecord = await db.get('users').find({ id: currentUser }).value();
  if (!userRecord) {
    await db.get('users').push({ id: currentUser, notify: [] }).write();
    await context.reply(
      'Welcome to website watcher bot, if you are using this for scalping, FUCK YOU 🖕'
    );
    await context.reply(
      `Just wait for the in stock information here, I am checking the store every ${config.get(
        'refresh.interval'
      )} seconds.`
    );
    await context.reply(
      'As a new user, please select the notification you want to receive',
      startKeyboard
    );
  } else {
    await context.reply('You are an active user already.', startKeyboard);
  }
};
