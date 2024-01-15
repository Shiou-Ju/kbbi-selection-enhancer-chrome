import puppeteer, { Page, Browser } from 'puppeteer';
import { SELECTORS } from '../utils/selectors';

const DERIVATIVES_IN_ONE_SECTION = 'https://kbbi.co.id/arti-kata/ajar';

const DERIVATIVES_IN_MUTIPLE_SECTIONS = 'https://kbbi.co.id/arti-kata/acara';

// TODO: complexity
function extractMeaningWordsFromInnerHtml(innerHtml: string) {
  const bTagSeperationRegex = /<b>.*?(?=<b>|$)/gs;

  const segments = innerHtml.match(bTagSeperationRegex);

  const concatedSegments: string[] = [];
  let leadingSegment = '';

  // TODO: use map
  segments!.forEach((segment, index) => {
    const iTagWithLessThanFiveLetterRegex = /<b>.*?<\/b> <i>.{1,5}<\/i>/;

    const hasPatternMatch = segment.match(iTagWithLessThanFiveLetterRegex);

    const isRootWordSection = index === 0;

    if (hasPatternMatch || isRootWordSection) {
      const hasLeadingContent = !!leadingSegment;

      if (hasLeadingContent) {
        concatedSegments.push(leadingSegment);
        leadingSegment = '';
      }
      concatedSegments.push(segment);
    } else {
      leadingSegment += segment;
    }
  });

  const hasStillLeadingContent = !!leadingSegment;

  if (hasStillLeadingContent) {
    concatedSegments.push(leadingSegment);
  }

  if (concatedSegments.length === 0) throw new Error('no concated');

  let lastMeaningfulIndex = 0;

  const secondConcated: string[] = Array(concatedSegments.length).fill(null);

  concatedSegments.forEach((firstConcated, currentIndex) => {
    const derivedWordMatch = firstConcated.match(/<b>(.*?·.*?)<\/b>/);

    const isStillPartOfExplanation = !derivedWordMatch || derivedWordMatch.length === 0;

    if (isStillPartOfExplanation) {
      secondConcated[lastMeaningfulIndex] += firstConcated;
    } else {
      lastMeaningfulIndex = currentIndex;

      secondConcated[currentIndex] = firstConcated;
    }
  });

  const secondConcatedAfterRemovedNull = secondConcated.filter((element) => element !== null);

  return secondConcatedAfterRemovedNull;
}

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

    const allInnerHtml = await page.$eval(SELECTORS.EXPLANATION_SECTORS, (el: Element) => el.innerHTML);

    const wordSegments = extractMeaningWordsFromInnerHtml(allInnerHtml);

    wordSegments.forEach((segment, index) => {
      const isRootWordElement = index === 0;
      if (isRootWordElement) return;

      const rootWordMatch = wordSegments[0].match(/<b>(.*?)<\/b>/);

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

    const allInnterHtml = await page.$$eval(SELECTORS.EXPLANATION_SECTORS, (elements) =>
      elements.map((el) => el.innerHTML).join('\n\n')
    );

    const wordSegments = extractMeaningWordsFromInnerHtml(allInnterHtml);

    wordSegments.forEach((segment, index) => {
      const isRootWordElement = index === 0;
      if (isRootWordElement) return;

      const rootWordMatch = wordSegments[0].match(/<b>(.*?)<\/b>/);

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
