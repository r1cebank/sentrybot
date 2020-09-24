import Lowdb from 'lowdb';
import { Context } from 'telegraf';
import { MenuMiddleware, MenuTemplate } from 'telegraf-inline-menu';

import { ContextWithSession } from '..';
import { DBSchema } from '../../db';
import { RuleMap } from '../../rules';

export const selectSourceMenu = new MenuTemplate(
  'Please select a notification source to receive from.'
);

/**
 * Setup the select notification menu using rules loaded
 * @param db Lowdb database
 * @param rules Rule map loaded from files
 */
export const setupSelectSourceMenu = (
  db: Lowdb.LowdbAsync<DBSchema>,
  rules: RuleMap
) => {
  selectSourceMenu.select(
    'select-source',
    () => {
      const map = new Map();
      Array.from(rules.keys()).forEach((r) => map.set(r, rules.get(r).name));
      return map;
    },
    {
      columns: 1,
      maxRows: 4,
      getCurrentPage: (context: ContextWithSession) =>
        <number>context.session.notification_page || 0,
      setPage: (context: ContextWithSession, page) => {
        // eslint-disable-next-line functional/immutable-data
        context.session.notification_page = page;
      },
      set: async (context: Context, key) => {
        const currentUser = context.from.id;
        const user = await db.get('users').find({ id: currentUser }).value();
        const rule = rules.get(key);
        if (rule) {
          if (user) {
            if (user.notify && !user.notify.includes(key)) {
              const newNotifyFor = user.notify.concat(key);
              await db
                .get('users')
                .find({ id: currentUser })
                .assign({ notify: newNotifyFor })
                .write();
              await context.answerCbQuery(
                `Receiving notification from ${rule.name} ✅`
              );
            } else {
              const newNotifyFor = user.notify.filter((k) => k !== key);
              await db
                .get('users')
                .find({ id: currentUser })
                .assign({ notify: newNotifyFor })
                .write();
              await context.answerCbQuery(
                `Stopped notification from ${rule.name} ❌`
              );
            }
          }
        } else {
          await context.answerCbQuery(`Rule ${key}, is not found.`);
        }
        return true;
      },
      isSet: async (context: Context, key) => {
        const currentUser = context.from.id;
        const user = await db.get('users').find({ id: currentUser }).value();
        if (user) {
          if (user.notify && user.notify.includes(key)) {
            return true;
          }
        }
        return false;
      },
    }
  );

  return new MenuMiddleware('/select/', selectSourceMenu);
};
