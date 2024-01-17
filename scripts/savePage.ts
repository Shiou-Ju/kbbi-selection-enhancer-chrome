// NOTE: Please follow and respect target website's rule.
// used to save html for local testing

import puppeteer from 'puppeteer';
import { promises as fs, existsSync, mkdirSync } from 'fs';
import { format } from 'date-fns';

async function savePage(): Promise<void> {
  const folder = './scripts/output';
  if (!existsSync(folder)) {
    mkdirSync(folder);
  }

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://kbbi.co.id/arti-kata/main');

  const content = await page.content();
  const timestamp = format(new Date(), 'yyyyMMdd');
  const filePath = `${folder}/test_target_${timestamp}.html`;
  await fs.writeFile(filePath, content);

  await browser.close();
}

savePage();
