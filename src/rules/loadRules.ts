import { promises as fs } from 'fs';
import path from 'path';

import yaml from 'yaml';

import { logger } from '../logger';

import { Rule } from './';

/**
 * Load all .yaml rules in directory
 * @param rulesDir The rules directory
 */
export const loadRules = async (rulesDir = 'rules') => {
  const files = await (await fs.readdir(rulesDir)).filter(
    (filename) => path.extname(filename) === '.yaml'
  );
  const rules = new Map<string, Rule>();
  await Promise.all(
    files.map(async (file) => {
      const yamlContent = await fs.readFile(path.join(rulesDir, file), {
        encoding: 'utf-8',
      });
      const parsedRule = <Rule>yaml.parse(yamlContent);
      logger.info(`Loaded rule: [${parsedRule.name}]`);
      rules.set(parsedRule.id, parsedRule);
    })
  );
  return rules;
};
