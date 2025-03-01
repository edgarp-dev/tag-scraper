import dotenv from 'dotenv';
import cron from 'node-cron';
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

dotenv.config();

const VERSION = '1.3.6';

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

  try {
    throw new Error('Error: This is a test error');
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

    notificationAdapter.notifyError((error as Error).message);
  }
}

if (!isLocalHost) {
  cron.schedule('*/1 * * * *', async () => {
    await scrapTags();
  });
} else {
  scrapTags();
}
