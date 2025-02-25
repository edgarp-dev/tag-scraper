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
import SnsAdapter from './adapters/SnsAdapter';
import { wait } from './utils/promiseUtils';

dotenv.config();

const VERSION = '1.3.3';

const {
  IS_LOCAL_HOST,
  AWS_ACCOUNT_ID,
  ENV,
  ERROR_SNS_TOPIC_ARN,
  FORCE_SEND_NOTIFICATION
} = process.env;
const webScraperAdapter = new WebScraperAdapter();
const tagProcessorService = new TagsProcessorAdapter(webScraperAdapter);
const nodeCacheAdapter = new NodeCacheAdapter();
const sqsAdapter = new SqsAdapter(<string>AWS_ACCOUNT_ID, <string>ENV);
const notificationAdapter = new SnsAdapter(<string>ERROR_SNS_TOPIC_ARN);
const loginAdapter = new LoginAdapter(webScraperAdapter);
const salesProcessor = new SalesProcessor(
  tagProcessorService,
  nodeCacheAdapter,
  sqsAdapter,
  notificationAdapter,
  <string>ENV
);

const isLocalHost = IS_LOCAL_HOST === 'true';
const forceSendNotitfication = FORCE_SEND_NOTIFICATION === 'true';
console.log(forceSendNotitfication);

async function scrapTags() {
  console.log(`VERSION: ${VERSION}`);

  try {
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
  }
}

if (!isLocalHost) {
  cron.schedule('*/1 * * * *', async () => {
    await scrapTags();
  });
} else {
  scrapTags();
}
