// TODO: https://kbbi.co.id/arti-kata/pada
// needs to improve
export function extractMeaningWordsFromInnerHtml(innerHtml: string) {
  // TODO: complexity
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
