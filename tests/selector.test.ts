import puppeteer, { Page, Browser } from 'puppeteer';
import { SELECTORS } from '../utils/selectors';

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
    const element = await page.$(SELECTORS.EXPLANATION_SECTORS);
    expect(element).not.toBeNull();
  });

  test('selector should contain text', async () => {
    // const text = await page.$eval(SELECTORS, (el) => el.textContent);
    const text = await page.$eval(SELECTORS.EXPLANATION_SECTORS, (el: Element) => el.textContent);

    expect(text).toBeTruthy();
  });
});
