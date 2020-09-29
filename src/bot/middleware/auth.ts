import config from 'config';
import { Context } from 'telegraf';

export const authMiddleware = async (
  context: Context,
  next: () => Promise<void>
) => {
  const currentUser = context.from.id;
  const whitelistUsers = <string>config.get('telegram.whitelist');
  if (whitelistUsers) {
    if (whitelistUsers.split(',').includes(`${currentUser}`)) {
      next();
    } else {
      context.reply('🚫 Sorry, you are not authorized to use this bot');
    }
  } else {
    next();
  }
};
