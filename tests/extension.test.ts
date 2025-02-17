import puppeteer, { Browser, Page } from 'puppeteer';
import path from 'path';
import * as fs from 'fs';
import { SELECTORS } from '../utils/selectors';
import execAsync from './utils/execAsync';

const TEXT_REGEX = /ma·in/;

const EXTENSION_PATH = path.join(process.cwd(), 'dist');

const prefix = '幫我用臺灣使用的繁體中文翻譯以下內容\n';

const note = '請[不要]放在 code block 給我，謝謝。';

const PAGE_WITH_ONLY_ONE_EXPLANATION_DIV = 'https://kbbi.co.id/arti-kata/main';

const PAGE_WITH_MUTIPLE_EXLANATION_DIV = 'https://kbbi.co.id/arti-kata/kasih';

const explanationKasihInTheFirstParagraph = 'saling mengasihi; saling';
const endPartOfKasihSecondParagraphExplanation = 'Ibu adalah ~ kakakku';

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

async function rightClickOnElement(page: Page, selector: string) {
  const element = await page.$(selector);

  if (!element) throw new Error('no such element');

  const boundingBox = await element.boundingBox();

  if (!boundingBox) throw new Error('Element not focused');

  const middleHeight = boundingBox.x + boundingBox.width / 2;
  const middleLength = boundingBox.y + boundingBox.height / 2;

  await page.mouse.click(middleHeight, middleLength, {
    button: 'right',
  });
}

