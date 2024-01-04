import puppeteer, { Browser } from 'puppeteer';
import path from 'path';
import { SELECTORS } from './utils/selectors';

const TEXT_REGEX = /ma·in/;

const EXTENSION_PATH = path.join(process.cwd(), 'dist');

const prefix = '幫我用臺灣使用的繁體中文翻譯以下內容\n';

describe('KBBI Content Test', () => {
  let browser: Browser | null;

  beforeEach(async () => {
    browser = await puppeteer.launch({
      headless: false,

      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,

        // 現在看起來沒有用，不影響
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

    await page.goto('https://kbbi.co.id/arti-kata/main');

    const text = await page.$eval(SELECTORS.MAIN_EXPLANATION, (el: Element) => el.textContent);

    expect(text).toMatch(TEXT_REGEX);
  });

  test('document.getSelection() should not be null', async () => {
    const page = await browser!.newPage();
    await page.goto('https://kbbi.co.id/arti-kata/main');

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
    await page.goto('https://kbbi.co.id/arti-kata/main');

    await page.bringToFront();

    await page.evaluate(() => {
      const selection = document.getSelection();
      const range = document.createRange();
      const element = document.querySelector(SELECTORS.MAIN_EXPLANATION);

      range.selectNodeContents(element!);

      selection!.removeAllRanges();
      selection!.addRange(range);
      document.execCommand('copy');
    });

    const copiedText = await page.evaluate(() => navigator.clipboard.readText());

    expect(copiedText.startsWith(prefix)).toBeTruthy();
    expect(copiedText).toMatch(TEXT_REGEX);
  });
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
