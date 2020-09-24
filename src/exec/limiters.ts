import Bottleneck from 'bottleneck';
import config from 'config';

import { RuleMap } from '../rules';

export type Limiters = ReadonlyMap<string, Bottleneck>;
export type EnabledRulesMap = ReadonlyMap<string, boolean>;

export const createLimiters = (rules: RuleMap): Limiters => {
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
