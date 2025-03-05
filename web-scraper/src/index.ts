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
import TelegramAdapter from './adapters/TelegramAdapter';

dotenv.config();

const VERSION = '1.3.12';

const {
  IS_LOCAL_HOST,
  AWS_ACCOUNT_ID,
  ENV,
  FORCE_SEND_NOTIFICATION,
  TELEGRAM_BOT_TOKEN
} = process.env;

const webScraperAdapter = new WebScraperAdapter();
const notificationAdapter = new TelegramAdapter(<string>TELEGRAM_BOT_TOKEN);
const tagProcessorAdapter = new TagsProcessorAdapter(notificationAdapter);
const nodeCacheAdapter = new NodeCacheAdapter();
const sqsAdapter = new SqsAdapter(<string>AWS_ACCOUNT_ID, <string>ENV);
const loginAdapter = new LoginAdapter(notificationAdapter);
const salesProcessor = new SalesProcessor(
  webScraperAdapter,
  loginAdapter,
  tagProcessorAdapter,
  nodeCacheAdapter,
  sqsAdapter
);

const isLocalHost = IS_LOCAL_HOST === 'true';
const forceSendNotitfication = FORCE_SEND_NOTIFICATION === 'true';

async function scrapTags() {
  console.log(`VERSION: ${VERSION}`);
  const sales = await salesProcessor.processSales(
    isLocalHost,
    forceSendNotitfication
  );

  await salesProcessor.sendQueueBatchMessages(sales);
}

if (!isLocalHost) {
  cron.schedule('*/1 * * * *', async () => {
    await scrapTags();
  });
} else {
  scrapTags();
}
