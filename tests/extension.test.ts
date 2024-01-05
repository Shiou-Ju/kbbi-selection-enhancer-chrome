import puppeteer, { Browser, Page } from 'puppeteer';
import path from 'path';
import * as fs from 'fs';
import { SELECTORS } from '../utils/selectors';

const TEXT_REGEX = /ma·in/;

const EXTENSION_PATH = path.join(process.cwd(), 'dist');

const prefix = '幫我用臺灣使用的繁體中文翻譯以下內容\n';

const TARGET_DICT_PAGE = 'https://kbbi.co.id/arti-kata/main';

async function takeScreenshotForTest(testName: string, page: Page): Promise<void> {
  const screenshotsDir = './screenshots';
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }

  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const screenshotPath = path.join(screenshotsDir, `${testName}-${timestamp}.png`);

  await page.screenshot({ path: screenshotPath });
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
    await page.goto(TARGET_DICT_PAGE);

    const text = await page.$eval(SELECTORS.MAIN_EXPLANATION, (el: Element) => el.textContent);

    expect(text).toMatch(TEXT_REGEX);
  });

  test('document.getSelection() should not be null', async () => {
    const page = await browser!.newPage();
    await page.goto(TARGET_DICT_PAGE);

    await page.waitForSelector(SELECTORS.MAIN_EXPLANATION);

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
    await page.goto(TARGET_DICT_PAGE);

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
    }, SELECTORS.MAIN_EXPLANATION);

    const copiedText = await page.evaluate(() => navigator.clipboard.readText());

    expect(copiedText.startsWith(prefix)).toBeTruthy();
    expect(copiedText).toMatch(TEXT_REGEX);
  });

  // tests for one-click capture btn

  test('search button should exist on the page', async () => {
    const page = await browser!.newPage();
    await page.goto(TARGET_DICT_PAGE);

    const searchButton = await page.$(SELECTORS.SEARCH_BTN);

    expect(searchButton).not.toBeNull();

    await takeScreenshotForTest('search-button-existence', page);
  });

  test('button for capturing text should exist on the page', async () => {
    const page = await browser!.newPage();
    await page.goto(TARGET_DICT_PAGE);

    const buttonId = '#' + SELECTORS.ID_BTN_FOR_ALL_EXPLANAION;

    const captureAllButton = await page.$(buttonId);
    expect(captureAllButton).not.toBeNull();
  });

  test('clicking the capture button should retrieve the full text from MAIN_EXPLANATION', async () => {
    const page = await browser!.newPage();
    await page.goto(TARGET_DICT_PAGE);

    await page.click(SELECTORS.ID_BTN_FOR_ALL_EXPLANAION);

    // await page.waitForFunction(`document.querySelector(${SELECTORS.MAIN_EXPLANATION}).textContent.length > 0`);

    await page.waitForFunction(
      (selector) => {
        const element = document.querySelector(selector);
        return element && element.textContent && element.textContent.length > 0;
      },
      {},
      SELECTORS.MAIN_EXPLANATION
    );

    const capturedText = await page.evaluate(() => {
      const text = document.querySelector(SELECTORS.MAIN_EXPLANATION)?.textContent;
      return text;
    });

    expect(capturedText).toBeDefined();
    expect(typeof capturedText).toBe('string');

    // TODO: these texts might change, need to implement local server without depending on the actually going to the real time page.
    const explanationInTheMiddle = 'melakukan permainan untuk menyenangkan hati';

    const endPartOfExplanation = 'teman sejak kecil';

    expect(capturedText).toContain(explanationInTheMiddle);
    expect(capturedText).toContain(endPartOfExplanation);
  });

  // TODO: User Feedback: Test if there's appropriate user feedback (like a confirmation message) after the text is captured.
});

// FIXME: this test is wrongly designed.  The targets won't contain service_worker
// it contains something like this
// [
//   OtherTarget {
//     _initializedDeferred: Deferred {},
//     _isClosedDeferred: Deferred {},
//     _targetId: '8d82baa3-b613-4ac4-92a3-94f79c5caa26'
//   },
//   PageTarget {
//     _initializedDeferred: Deferred {},
//     _isClosedDeferred: Deferred {},
//     _targetId: 'C70E26BFA83EEDEE5A7075E74A013F2A',
//     pagePromise: undefined
//   }
// ]
// test('service worker is active', async () => {
//   const targets = browser!.targets();

//   console.log(targets);

//   const serviceWorkerTarget = targets.find(
//     (target) => target.type() === 'service_worker'
//     //   no need for this step now
//     // && target.url().includes('your-extension-identifier')
//   );

//   expect(serviceWorkerTarget).toBeDefined();
// });
