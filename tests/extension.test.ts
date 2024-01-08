import puppeteer, { Browser, Page } from 'puppeteer';
import path from 'path';
import * as fs from 'fs';
import { SELECTORS } from '../utils/selectors';

const TEXT_REGEX = /ma·in/;

const EXTENSION_PATH = path.join(process.cwd(), 'dist');

const prefix = '幫我用臺灣使用的繁體中文翻譯以下內容\n';

const note = '請[不要]放在 code block 給我，謝謝。';

const PAGE_WITH_ONLY_ONE_EXPLANATION_DIV = 'https://kbbi.co.id/arti-kata/main';

const PAGE_WITH_MUTIPLE_EXLANATION_DIV = 'https://kbbi.co.id/arti-kata/kasih';

async function takeScreenshotForTest(testName: string, page: Page): Promise<void> {
  const screenshotsDir = './screenshots';
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }

  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const screenshotPath = path.join(screenshotsDir, `${testName}-${timestamp}.png`);

  await page.screenshot({ path: screenshotPath });
}

/**
 * 嘗試透過 clipboardy 來清空，但是需要 node 的環境
 * 接著嘗試使用 jest-clipboard 清空，但遭遇到 transformIgnorePatterns 以及 babel.config.js 設置後，仍然無法運作的問題
 */
async function clearClipboard(page: Page) {
  await page.evaluate(() => {
    const selection = document.getSelection();
    if (selection) {
      selection.removeAllRanges();
    }

    document.execCommand('copy');
  });
}

