// TODO: ReferenceError: cov_2igjb396sz is not defined
// seems jest or tsconfig went wrong, so the extracted functions will cause problems
// execAsync is fine, maybe it's the 3rd party pkgs

// import { Page } from 'puppeteer';

// /**
//  * 嘗試透過 clipboardy 來清空，但是沒辦法 compile
//  * 接著嘗試使用 jest-clipboard 清空，但遭遇到 transformIgnorePatterns 以及 babel.config.js 設置後，仍然無法運作的問題
//  */
// export async function clearClipboard(page: Page) {
//   await page.evaluate(() => {
//     const selection = document.getSelection();
//     if (selection) {
//       selection.removeAllRanges();
//     }

//     document.execCommand('copy');
//   });
// }

// export async function rightClickOnElement(page: Page, selector: string) {
//   const element = await page.$(selector);

//   if (!element) throw new Error('no such element');

//   const boundingBox = await element.boundingBox();

//   if (!boundingBox) throw new Error('Element not focused');

//   const middleHeight = boundingBox.x + boundingBox.width / 2;
//   const middleLength = boundingBox.y + boundingBox.height / 2;

//   await page.mouse.click(middleHeight, middleLength, {
//     button: 'right',
//   });
// }

// export function pause(ms: number) {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// }

// export async function selectText(page: Page, selector: string) {
//   await page.evaluate((selector) => {
//     const element = document.querySelector(selector);
//     if (!element) throw new Error(`Element not found for selector: ${selector}`);

//     const range = document.createRange();
//     range.selectNodeContents(element);
//     const selection = window.getSelection();
//     if (!selection) throw new Error('No selection object available');

//     selection.removeAllRanges();
//     selection.addRange(range);
//   }, selector);
// }
