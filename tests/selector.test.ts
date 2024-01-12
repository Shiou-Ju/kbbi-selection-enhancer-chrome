import puppeteer, { Page, Browser } from 'puppeteer';
import { SELECTORS } from '../utils/selectors';

const DERIVATIVES_IN_ONE_SECTION = 'https://kbbi.co.id/arti-kata/ajar';

const DERIVATIVES_IN_MUTIPLE_SECTIONS = 'https://kbbi.co.id/arti-kata/acara';

describe('KBBI Selector Tests', () => {
  let browser: Browser;
  let page: Page;

  beforeEach(async () => {
    browser = await puppeteer.launch({ headless: false });
    page = await browser.newPage();
  });

  afterEach(async () => {
    await browser.close();
  });

  test.skip('explanations should be present', async () => {
    await page.goto(DERIVATIVES_IN_ONE_SECTION);

    const element = await page.$(SELECTORS.EXPLANATION_SECTORS);
    expect(element).not.toBeNull();
  });

  test.skip('explanations should contain text', async () => {
    await page.goto(DERIVATIVES_IN_ONE_SECTION);

    const text = await page.$eval(SELECTORS.EXPLANATION_SECTORS, (el: Element) => el.textContent);

    expect(text).toBeTruthy();
  });

  test('words from a single paragraph should be accurately separated and contain the root word', async () => {
    await page.goto(DERIVATIVES_IN_ONE_SECTION);

    const htmlContent = await page.$eval(SELECTORS.EXPLANATION_SECTORS, (el: Element) => el.innerHTML);

    const bTagSeperationRegex = /<b>.*?(?=<b>|$)/gs;

    const segments = htmlContent.match(bTagSeperationRegex);

    const combinedSegments: string[] = [];
    let previousSegment = '';

    // TODO: use map
    segments!.forEach((segment, index) => {
      const iTagWithLessThanFiveLetterRegex = /<b>.*?<\/b> <i>.{1,5}<\/i>/;

      const patternMatch = segment.match(iTagWithLessThanFiveLetterRegex);

      if (patternMatch || index === 0) {
        if (previousSegment) {
          combinedSegments.push(previousSegment);
          previousSegment = '';
        }
        combinedSegments.push(segment);
      } else {
        previousSegment += segment;
      }
    });

    if (previousSegment) {
      combinedSegments.push(previousSegment);
    }

    if (combinedSegments.length == 0) throw new Error('no combined');

    combinedSegments.forEach((segment, index) => {
      const isRootWordElement = index === 0;
      if (isRootWordElement) return;

      const rootWordMatch = combinedSegments[0].match(/<b>(.*?)<\/b>/);

      const derivedWordMatch = segment.match(/<b>(.*?·.*?)<\/b>/);

      if (!derivedWordMatch || derivedWordMatch.length === 0) return;

      if (!(rootWordMatch && derivedWordMatch)) {
        throw new Error(`${rootWordMatch} , ${derivedWordMatch} went wrong`);
      }

      const rootWordProcessed = rootWordMatch[1]
        .replace(/<[^>]+>/g, '')
        .replace(/[0-9]/g, '')
        .replace(/·/g, '')
        .trim();

      const rootWordFirstLetterOff = rootWordProcessed.substring(1);

      const derivedWord = derivedWordMatch[1].replace(/·/g, '');

      expect(derivedWord.includes(rootWordFirstLetterOff)).toBeTruthy();
    });
  });

  test('words from multiple paragraphs should be accurately separated and contain the root word', async () => {
    await page.goto(DERIVATIVES_IN_MUTIPLE_SECTIONS);

    const allHtmlContent = await page.$$eval(SELECTORS.EXPLANATION_SECTORS, (elements) =>
      elements.map((el) => el.innerHTML).join('\n\n')
    );

    // console.log(allHtmlContent);

    const bTagSeperationRegex = /<b>.*?(?=<b>|$)/gs;

    const segments = allHtmlContent.match(bTagSeperationRegex);

    const combinedSegments: string[] = [];
    let previousSegment = '';

    // TODO: use map
    segments!.forEach((segment, index) => {
      const iTagWithLessThanFiveLetterRegex = /<b>.*?<\/b> <i>.{1,5}<\/i>/;

      const patternMatch = segment.match(iTagWithLessThanFiveLetterRegex);

      if (patternMatch || index === 0) {
        if (previousSegment) {
          combinedSegments.push(previousSegment);
          previousSegment = '';
        }
        combinedSegments.push(segment);
      } else {
        previousSegment += segment;
      }
    });

    if (previousSegment) {
      combinedSegments.push(previousSegment);
    }

    if (combinedSegments.length == 0) throw new Error('no combined');

    combinedSegments.forEach((segment, index) => {
      const isRootWordElement = index === 0;
      if (isRootWordElement) return;

      const rootWordMatch = combinedSegments[0].match(/<b>(.*?)<\/b>/);

      const derivedWordMatch = segment.match(/<b>(.*?·.*?)<\/b>/);

      if (!derivedWordMatch || derivedWordMatch.length === 0) return;

      if (!(rootWordMatch && derivedWordMatch)) {
        throw new Error(`${rootWordMatch} , ${derivedWordMatch} went wrong`);
      }

      const rootWordProcessed = rootWordMatch[1]
        .replace(/<[^>]+>/g, '')
        .replace(/[0-9]/g, '')
        .replace(/·/g, '')
        .trim();

      const rootWordFirstLetterOff = rootWordProcessed.substring(1);

      const derivedWord = derivedWordMatch[1].replace(/·/g, '');

      expect(derivedWord.includes(rootWordFirstLetterOff)).toBeTruthy();
    });
  });
});
