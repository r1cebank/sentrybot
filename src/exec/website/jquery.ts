import puppeteer from 'puppeteer';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const $ = (_: string) => {
  // Noop
  return { length: 0, text: () => '' };
};
// To make typescript happy, the evaluate code block is not executed in Node

/**
 * Get values from page using jQuery, require jQuery to be loaded in page
 * @param page The puppeteer page
 * @param selector The selector to get values from
 */
export const getVal = async (
  page: puppeteer.Page,
  selector: string
): Promise<string> => {
  const result = await page.evaluate((selector) => {
    try {
      const value = $(selector).text();
      return value;
    } catch (e) {
      return '';
    }
  }, selector);

  return result;
};

/**
 * Get the number of element for the jQuery selector
 * @param page The puppeteer page
 * @param selector The selector to find elements from
 */
export const getElementCount = async (
  page: puppeteer.Page,
  selector: string
): Promise<number> => {
  const elementCount = await page.evaluate((selector) => {
    try {
      const element = $(selector);
      return element.length;
    } catch (e) {
      return 0;
    }
  }, selector);

  return elementCount;
};

/**
 * Wait for a element to appear on a page using jQuery
 * @param page The puppeteer page
 * @param selector The selector to wait for exist
 * @param timeout Timeout before returning 0
 */
export const waitForElement = async (
  page: puppeteer.Page,
  selector: string,
  timeout: number
) => {
  const elementCount = await getElementCount(page, selector);

  return new Promise((resolve, reject) => {
    if (elementCount) {
      resolve(null);
    } else {
      setTimeout(async () => {
        const elementCount = await getElementCount(page, selector);

        if (elementCount) {
          resolve(null);
        } else {
          reject(
            new Error(`Element ${selector} didn't appear in ${timeout}ms`)
          );
        }
      }, timeout);
    }
  });
};
