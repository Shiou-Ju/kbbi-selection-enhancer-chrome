import { SELECTORS } from '../utils/selectors';

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

const addCaptureAllBtn = () => {
  const btnParent = document.querySelector(SELECTORS.BTN_PARENT_ELEMENT);
  if (!btnParent) return;

  const button = document.createElement('button');

  const originalText = 'Copy all explanation';

  button.textContent = originalText;
  button.className = 'btn btn-default';
  button.id = SELECTORS.ID_BTN_FOR_ALL_EXPLANAION;

  const buttonContainer = document.createElement('div');
  buttonContainer.appendChild(button);

  const parentElement = document.querySelector(SELECTORS.BTN_PARENT_ELEMENT);

  if (parentElement) {
    parentElement.insertAdjacentElement('afterend', buttonContainer);
  }

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
    document.execCommand('copy');

    button.textContent = 'Copied';

    setTimeout(() => {
      button.textContent = originalText;
    }, 1000);
  });
};

addCopyModification();
addCaptureAllBtn();
