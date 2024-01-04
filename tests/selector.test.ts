import puppeteer, { Page, Browser } from 'puppeteer';

// if needed, need to execute scripts/savePage.ts again to get the html
describe.skip('Puppeteer Selector Test', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: 'new' });
    page = await browser.newPage();
    await page.goto(`file://${__dirname}/../scripts/output/test_target_20240102.html`);
  });

  afterAll(async () => {
    await browser.close();
  });

  test('selector should be present', async () => {
    const element = await page.$('#main > div > div.col-sm-8 > p.arti');
    expect(element).not.toBeNull();
  });

  test('selector should contain text', async () => {
    // const text = await page.$eval('#main > div > div.col-sm-8 > p.arti', (el) => el.textContent);
    const text = await page.$eval('#main > div > div.col-sm-8 > p.arti', (el: Element) => el.textContent);

    expect(text).toBeTruthy();
  });
});
