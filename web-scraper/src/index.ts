import dotenv from 'dotenv';
import cron from 'node-cron';
import { NodeCacheAdapter, PuppeterAdapter, SqsAdapter } from './adapters';
import { SalesProcessor } from './core';
import SnsAdapter from './adapters/SnsAdapter';

dotenv.config();

const VERSION = '1.2.1';

const { IS_LOCAL_HOST, AWS_ACCOUNT_ID, ENV, ERROR_SNS_TOPIC_ARN } = process.env;
const puppeterAdapter = new PuppeterAdapter();
const nodeCacheAdapter = new NodeCacheAdapter();
const sqsAdapter = new SqsAdapter(<string>AWS_ACCOUNT_ID, <string>ENV);
const notificationAdapter = new SnsAdapter(<string>ERROR_SNS_TOPIC_ARN);
const salesProcessor = new SalesProcessor(
    puppeterAdapter,
    nodeCacheAdapter,
    sqsAdapter,
    notificationAdapter,
    <string>ENV
);

const isLocalHost = IS_LOCAL_HOST === 'true';

async function scrapTags() {
    console.log(`VERSION: ${VERSION}`);

    const sales = await salesProcessor.processSales(isLocalHost);
    await salesProcessor.sendQueueBatchMessages(sales);
}

if (!isLocalHost) {
    cron.schedule('*/1 * * * *', async () => {
        await scrapTags();
    });
} else {
    scrapTags();
}
