import puppeteer, { Browser, Page } from 'puppeteer';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * 嘗試透過 clipboardy 來清空，但是沒辦法 compile
 * 接著嘗試使用 jest-clipboard 清空，但遭遇到 transformIgnorePatterns 以及 babel.config.js 設置後，仍然無法運作的問題
 */
export async function clearClipboard(page: Page) {
  await page.evaluate(() => {
    const selection = document.getSelection();
    if (selection) {
      selection.removeAllRanges();
    }

    document.execCommand('copy');
  });
}

function timeout(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const targetString = 'hello world';

describe('Chrome Extension Context Menu Test', () => {
  let browser: Browser;
  let page: Page;

  beforeEach(async () => {
    browser = await puppeteer.launch({
      headless: false,
      args: [
        // for pyautogui
        // '--window-size=800,600', // Set the window size
        // '--window-position=0,0', // Set the window position
      ],
    });
  });

  afterEach(async () => {
    await browser.close();
  });

  async function selectText(page: Page, selector: string) {
    await page.evaluate((selector) => {
      const element = document.querySelector(selector);
      if (!element) throw new Error(`Element not found for selector: ${selector}`);

      const range = document.createRange();
      range.selectNodeContents(element);
      const selection = window.getSelection();
      if (!selection) throw new Error('No selection object available');

      selection.removeAllRanges();
      selection.addRange(range);
    }, selector);
  }

  test('the keyboard interaction should be successful with puppeteer browser', async () => {
    try {
      page = await browser.newPage();

      await page.goto('file:///' + __dirname + '/test-input-page.html');

      await page.bringToFront();

      await page.waitForSelector('#testInput');

      await page.evaluate(() => document.getElementById('testInput')!.focus());

      await execAsync(`python ${__dirname}/type_text.py "${targetString}"`);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Error occurred: ${error}`);
      throw error;
    }

    const inputValue = await page.$eval('#testInput', (el) => (el as HTMLInputElement).value);

    expect(inputValue).toBe(targetString);
  });

  test('the second option should copy text', async () => {
    await execAsync(`chmod +x ${__dirname}/type_text.py`);

    await browser!
      .defaultBrowserContext()
      .overridePermissions('https://www.cwa.gov.tw', ['clipboard-read', 'clipboard-write']);

    page = await browser.newPage();

    const textSelector =
      'body > div.wrapper > main > div > div:nth-child(2) > div.row > div > form > fieldset > div > div:nth-child(1) > div.countryselect-title > label';

    await page.goto('https://www.cwa.gov.tw/V8/C/W/County/County.html?CID=66');
    await page.waitForSelector(textSelector);

    await selectText(page, textSelector);

    const element = await page.$(textSelector);
    const boundingBox = await element!.boundingBox();

    if (!boundingBox) throw new Error('not focused');

    const middleHight = boundingBox.x + boundingBox.width / 2;
    const middleLenth = boundingBox.y + boundingBox.height / 2;

    await page.mouse.click(middleHight, middleLenth, {
      button: 'right',
    });

    page.bringToFront();

    await execAsync(`python ${__dirname}/choose_copy_context_menu.py`);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    clearClipboard(page);

    const copiedText = await page.evaluate(() => {
      return navigator.clipboard.readText();
    });

    expect(copiedText).toBe('選擇縣市');
  });

  test('new context menu option opens a new tab', async () => {
    await execAsync(`chmod +x ${__dirname}/select_new_option.py`);

    page = await browser.newPage();

    const textSelector =
      'body > div.wrapper > main > div > div:nth-child(2) > div.row > div > form > fieldset > div > div:nth-child(1) > div.countryselect-title > label';

    await page.goto('https://www.cwa.gov.tw/V8/C/W/County/County.html?CID=66');
    await page.waitForSelector(textSelector);

    await selectText(page, textSelector);

    const element = await page.$(textSelector);
    const boundingBox = await element!.boundingBox();

    if (!boundingBox) throw new Error('not focused');

    const middleHight = boundingBox.x + boundingBox.width / 2;
    const middleLenth = boundingBox.y + boundingBox.height / 2;

    await page.mouse.click(middleHight, middleLenth, {
      button: 'right',
    });

    await page.bringToFront();

    await execAsync(`python ${__dirname}/select_new_option.py`);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const pages = await browser.pages();

    const originalPageCount = 2;
    const isTabIncreased = pages.length > originalPageCount;

    expect(isTabIncreased).toBe(true);
  }, 10000);
});
