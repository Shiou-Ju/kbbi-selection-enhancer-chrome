import puppeteer, { Page, Browser } from 'puppeteer';
import path from 'path';

// const TEXT_REGEX = /^ma·in/;
const TEXT_REGEX = /ma·in/;

const EXTENSION_PATH = path.join(process.cwd(), '../dist');

const prefix = '幫我用臺灣使用的繁體中文翻譯以下內容\n';

describe('KBBI Content Test', () => {
  let browser: Browser | null;

  //   const EXTENSION_PATH = '../dist';

  //   beforeEach(async () => {

  //   });

  beforeEach(async () => {
    browser = await puppeteer.launch({
      //   TODO: 現在看來 headless new 可以運作，但是不確定 args 是否真的載入
      headless: 'new',
      // headless: false,

      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,

        // 現在看起來沒有用
        // https://stackoverflow.com/questions/67049065/puppeteer-unable-to-load-chrome-extension-in-browser
        // '--enable-automation',
      ],
    });
  });

  //   afterAll(async () => {
  //     await browser.close();
  //   });

  afterEach(async () => {
    if (browser) {
      await browser.close();
    }
    browser = null;
  });

  //   FIXME: fail on this one, maybe puppeteer does not load the extension at all
  test('service worker is active', async () => {
    // const targets = await browser!.targets();
    const targets = browser!.targets();

    const serviceWorkerTarget = targets.find(
      (target) => target.type() === 'service_worker'
      //   no need for this step now
      // && target.url().includes('your-extension-identifier')
    );

    // Check if the service worker target exists
    expect(serviceWorkerTarget).toBeDefined();

    // Additional tests can be performed here to interact with the service worker
  });

  test('text content should start with "ma·in"', async () => {
    // const browser = await puppeteer.launch({
    //   headless: false,
    //   //   headless: 'new',

    // //   args: [`--disable-extensions-except=${EXTENSION_PATH}`, `--load-extension=${EXTENSION_PATH}`],
    // });

    const page = await browser!.newPage();

    await page.goto('https://kbbi.co.id/arti-kata/main');

    const text = await page.$eval('#main > div > div.col-sm-8 > p.arti', (el: Element) => el.textContent);

    expect(text).toMatch(TEXT_REGEX);
  });

  test('document.getSelection() should not be null', async () => {
    const page = await browser!.newPage();
    await page.goto('https://kbbi.co.id/arti-kata/main');

    await page.waitForSelector('#main > div > div.col-sm-8 > p.arti');

    const isSelectionAvailable = await page.evaluate(() => {
      const selection = document.getSelection();
      //   return selection !== null && selection.toString() !== '';
      return selection !== null;
    });

    expect(isSelectionAvailable).toBeTruthy();
  });

  //   FIXME: fail even the build is a success to meet this requirement
  test('text content should start with "ma·in" and target prefix', async () => {
    // await browser!.defaultBrowserContext().overridePermissions('<your origin>', ['clipboard-read', 'clipboard-write']);
    await browser!
      .defaultBrowserContext()
      .overridePermissions('https://kbbi.co.id', ['clipboard-read', 'clipboard-write']);

    const page = await browser!.newPage();
    await page.goto('https://kbbi.co.id/arti-kata/main');

    await page.bringToFront();

    // 选取并复制特定文字
    await page.evaluate(() => {
      const selection = document.getSelection();
      const range = document.createRange();
      const element = document.querySelector('#main > div > div.col-sm-8 > p.arti');

      range.selectNodeContents(element!);

      //   TODO: make sure the test works

      selection!.removeAllRanges();
      selection!.addRange(range);
      document.execCommand('copy');
    });

    // 读取剪切板内容
    const copiedText = await page.evaluate(() => navigator.clipboard.readText());

    // 检查复制的内容是否符合预期
    expect(copiedText.startsWith(prefix)).toBeTruthy();
    expect(copiedText).toMatch(TEXT_REGEX);
  });
});
