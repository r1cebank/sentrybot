import Telegraf, { Context, Markup } from 'telegraf';
import { MenuMiddleware } from 'telegraf-inline-menu/dist/source';

export const startKeyboard = Markup.keyboard([
  ['🖥 Select notification', '🗒 Check current selection'],
  ['🖼 Check last screenshot'],
])
  .oneTime()
  .resize()
  .extra();

export const setupStartKeyboardHandlers = (
  bot: Telegraf<Context>,
  middleware: MenuMiddleware<Context>
) => {
  bot.hears('🖥 Select notification', (context: Context) => {
    middleware.replyToContext(context);
  });
};
