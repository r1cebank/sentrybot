import Bottleneck from 'bottleneck';
import Lowdb from 'lowdb';

import { DBSchema } from '../../db';
import { getEnabledRulesMap } from '../../exec';
import { RuleMap } from '../../rules';
import { Singleton } from '../../singleton';

/**
 * The /status command handler
 * @param db Lowdb database
 * @param rules Rules map loaded from files
 * @param limiters Limiters for each rule
 * @param runResults The results map that contains the last rule results
 */
export const status = (
  db: Lowdb.LowdbAsync<DBSchema>,
  rules: RuleMap,
  limiters: ReadonlyMap<string, Bottleneck>
) => async (context) => {
  const enabledRulesMap = await getEnabledRulesMap(db, rules);
  const enabledRules = Array.from(enabledRulesMap.keys());
  if (enabledRules.length) {
    await context.reply(
      `Refreshing for ${enabledRules.map((r) => rules.get(r).name).join(', ')}`
    );
  } else {
    await context.reply('Not refreshing for any rule.');
  }
  await context.reply(`Uptime: ${Math.floor(process.uptime() / 60)} minutes`);
  await Promise.all(
    Array.from(rules.keys()).map(async (id) => {
      const limiter = limiters.get(id);
      const limiterStat = limiter.counts();
      await context.reply(
        `Job: ${id}\nEnabled: ${
          enabledRulesMap.get(id) ? 'active' : 'inactive'
        }\nTriggered: ${Singleton.getTriggerStatus(id)}\nQueued: ${
          limiterStat.QUEUED || 0
        }\nRunning: ${limiterStat.RUNNING || 0}\nDone: ${limiterStat.DONE || 0}`
      );
    })
  );
};
