import fs from 'fs';
import { promises as fsPromises } from 'fs';
import path from 'path';

import config from 'config';
import { MenuMiddleware, MenuTemplate } from 'telegraf-inline-menu';

import { ContextWithSession } from '..';
import { RuleMap } from '../../rules';

export const selectScreenshotMenu = new MenuTemplate(
  'Please select a notification source to check the last screenshot.'
);

/**
 * Setup the selection screenshot menu using the rules loaded
 * @param rules The rule map loaded from files
 */
export const setupSelectScreenshotMenu = (rules: RuleMap) => {
  selectScreenshotMenu.choose(
    'select-screenshot',
    () => {
      const map = new Map();
      Array.from(rules.keys())
        .filter((r) => rules.get(r).type === 'website')
        .forEach((r) => map.set(r, rules.get(r).name));
      return map;
    },
    {
      columns: 1,
      maxRows: 4,
      getCurrentPage: (context: ContextWithSession) =>
        <number>context.session.screenshot_page || 0,
      setPage: (context: ContextWithSession, page) => {
        // eslint-disable-next-line functional/immutable-data
        context.session.screenshot_page = page;
      },
      do: async (context: ContextWithSession, key) => {
        try {
          await fsPromises.stat(
            path.join(config.get('image.path'), `${key}.png`)
          );
          await context.reply('Here is the last screenshot photo:');
          await context.replyWithPhoto({
            source: fs.createReadStream(
              path.join(config.get('image.path'), `${key}.png`)
            ),
          });
        } catch (error) {
          await context.reply(
            `Selected source: ${rules[key].name} has no last check screenshot`
          );
        }
        return true;
      },
    }
  );

  return new MenuMiddleware('/screenshot/', selectScreenshotMenu);
};
