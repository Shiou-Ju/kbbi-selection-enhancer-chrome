import { SELECTORS } from '../utils/selectors';
// import { extractMeaningWordsFromInnerHtml } from './extractMeaningWordsFromInnerHtml';

let isCmdCtrlPressed = false;
let isCPressed = false;
let canCopyTextBeModified = false;

let categorizedWordsGlobal: { [key: string]: string[] } = {};

type CategorizedWords = {
  [partOfSpeech: string]: string[];
};

const promptTitle = '幫我用臺灣使用的繁體中文翻譯以下內容\n';

const exampleTranslation =
  '\n\n依照以下的範例：' +
  // better to produce result without code block
  // '\n```\n\n' +
  '\n\n' +
  'tan·da n \n' +
  '1. 成為某事的地址或表達某事的東西：遠處聽到危險的警報聲。\n' +
  '2. 跡象：已經顯現出它的跡象。\n' +
  '3. 證據：那是他們不願合作的證據。\n' +
  '4. 識別符號；象徵：印尼代表團佩戴著印尼國徽的標誌。\n' +
  '5. 指示。\n' +
  '- alamiah: 自然產生的標誌，非人為刻意創造。\n' +
  '- baca: 用於拼寫系統的標誌（如句號、逗號、冒號）。\n' +
  '- bagi: 數學中表示除法完成或進行中的標誌（冒號 [:]）。\n' +
  '- bakti: 忠誠的表達。\n\n' +
  'ber·tan·da v \n' +
  '1. 有標誌；有特徵；有商標等。\n' +
  '2. 已（戴結婚戒指）結婚。\n\n' +
  'pe·tan·da·an n \n' +
  '標記的過程、方式、行為。\n' +
  // better to produce result without code block
  //  +'\n```\n';
  '\n\n';

const note = '請[不要]放在 code block 給我，謝謝。';

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Control' || event.key === 'Meta') {
    isCmdCtrlPressed = true;
  } else if (event.key === 'c' || event.key === 'C') {
    isCPressed = true;
  }

  if (isCmdCtrlPressed && isCPressed) {
    canCopyTextBeModified = true;
  }
}

function handleKeyUp(event: KeyboardEvent) {
  if (event.key === 'Control' || event.key === 'Meta') {
    isCmdCtrlPressed = false;
    canCopyTextBeModified = false;
  } else if (event.key === 'c' || event.key === 'C') {
    isCPressed = false;
    canCopyTextBeModified = false;
  }
}

function ensureTempDiv(id: string, text: string) {
  let tempDiv = document.getElementById(id);

  if (!tempDiv) {
    tempDiv = document.createElement('div');
    tempDiv.id = id;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    document.body.appendChild(tempDiv);
  }

  tempDiv.textContent = text;

  return tempDiv;
}

const addCopyModification = () => {
  document.addEventListener('copy', (event) => {
    if (!canCopyTextBeModified) return;

    const selection = document.getSelection();

    if (!selection) {
      return;
    }

    const selectedText = selection.toString();

    const modifiedText = convertSelectedTextToPromptForTranslation(selectedText, promptTitle, exampleTranslation, note);

    if (!event.clipboardData) {
      return;
    }

    event.clipboardData.setData('text/plain', modifiedText);

    canCopyTextBeModified = false;
    event.preventDefault();
  });
};

function convertSelectedTextToPromptForTranslation(
  selection: string,
  promptTitle: string,
  exampleTranslation: string,
  note: string
) {
  if (!selection) {
    return '';
  }

  const selectedText = selection.toString();
  const wrappedSelected = '```\n' + selectedText + '\n```';

  const modifiedText = promptTitle + wrappedSelected + exampleTranslation + note;

  return modifiedText;
}

const createButtonContainer = () => {
  let buttonContainer = document.getElementById(SELECTORS.ID_CONTAINER_BTN);

  if (buttonContainer) {
    return buttonContainer;
  } else {
    buttonContainer = document.createElement('div');
    buttonContainer.id = SELECTORS.ID_CONTAINER_BTN;
    return buttonContainer;
  }
};
const addCaptureAllBtn = () => {
  const btnParent = document.querySelector(SELECTORS.BTN_PARENT_ELEMENT);
  if (!btnParent) return;

  const button = document.createElement('button');

  const originalText = 'Copy all explanation';

  button.textContent = originalText;
  button.className = 'btn btn-default';
  button.id = SELECTORS.ID_BTN_FOR_ALL_EXPLANAION;

  const buttonContainer = createButtonContainer();

  if (!btnParent.contains(buttonContainer)) {
    btnParent.insertAdjacentElement('afterend', buttonContainer);
  }
  buttonContainer.appendChild(button);

  button.addEventListener('click', async () => {
    const explanationElements = document.querySelectorAll(SELECTORS.EXPLANATION_SECTORS);

    const allExplanationsText = Array.from(explanationElements)
      .map((el) => (el.textContent ? el.textContent.trim() : ''))
      .join('\n\n');

    const tempDiv = ensureTempDiv('tempClipboardContent', allExplanationsText);

    const range = document.createRange();
    range.selectNodeContents(tempDiv);
    const selection = window.getSelection();

    if (!selection) return;

    selection.removeAllRanges();
    selection.addRange(range);

    canCopyTextBeModified = true;
    document.execCommand('copy');
    canCopyTextBeModified = false;

    button.textContent = 'Copied';

    setTimeout(() => {
      button.textContent = originalText;
    }, 1000);
  });
};

