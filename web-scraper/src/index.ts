import dotenv from 'dotenv';
import cron from 'node-cron';
import fs from 'fs';
import {
  LoginAdapter,
  NodeCacheAdapter,
  TagsProcessorAdapter,
  SqsAdapter,
  WebScraperAdapter
} from './adapters';
import { SalesProcessor } from './core';
import { wait } from './utils/promiseUtils';
import TelegramAdapter from './adapters/TelegramAdapter';
import { Page } from 'puppeteer';

dotenv.config();

const VERSION = '1.3.11';

const {
  IS_LOCAL_HOST,
  AWS_ACCOUNT_ID,
  ENV,
  FORCE_SEND_NOTIFICATION,
  TELEGRAM_BOT_TOKEN
} = process.env;
const webScraperAdapter = new WebScraperAdapter();
const tagProcessorService = new TagsProcessorAdapter(webScraperAdapter);
const nodeCacheAdapter = new NodeCacheAdapter();
const sqsAdapter = new SqsAdapter(<string>AWS_ACCOUNT_ID, <string>ENV);
const notificationAdapter = new TelegramAdapter(<string>TELEGRAM_BOT_TOKEN);
const loginAdapter = new LoginAdapter(webScraperAdapter);
const salesProcessor = new SalesProcessor(
  tagProcessorService,
  nodeCacheAdapter,
  sqsAdapter,
  <string>ENV
);

const isLocalHost = IS_LOCAL_HOST === 'true';
const forceSendNotitfication = FORCE_SEND_NOTIFICATION === 'true';

async function scrapTags() {
  console.log(`VERSION: ${VERSION}`);

  const screenshotPath = 'error_screenshot.png';
  let page: Page | undefined;
  try {
    const browser = await webScraperAdapter.getBroswer(isLocalHost);
    page = await webScraperAdapter.getPage(browser);

    await loginAdapter.login(isLocalHost);

    await wait(2);

    const sales = await salesProcessor.processSales(
      isLocalHost,
      forceSendNotitfication
    );

    webScraperAdapter.closeBrowser();

    await salesProcessor.sendQueueBatchMessages(sales);
  } catch (error: unknown) {
    console.error(error);

    await page?.screenshot({ path: screenshotPath });
    console.log(`Screenshot saved to: ${screenshotPath}`);

    await notificationAdapter.notifyError(
      (error as Error).message,
      screenshotPath
    );
  } finally {
    if (fs.existsSync(screenshotPath)) {
      fs.unlinkSync(screenshotPath);
      console.log('Screenshot file deleted.');
    } else {
      console.log('Screenshot file does not exist, skipping deletion.');
    }
  }
}

if (!isLocalHost) {
  cron.schedule('*/1 * * * *', async () => {
    await scrapTags();
  });
} else {
  scrapTags();
}
