import puppeteer, { Browser, Page } from 'puppeteer';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const EXTENSION_PATH = path.join(process.cwd(), 'dist');

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

describe('Preparation for Chrome Extension Context Menu Tests', () => {
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

  test('the keyboard interaction should be successful with puppeteer browser', async () => {
    try {
      page = await browser.newPage();

      await page.goto('file:///' + __dirname + '/test-input-page.html');

      await page.bringToFront();

      await page.waitForSelector('#testInput');

      await page.evaluate(() => document.getElementById('testInput')!.focus());

      await execAsync(`python ${__dirname}/scripts/type_text.py "${targetString}"`);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Error occurred: ${error}`);
      throw error;
    }

    const inputValue = await page.$eval('#testInput', (el) => (el as HTMLInputElement).value);

    const insertionNoMatterWhichLanguage = inputValue.length;

    expect(insertionNoMatterWhichLanguage).toBeGreaterThan(5);
  }, 10000);

  test('the second option should copy text', async () => {
    await execAsync(`chmod +x ${__dirname}/scripts/type_text.py`);

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

    await execAsync(`python ${__dirname}/scripts/choose_copy_context_menu.py`);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    clearClipboard(page);

    const copiedText = await page.evaluate(() => {
      return navigator.clipboard.readText();
    });

    expect(copiedText).toBe('選擇縣市');
  });
});

describe('Extension Specific', () => {
  let browser: Browser;
  let page: Page;

  beforeEach(async () => {
    browser = await puppeteer.launch({
      headless: false,
      args: [`--disable-extensions-except=${EXTENSION_PATH}`, `--load-extension=${EXTENSION_PATH}`],
    });
  });

  afterEach(async () => {
    await browser.close();
  });

  test('new context menu option opens a new tab', async () => {
    await execAsync(`chmod +x ${__dirname}/scripts/select_new_option.py`);

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

    await execAsync(`python ${__dirname}/scripts/select_new_option.py`);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const pages = await browser.pages();

    const originalPageCount = 2;
    const isTabIncreased = pages.length > originalPageCount;

    expect(isTabIncreased).toBe(true);
  }, 10000);

  test('Context menu option opens new tab with specific URL and content', async () => {
    page = await browser.newPage();

    await page.goto('https://en.wiktionary.org/wiki/bahagia');

    const textSelector = '#firstHeading > span';
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

    await execAsync(`python ${__dirname}/scripts/select_new_option_in_wikipidia.py`);

    await new Promise((resolve) => setTimeout(resolve, 3000));

    const pages = await browser.pages();
    expect(pages.length).toBeGreaterThan(2);

    const lastOpenedPage = pages.length - 1;
    const newTab = pages[lastOpenedPage];
    await newTab.bringToFront();

    const url = newTab.url();
    expect(url).toMatch(new RegExp(`https://kbbi.co.id/cari?kata=bahagia`));

    const searchResultCountSelector = '#main > div > div.col-sm-9 > div > p:nth-child(4)';
    await newTab.waitForSelector(searchResultCountSelector, { visible: true });

    const content = await newTab.$eval(searchResultCountSelector, (el) => el.textContent);
    expect(content).toBeTruthy();
  }, 45000);
});