const addDropdown = () => {
  const btnParent = document.querySelector(SELECTORS.BTN_PARENT_ELEMENT);
  if (!btnParent) return;

  // const dropdown = document.createElement('select');
  // dropdown.id = SELECTORS.ID_BTN_DROPDOWN;

  // // TODO: not sure if this works

  // dropdown.multiple = true;

  // TODO: Add options to the dropdown here
  // Example: const option = document.createElement('option');

  // TODO: logic
  const b = document.querySelectorAll(SELECTORS.EXPLANATION_SECTORS);
  const htmlContent = Array.from(b)
    .map((el) => el.innerHTML)
    .join('\n\n');

  const categorizedWordsWithExplanations = categorizeWordsWithExplanations(htmlContent);

  // TODO:
  console.log(categorizedWordsWithExplanations);

  const dropdown = createDropdownWithOptions(categorizedWordsWithExplanations);

  const buttonContainer = createButtonContainer();

  if (!btnParent.contains(buttonContainer)) {
    btnParent.insertAdjacentElement('afterend', buttonContainer);
  }

  buttonContainer.appendChild(dropdown);
};

// TODO: maybe need improvement
const categorizeWordsWithExplanations = (innerHtml: string): CategorizedWords => {
  const bTagSeperationRegex = /<b>.*?(?=<b>|$)/gs;
  const wordWithExplanationRegex = /<b>(.*?)<\/b> <i>(.{1,5})<\/i>(.*?)(?=<b>|$)/gs;

  const categorizedWords: CategorizedWords = {};

  const segments = innerHtml.match(bTagSeperationRegex) || [];

  // TODO: try to use the selector test's logic
  // const segments = extractMeaningWordsFromInnerHtml(innerHtml);

  const processedSegments = Array(segments.length).fill(null);

  console.log(`segments`);
  segments.forEach((seg) => console.log(seg));

  for (let i = 0; i < segments.length; i++) {
    let match;
    while ((match = wordWithExplanationRegex.exec(segments[i])) !== null) {
      const [_, word, partOfSpeech, explanation] = match;

      const wordWithExplanation = `${word.trim()} - ${explanation.trim()}`;
      if (!categorizedWords[partOfSpeech]) {
        categorizedWords[partOfSpeech] = [];
      }
      categorizedWords[partOfSpeech].push(wordWithExplanation);

      const indexInArray = categorizedWords[partOfSpeech].length - 1;

      processedSegments[i] = {
        partOfSpeech,
        indexInArray,
      };

      segments[i] = '';
    }
  }

  let lastNullIndex: Number = 0;
  let lastPartOfSpeech: String = '';

  console.log(`processedSegments`, processedSegments);

  processedSegments.forEach((element, index) => {
    if (element !== null) {
      const { partOfSpeech, indexInArray } = processedSegments[index];
      lastNullIndex = indexInArray;
      lastPartOfSpeech = partOfSpeech;
    } else {
      const toAppend = segments[index];

      categorizedWords[`${lastPartOfSpeech}`][Number(lastNullIndex)] += toAppend;
    }
  });

  return categorizedWords;
};

// TODO: list all
const partOfSpeechMapping: { [key: string]: string } = {
  n: '選取全部名詞',
  v: '選取全部動詞',
};

const createDropdownWithOptions = (categorizedWords: { [key: string]: string[] }): HTMLSelectElement => {
  categorizedWordsGlobal = categorizedWords;

  const dropdown = document.createElement('select');
  dropdown.id = SELECTORS.ID_BTN_DROPDOWN;
  dropdown.multiple = true;

  Object.keys(categorizedWords).forEach((partOfSpeech) => {
    const option = document.createElement('option');
    option.value = partOfSpeech;
    option.textContent = partOfSpeechMapping[partOfSpeech] || partOfSpeech;

    dropdown.appendChild(option);
  });

  return dropdown;
};

document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);

addCopyModification();
addCaptureAllBtn();
addDropdown();
