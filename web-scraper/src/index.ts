import dotenv from 'dotenv';
import cron from 'node-cron';
import { NodeCacheAdapter, PuppeterAdapter, SqsAdapter } from './adapters';
import { SalesProcessor } from './core';
import SnsAdapter from './adapters/SnsAdapter';

dotenv.config();

const { IS_LOCAL_HOST, AWS_ACCOUNT_ID, ENV, ERROR_SNS_TOPIC_ARN } = process.env;
const VERSION = '1.2.0';

const puppeterAdapter = new PuppeterAdapter();
const nodeCacheAdapter = new NodeCacheAdapter();
const sqsAdapter = new SqsAdapter(<string>AWS_ACCOUNT_ID, <string>ENV);
const notificationAdapter = new SnsAdapter(<string>ERROR_SNS_TOPIC_ARN);
const salesProcessor = new SalesProcessor(
    puppeterAdapter,
    nodeCacheAdapter,
    sqsAdapter,
    notificationAdapter
);

async function scrapTags() {
    console.log(`VERSION: ${VERSION}`);

    const isLocalHost = IS_LOCAL_HOST === 'dev';
    const sales = await salesProcessor.processSales(isLocalHost);
    await salesProcessor.sendQueueBatchMessages(sales);
}

if (!IS_LOCAL_HOST) {
    cron.schedule('*/1 * * * *', async () => {
        await scrapTags();
    });
} else {
    scrapTags();
}
