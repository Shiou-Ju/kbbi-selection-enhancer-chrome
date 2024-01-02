const explanationSelector = '#main > div > div.col-sm-8 > p.arti';

document.addEventListener('click', () => {
  const element = document.querySelector(explanationSelector) as HTMLElement;
  if (element) {
    console.log(element.textContent || 'No text found');
  }
});
