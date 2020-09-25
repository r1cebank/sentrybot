import path from 'path';

import config from 'config';
import puppeteer from 'puppeteer';
import randomUseragent from 'random-useragent';

import { WebExecuteResult } from '..';
import { logger } from '../../logger';
import { ConditionType, Rule } from '../../rules';

import * as jQuery from './jquery';

/**
 * Execute a website rule and return the check result
 * @param rule The rule definition to check for
 */
export const executeWebsite = async (rule: Rule): Promise<WebExecuteResult> => {
  const { name, id, url, validateFor, notifyFor } = rule;
  logger.info(`Execute website rule ${name}`);

  // Create a new page
  const browser = await puppeteer.launch({
    args: ['--disable-dev-shm-usage', '--no-sandbox'],
  });

  // Using finally to make sure browser always close
  try {
    const page = await browser.newPage();
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });

    await page.setUserAgent(randomUseragent.getRandom());

    await page.setCacheEnabled(false);

    // Browse to the site
    await page.goto(url);

    // Inject jquery
    await page.addScriptTag({
      url: 'https://code.jquery.com/jquery-3.3.1.slim.min.js',
    });

    // Wait for the selectors
    await Promise.all(
      validateFor.map(async (validateCondition) => {
        const { type, condition, selector } = validateCondition;
        logger.info(`Checking for wait condition: ${type}: ${selector}`);
        const webValue = (await jQuery.getVal(page, selector)).trim();
        if (type === 'selector') {
          if (condition.condition === ConditionType.EXISTS) {
            await jQuery.waitForElement(page, selector, 5000);
          }
          if (condition.condition === ConditionType.EQUAL) {
            if (webValue !== condition.value) {
              return {
                id,
                name,
                triggered: false,
                error: new Error(
                  `Wait selector failed for ${name}, selector: ${selector}, expected ${condition.value}`
                ),
              };
            }
          }
          if (condition.condition === ConditionType.NOT_EQUAL) {
            if (webValue === condition.value) {
              return {
                id,
                name,
                triggered: false,
                error: new Error(
                  `Wait selector failed for ${name}, selector: ${selector}, expected not ${condition.value}`
                ),
              };
            }
          }
        }
        return {
          name,
          id,
          triggered: false,
        };
      })
    );
    // Take screenshot
    await page.screenshot({
      path: path.join(config.get('images.path'), `${id}.png`),
      fullPage: false,
    });

    // Check for notify conditions
    const checkResults = await Promise.all(
      notifyFor.map(
        async (notifyCondition): Promise<boolean> => {
          const { type, selector, condition } = notifyCondition;
          logger.info(`Checking for check condition: ${type}: ${selector}`);
          if (type === 'selector') {
            await jQuery.waitForElement(page, selector, 5000);
            const webValue = (await jQuery.getVal(page, selector)).trim();
            if (condition.condition === ConditionType.NOT_EQUAL) {
              if (webValue !== condition.value) {
                return true;
              }
            }
            if (condition.condition === ConditionType.EQUAL) {
              if (webValue === condition.value) {
                return true;
              }
            }
            if (condition.condition === ConditionType.INCLUDES) {
              if (webValue.includes(condition.value)) {
                return true;
              }
            }
            if (condition.condition === ConditionType.NOT_INCLUDES) {
              if (!webValue.includes(condition.value)) {
                return true;
              }
            }
          }
          // if (type === 'visual') {
          //   // Do a visual compare
          // }
          return false;
        }
      )
    );

    // Currently the notify rules are applied with OR, we only care about the first true condition
    const successConditionIndex = checkResults.findIndex((v) => v);

    // We have a successful condition match
    if (successConditionIndex > -1) {
      logger.info(`Finished checking: ${id}, triggered: true`);
      return {
        name,
        id,
        triggered: true,
        screenshot: path.join(config.get('images.path'), `${id}.png`),
      };
    }
  } catch (error: unknown) {
    return {
      name,
      id,
      triggered: false,
      error: <Error>error,
    };
  } finally {
    await browser.close();
  }

  logger.info(`Finished checking: ${id}, triggered: false`);

  return {
    id,
    name,
    triggered: false,
  };
};
