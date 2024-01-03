import puppeteer, { Page, Browser } from 'puppeteer';
import path from 'path';

describe('KBBI Content Test', () => {
  let browser: Browser | null;

  //   const EXTENSION_PATH = '../dist';

  const EXTENSION_PATH = path.join(process.cwd(), '../dist');

  //   beforeEach(async () => {

  //   });

  beforeEach(async () => {
    browser = await puppeteer.launch({
      //   TODO: 現在看來 headless new 可以運作，但是不確定 args 是否真的載入
      headless: 'new',
      //   headless: false,

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

  test('text content should start with "ma·in"', async () => {
    // const browser = await puppeteer.launch({
    //   headless: false,
    //   //   headless: 'new',

    // //   args: [`--disable-extensions-except=${EXTENSION_PATH}`, `--load-extension=${EXTENSION_PATH}`],
    // });

    const page = await browser!.newPage();

    await page.goto('https://kbbi.co.id/arti-kata/main');

    const text = await page.$eval('#main > div > div.col-sm-8 > p.arti', (el: Element) => el.textContent);

    expect(text).toMatch(/^ma·in/);
  });
});
