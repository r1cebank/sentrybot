import Bottleneck from 'bottleneck';
import config from 'config';

import { RuleMap } from '../rules';

export type EnabledRulesMap = ReadonlyMap<string, boolean>;

/**
 * Create a map of limiters for the rules loaded
 * @param rules The rules map from loaded rules
 */
export const createLimiters = (
  rules: RuleMap
): ReadonlyMap<string, Bottleneck> => {
  const ruleKeys = Array.from(rules.keys());
  const limiterMap = new Map<string, Bottleneck>();
  ruleKeys.forEach((k) => {
    limiterMap.set(
      k,
      new Bottleneck({
        highWater: 1,
        maxConcurrent: 1,
        trackDoneStatus: true,
        minTime: 1000 * parseInt(config.get('refresh.interval')) + 100,
      })
    );
  });

  return limiterMap;
};
