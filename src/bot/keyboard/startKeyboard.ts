import Lowdb from 'lowdb';
import Telegraf, { Context, Markup } from 'telegraf';
import { MenuMiddleware } from 'telegraf-inline-menu';

import { DBSchema } from '../../db';
import { RuleMap } from '../../rules';

export const startKeyboard = Markup.keyboard([
  ['🖥 Select notification', '🗒 Check selection'],
  ['🖼 Check screenshot'],
])
  .oneTime()
  .resize()
  .extra();

/**
 *
 * @param bot The telegraf bot instance
 * @param rules Rule map loaded from files
 * @param db Lowdb database
 * @param selectSourceMiddleware Select source middleware
 * @param selectScreenshotMiddleware Select screenshot middleware
 */
export const setupStartKeyboardHandlers = (
  bot: Telegraf<Context>,
  rules: RuleMap,
  db: Lowdb.LowdbAsync<DBSchema>,
  middlewares: ReadonlyMap<string, MenuMiddleware<Context>>
) => {
  bot.hears('🖥 Select notification', (context: Context) => {
    middlewares.get('select-notification').replyToContext(context);
  });

  bot.hears('🖼 Check screenshot', (context: Context) => {
    middlewares.get('select-screenshot').replyToContext(context);
  });

  bot.hears('🗒 Check selection', async (context: Context) => {
    const currentUser = context.from.id;
    const userRecord = await db.get('users').find({ id: currentUser }).value();
    if (userRecord) {
      const { notify } = userRecord;
      if (notify.length) {
        const enabledNotify = notify.map((id) => rules.get(id).name).join(', ');
        await context.reply(`You currently have ${enabledNotify} enabled.`);
      } else {
        await context.reply('You do not have active notification selected');
      }
    } else {
      await context.reply(
        'You are not a active user, please use /start to activate.'
      );
    }
  });
};
