import fs from 'fs';

import Bottleneck from 'bottleneck';
import Lowdb from 'lowdb';
import Telegraf, { Context } from 'telegraf';

import { DBSchema } from '../db';
import { logger } from '../logger';
import { Rule, RuleMap } from '../rules';
import { Singleton } from '../singleton';

import { executeWebsite } from './website';

export * from './limiters';

export type WebExecuteResult = {
  readonly name: string;
  readonly id: string;
  readonly triggered: boolean;
  readonly screenshot?: string;
  readonly error?: Error;
};

export type RunResults = {
  readonly triggered: boolean;
  readonly runStatus: string;
};

export type ExecuteResult = WebExecuteResult;

/**
 * Get list of enabled rules from user entries in database
 * @param db Lowdb database
 * @param rules The rule map loaded from files
 */
export const getEnabledRulesMap = async (
  db: Lowdb.LowdbAsync<DBSchema>,
  rules: RuleMap
): Promise<ReadonlyMap<string, number>> => {
  const enabledRules = new Map<string, number>();
  const users = await db.get('users').value();
  users.forEach((user) => {
    user.notify.forEach((ruleKey) => {
      // If rule do not exist in the rule map, ignore it
      if (rules.get(ruleKey)) {
        if (!enabledRules.get(ruleKey)) {
          enabledRules.set(ruleKey, 0);
        }
        enabledRules.set(ruleKey, enabledRules.get(ruleKey) + 1);
      }
    });
  });

  return enabledRules;
};

/**
 * Check the rule and return the results
 * @param rule The rule definition to check for
 */
export const checkRule = async (rule: Rule): Promise<ExecuteResult> => {
  switch (rule.type) {
    case 'website':
      return executeWebsite(rule);
  }
};

/**
 * This is the function executed in interval by setInterval, it dispatches rules to the limiters
 * @param bot The telegraf bot instance
 * @param db Lowdb database
 * @param rules Rules map loaded from files
 * @param limiters Map of all the rate limiters for rules
 */
export const checkLoop = (
  bot: Telegraf<Context>,
  db: Lowdb.LowdbAsync<DBSchema>,
  rules: RuleMap,
  limiters: ReadonlyMap<string, Bottleneck>
) => async () => {
  const enabledRules = await getEnabledRulesMap(db, rules);
  await Promise.all(
    Array.from(enabledRules.keys()).map(async (ruleId) => {
      logger.info(`Scheduling rule for ${ruleId}...`);
      const limiter = limiters.get(ruleId);
      const rule = rules.get(ruleId);
      try {
        const checkResults = await limiter.schedule(() => checkRule(rule));
        // Rule is triggered
        if (checkResults.triggered && !Singleton.getTriggerStatus(ruleId)) {
          Singleton.setTriggerStatus(ruleId, true);
          const users = await db.get('users').value();
          await Promise.all(
            users.map(async (user) => {
              const { notify } = user;
              // If user has that notification set
              if (notify.includes(ruleId)) {
                await bot.telegram.sendMessage(
                  user.id,
                  `${rule.name} has triggered.`
                );
                if (checkResults.screenshot) {
                  await bot.telegram.sendPhoto(user.id, {
                    source: fs.createReadStream(checkResults.screenshot),
                  });
                }
              }
            })
          );
        }
        if (
          !checkResults.triggered &&
          !checkResults.error &&
          Singleton.getTriggerStatus(ruleId)
        ) {
          logger.info(`Resetting triggered status for ${ruleId}`);
          Singleton.setTriggerStatus(ruleId, false);
        }
        if (checkResults.error) {
          logger.error(checkResults.error.message, checkResults.error);
        }
      } catch (error: unknown) {
        if (error instanceof Bottleneck.BottleneckError) {
          logger.error(
            `Job is dropped by the limiter: ${ruleId}`,
            <Bottleneck.BottleneckError>error
          );
        } else {
          logger.error((<Error>error).message, error);
        }
      }
    })
  );
};