describe('Extension loaded with text modification functionality', () => {
  let browser: Browser | null;

  beforeEach(async () => {
    browser = await puppeteer.launch({
      headless: false,

      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,

        // 現在看起來這個參數沒有用，不影響
        // https://stackoverflow.com/questions/67049065/puppeteer-unable-to-load-chrome-extension-in-browser
        // '--enable-automation',
      ],
    });
  });

  // recommended by chrome:
  // https://developer.chrome.com/docs/extensions/how-to/test/puppeteer?hl=zh-tw
  afterEach(async () => {
    if (browser) {
      await browser.close();
    }
    browser = null;
  });

  test('text content should start with "ma·in"', async () => {
    const page = await browser!.newPage();
    await page.goto(PAGE_WITH_ONLY_ONE_EXPLANATION_DIV);

    const text = await page.$eval(SELECTORS.EXPLANATION_SECTORS, (el: Element) => el.textContent);

    expect(text).toMatch(TEXT_REGEX);
  });

  test('document.getSelection() should not be null', async () => {
    const page = await browser!.newPage();
    await page.goto(PAGE_WITH_ONLY_ONE_EXPLANATION_DIV);

    await page.waitForSelector(SELECTORS.EXPLANATION_SECTORS);

    const isSelectionAvailable = await page.evaluate(() => {
      const selection = document.getSelection();
      //   return selection !== null && selection.toString() !== '';
      return selection !== null;
    });

    expect(isSelectionAvailable).toBeTruthy();
  });

  test('text content should start with "ma·in" and target prefix', async () => {
    await browser!
      .defaultBrowserContext()
      .overridePermissions('https://kbbi.co.id', ['clipboard-read', 'clipboard-write']);

    const page = await browser!.newPage();
    await page.goto(PAGE_WITH_ONLY_ONE_EXPLANATION_DIV);

    // this is required to make document focused
    await page.bringToFront();

    // await page.evaluate(() => {
    //   const selection = document.getSelection();
    //   const range = document.createRange();
    //   const element = document.querySelector(SELECTORS.MAIN_EXPLANATION);

    //   range.selectNodeContents(element!);

    //   selection!.removeAllRanges();
    //   selection!.addRange(range);
    //   document.execCommand('copy');
    // });

    await page.evaluate((mainExplanationSelector) => {
      const selection = document.getSelection();
      const range = document.createRange();
      const element = document.querySelector(mainExplanationSelector);

      range.selectNodeContents(element!);

      selection!.removeAllRanges();
      selection!.addRange(range);
      document.execCommand('copy');
    }, SELECTORS.EXPLANATION_SECTORS);

    const copiedText = await page.evaluate(() => navigator.clipboard.readText());

    expect(copiedText.startsWith(prefix)).toBeTruthy();
    expect(copiedText).toMatch(TEXT_REGEX);
  });

  // tests for one-click capture btn

  test('search button should exist on the page', async () => {
    const page = await browser!.newPage();
    await page.goto(PAGE_WITH_ONLY_ONE_EXPLANATION_DIV);

    const searchButton = await page.$(SELECTORS.SEARCH_BTN);

    expect(searchButton).not.toBeNull();

    await takeScreenshotForTest('search-button-existence', page);
  });

  test('button for capturing text should exist on the page', async () => {
    const page = await browser!.newPage();
    await page.goto(PAGE_WITH_ONLY_ONE_EXPLANATION_DIV);

    const buttonId = '#' + SELECTORS.ID_BTN_FOR_ALL_EXPLANAION;

    const captureAllButton = await page.$(buttonId);
    expect(captureAllButton).not.toBeNull();
  });

  test('button of wrong id should NOT exist on the page', async () => {
    const page = await browser!.newPage();
    await page.goto(PAGE_WITH_ONLY_ONE_EXPLANATION_DIV);

    const wrongButtonId = SELECTORS.ID_BTN_FOR_ALL_EXPLANAION;

    const captureAllButton = await page.$(wrongButtonId);
    expect(captureAllButton).toBeNull();
  });

  test('clicking the capture button should retrieve the only explanation div full text', async () => {
    await browser!
      .defaultBrowserContext()
      .overridePermissions('https://kbbi.co.id', ['clipboard-read', 'clipboard-write']);

    const page = await browser!.newPage();
    await page.goto(PAGE_WITH_ONLY_ONE_EXPLANATION_DIV);

    await page.waitForFunction(
      (selector) => {
        const element = document.querySelector(selector);
        return element && element.textContent && element.textContent.length > 0;
      },
      {},
      SELECTORS.EXPLANATION_SECTORS
    );

    const btnById = '#' + SELECTORS.ID_BTN_FOR_ALL_EXPLANAION;

    await page.waitForSelector(btnById);

    const capturedText = await page.evaluate((explanation) => {
      const text = document.querySelector(explanation)?.textContent;
      return text;
    }, SELECTORS.EXPLANATION_SECTORS);

    const explanationInTheMiddle = 'melakukan permainan untuk menyenangkan hati';

    const endPartOfExplanation = 'teman sejak kecil';

    expect(capturedText).toBeDefined();
    expect(typeof capturedText).toBe('string');
    expect(capturedText).toContain(explanationInTheMiddle);
    expect(capturedText).toContain(endPartOfExplanation);

    await clearClipboard(page);

    await page.click(btnById);

    const copiedText = await page.evaluate(() => navigator.clipboard.readText());

    expect(copiedText).toContain(explanationInTheMiddle);
    expect(copiedText).toContain(endPartOfExplanation);
  });

  test('clicking the capture button should retrieve all explanations div text from the page', async () => {
    await browser!
      .defaultBrowserContext()
      .overridePermissions('https://kbbi.co.id', ['clipboard-read', 'clipboard-write']);

    const page = await browser!.newPage();
    await page.goto(PAGE_WITH_MUTIPLE_EXLANATION_DIV);

    const allExplanationsText = await page.$$eval(SELECTORS.EXPLANATION_SECTORS, (elements) => {
      return elements.map((el) => (el.textContent ? el.textContent.trim() : '')).join('\n\n');
    });

    expect(allExplanationsText).toBeDefined();
    expect(typeof allExplanationsText).toBe('string');

    const explanationInTheMiddle = 'saling mengasihi; saling';
    const endPartOfExplanation = 'Ibu adalah ~ kakakku';

    await clearClipboard(page);

    // expect(allExplanationsText).toContain(explanationInTheMiddle);
    // expect(allExplanationsText).toContain(endPartOfExplanation);

    const btnById = '#' + SELECTORS.ID_BTN_FOR_ALL_EXPLANAION;
    await page.click(btnById);

    const copiedText = await page.evaluate(() => navigator.clipboard.readText());

    expect(copiedText).toContain(explanationInTheMiddle);
    expect(copiedText).toContain(endPartOfExplanation);
  });

  test('button text should change to "Copied" on click and revert back after 1 second', async () => {
    await browser!
      .defaultBrowserContext()
      .overridePermissions('https://kbbi.co.id', ['clipboard-read', 'clipboard-write']);

    const page = await browser!.newPage();
    await page.goto(PAGE_WITH_MUTIPLE_EXLANATION_DIV);

    const btnById = '#' + SELECTORS.ID_BTN_FOR_ALL_EXPLANAION;

    await page.waitForSelector(btnById);

    await page.click(btnById);

    let buttonText = await page.$eval(btnById, (el) => el.textContent);

    const temporaryUXText = 'Copied';

    expect(buttonText).toBe(temporaryUXText);

    const timeOutSpan = 1100;
    await page.waitForTimeout(timeOutSpan);

    buttonText = await page.$eval(btnById, (el) => el.textContent);

    const originalText = 'Copy all explanation';

    expect(buttonText).toBe(originalText);
  });

  test('note should not appear twice in the copied text', async () => {
    await browser!
      .defaultBrowserContext()
      .overridePermissions('https://kbbi.co.id', ['clipboard-read', 'clipboard-write']);

    const page = await browser!.newPage();
    await page.goto(PAGE_WITH_MUTIPLE_EXLANATION_DIV);

    const btnById = '#' + SELECTORS.ID_BTN_FOR_ALL_EXPLANAION;

    await page.waitForSelector(btnById);

    await page.click(btnById);

    const copiedText = await page.evaluate(() => navigator.clipboard.readText());

    const titleOccurrences = copiedText.split(note).length - 1;

    expect(titleOccurrences).toBe(1);
  });
});