function pause(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
      return selection !== null;
    });

    expect(isSelectionAvailable).toBeTruthy();
  });

  test('text copied via context menu should not start with prefix but match TEXT_REGEX', async () => {
    await browser!
      .defaultBrowserContext()
      .overridePermissions('https://kbbi.co.id', ['clipboard-read', 'clipboard-write']);

    const page = await browser!.newPage();
    await page.goto(PAGE_WITH_ONLY_ONE_EXPLANATION_DIV);
    await page.waitForSelector(SELECTORS.EXPLANATION_SECTORS);

    selectText(page, SELECTORS.EXPLANATION_SECTORS);

    await clearClipboard(page);

    await rightClickOnElement(page, SELECTORS.EXPLANATION_SECTORS);
    await execAsync(`python ${__dirname}/scripts/choose_copy_context_menu.py`);

    await pause(1000);

    const copiedText = await page.evaluate(() => navigator.clipboard.readText());

    expect(copiedText.startsWith(prefix)).toBeFalsy();
    expect(copiedText).toMatch(TEXT_REGEX);
  }, 10000);

  test('keyboard copied should start with "ma·in" and target prefix', async () => {
    // TODO: this test mighjt work intermittently, still under watch
    await browser!
      .defaultBrowserContext()
      .overridePermissions('https://kbbi.co.id', ['clipboard-read', 'clipboard-write']);

    const page = await browser!.newPage();
    await page.goto(PAGE_WITH_ONLY_ONE_EXPLANATION_DIV);

    await page.bringToFront();

    selectText(page, SELECTORS.EXPLANATION_SECTORS);

    await pause(1000);

    await execAsync(`python ${__dirname}/scripts/simulate_keyboard_copy.py`);

    await pause(3000);

    const copiedText = await page.evaluate(() => navigator.clipboard.readText());

    expect(copiedText.startsWith(prefix)).toBeTruthy();
    expect(copiedText).toMatch(TEXT_REGEX);
  }, 15000);

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

    const buttonId = `#${SELECTORS.ID_BTN_FOR_ALL_EXPLANAION}`;

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

  test('copy button should not block the first line of the explanation', async () => {
    const page = await browser!.newPage();
    await page.goto(PAGE_WITH_ONLY_ONE_EXPLANATION_DIV);

    const explanationDiv = await page.$('.arti');
    const firstBoldElement = await page.$('.arti b');
    const copyButton = await page.$('.copy-explanation-btn');

    if (!explanationDiv || !copyButton || !firstBoldElement) {
      throw new Error('Explanation div, copy button, or first bold element not found on the page');
    }

    const explanationBox = await explanationDiv.boundingBox();
    const buttonBox = await copyButton.boundingBox();
    const firstBoldBox = await firstBoldElement.boundingBox();

    if (!explanationBox || !buttonBox || !firstBoldBox) {
      throw new Error('Failed to retrieve bounding box for explanation div, copy button, or first bold element');
    }

    await takeScreenshotForTest('copy-button-not-block-first-line', page);

    expect(buttonBox.y).toBeLessThanOrEqual(firstBoldBox.y);
    expect(buttonBox.y + buttonBox.height).toBeLessThanOrEqual(firstBoldBox.y);
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

    const btnById = `#${SELECTORS.ID_BTN_FOR_ALL_EXPLANAION}`;

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

    expect(copiedText.startsWith(prefix)).toBeTruthy();
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

    await clearClipboard(page);

    const btnById = `#${SELECTORS.ID_BTN_FOR_ALL_EXPLANAION}`;
    await page.click(btnById);

    const copiedText = await page.evaluate(() => navigator.clipboard.readText());

    expect(copiedText.startsWith(prefix)).toBeTruthy();
    expect(copiedText).toContain(explanationKasihInTheFirstParagraph);
    expect(copiedText).toContain(endPartOfKasihSecondParagraphExplanation);
  });

  test('button text should change to "Copied" on click and revert back after 1 second', async () => {
    await browser!
      .defaultBrowserContext()
      .overridePermissions('https://kbbi.co.id', ['clipboard-read', 'clipboard-write']);

    const page = await browser!.newPage();
    await page.goto(PAGE_WITH_MUTIPLE_EXLANATION_DIV);

    const btnById = `#${SELECTORS.ID_BTN_FOR_ALL_EXPLANAION}`;

    await page.waitForSelector(btnById);

    await page.click(btnById);

    let buttonText = await page.$eval(btnById, (el) => el.textContent);

    const temporaryUXText = 'Copied';

    expect(buttonText).toBe(temporaryUXText);

    const moreThanOneSecond = 1100;
    await page.waitForTimeout(moreThanOneSecond);

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

    const btnById = `#${SELECTORS.ID_BTN_FOR_ALL_EXPLANAION}`;

    await page.waitForSelector(btnById);

    await page.click(btnById);

    const copiedText = await page.evaluate(() => navigator.clipboard.readText());

    expect(copiedText.startsWith(prefix)).toBeTruthy();

    const titleOccurrences = copiedText.split(note).length - 1;

    expect(titleOccurrences).toBe(1);
  });

  test('each explanation section should have a "Copy" button on the top right corner', async () => {
    await browser!
      .defaultBrowserContext()
      .overridePermissions('https://kbbi.co.id', ['clipboard-read', 'clipboard-write']);

    const page = await browser!.newPage();
    await page.goto(PAGE_WITH_MUTIPLE_EXLANATION_DIV);

    await page.waitForSelector(SELECTORS.EXPLANATION_SECTORS);

    const explanationSections = await page.$$(SELECTORS.EXPLANATION_SECTORS);

    const btnClass = `.${SELECTORS.CLASS_BTN_COPY_SINGAL_PARAGRAPH}`;

    for (const section of explanationSections) {
      const button = await section.$(btnClass);
      expect(button).not.toBeNull();

      const buttonBounds = await page.evaluate((button) => {
        const { top, right } = button!.getBoundingClientRect();
        return { top, right };
      }, button);

      const sectionBounds = await page.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        return {
          top: rect.top,
          right: rect.right,
          height: el.offsetHeight,
          width: el.offsetWidth,
          clientHeight: el.clientHeight,
        };
      }, section);

      const borderThickness = 1;

      const precision = 10;

      const sectionTopAddedBorder = sectionBounds.top + borderThickness;
      const sectionRightWithOutBorder = sectionBounds.right - borderThickness;

      expect(buttonBounds.top).toBeCloseTo(sectionTopAddedBorder, precision);
      expect(buttonBounds.right).toBeCloseTo(sectionRightWithOutBorder, precision);
    }
  });

  test('clicking the second copy button should retrieve second explanation paragraph from the page', async () => {
    await browser!
      .defaultBrowserContext()
      .overridePermissions('https://kbbi.co.id', ['clipboard-read', 'clipboard-write']);

    const page = await browser!.newPage();
    await page.goto(PAGE_WITH_MUTIPLE_EXLANATION_DIV);

    await page.waitForSelector(SELECTORS.EXPLANATION_SECTORS);

    const explanationSections = await page.$$(SELECTORS.EXPLANATION_SECTORS);

    const btnClass = `.${SELECTORS.CLASS_BTN_COPY_SINGAL_PARAGRAPH}`;

    const secondSection = explanationSections[1];
    const button = await secondSection.$(btnClass);

    expect(button).not.toBeNull();

    await clearClipboard(page);

    await button!.click();

    const copiedText = await page.evaluate(() => navigator.clipboard.readText());

    expect(copiedText.startsWith(prefix)).toBeTruthy();
    expect(copiedText).toContain(endPartOfKasihSecondParagraphExplanation);

    expect(copiedText).not.toContain(explanationKasihInTheFirstParagraph);
  });

  test('clicking a copy button should not include the button text in the copied content', async () => {
    await browser!
      .defaultBrowserContext()
      .overridePermissions('https://kbbi.co.id', ['clipboard-read', 'clipboard-write']);

    const page = await browser!.newPage();
    await page.goto(PAGE_WITH_MUTIPLE_EXLANATION_DIV);

    await page.waitForSelector(SELECTORS.EXPLANATION_SECTORS);

    const explanationSections = await page.$$(SELECTORS.EXPLANATION_SECTORS);
    const btnClass = `.${SELECTORS.CLASS_BTN_COPY_SINGAL_PARAGRAPH}`;

    const firstSection = explanationSections[0];
    const button = await firstSection.$(btnClass);

    expect(button).not.toBeNull();

    await clearClipboard(page);

    const buttonTextBeforeChaning = await button!.evaluate((el) => el.textContent);

    await button!.click();

    const copiedText = await page.evaluate(() => navigator.clipboard.readText());

    expect(copiedText).not.toContain(buttonTextBeforeChaning);
  });

  test('clicking the "Capture All" button should retrieve all explanations excluding button texts', async () => {
    await browser!
      .defaultBrowserContext()
      .overridePermissions('https://kbbi.co.id', ['clipboard-read', 'clipboard-write']);

    const page = await browser!.newPage();
    await page.goto(PAGE_WITH_MUTIPLE_EXLANATION_DIV);

    const btnById = `#${SELECTORS.ID_BTN_FOR_ALL_EXPLANAION}`;

    await page.waitForSelector(btnById);

    const explanationSections = await page.$$(SELECTORS.EXPLANATION_SECTORS);
    const btnClass = `.${SELECTORS.CLASS_BTN_COPY_SINGAL_PARAGRAPH}`;
    const firstSection = explanationSections[0];
    const buttonInFirstSection = await firstSection.$(btnClass);

    const buttonTextBeforeChaning = await buttonInFirstSection!.evaluate((el) => el.textContent);

    await page.click(btnById);

    const copiedText = await page.evaluate(() => navigator.clipboard.readText());

    expect(copiedText).not.toContain(buttonTextBeforeChaning);
  });
});
