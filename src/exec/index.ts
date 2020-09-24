import { UserRecord } from '../db';
import { RuleMap } from '../rules';

export * from './limiters';

export const getEnabledRulesMap = (
  users: readonly UserRecord[],
  rules: RuleMap
): ReadonlyMap<string, number> => {
  const enabledRules = new Map<string, number>();
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
