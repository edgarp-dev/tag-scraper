import dotenv from 'dotenv';
import { fromEnv } from '@aws-sdk/credential-providers';
import { v4 as uuidv4 } from 'uuid';
import {
    SQSClient,
    SendMessageBatchCommand,
    SendMessageBatchRequest
} from '@aws-sdk/client-sqs';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import NodeCache from 'node-cache';
import cron from 'node-cron';
import { NodeCacheAdapter, PuppeterAdapter } from './adapters';
import { SalesProcessor } from './core';

dotenv.config();

const cache = new NodeCache({ stdTTL: 86400, checkperiod: 60 });
const sqsClient = new SQSClient({ credentials: fromEnv() });
const snsClient = new SNSClient({ credentials: fromEnv() });
const { IS_LOCAL_HOST, AWS_ACCOUNT_ID, ENV, ERROR_SNS_TOPIC_ARN } = process.env;
const VERSION = '1.1.1';

const puppeterAdapter = new PuppeterAdapter();
const nodeCacheAdapter = new NodeCacheAdapter();
const salesProcessor = new SalesProcessor(puppeterAdapter, nodeCacheAdapter);

async function scrapTags() {
    try {
        console.log(`VERSION: ${VERSION}`);

        const isLocalHost = IS_LOCAL_HOST === 'dev';
        await salesProcessor.processSales(isLocalHost);

        //     console.log('FILTERING ACTIVE SALES');
        //     const activeSales = tagValues.filter((bug) => !bug.isExpired);

        //     const entries = [];
        //     for (const sale of activeSales) {
        //         const { articleId, title, price, image, link } = sale;

        //         const itemInCache = cache.get(articleId);

        //         if (!itemInCache) {
        //             entries.push({
        //                 Id: uuidv4(),
        //                 MessageBody: title,
        //                 MessageAttributes: {
        //                     articleId: {
        //                         DataType: 'String',
        //                         StringValue: articleId
        //                     },
        //                     title: {
        //                         DataType: 'String',
        //                         StringValue: title ?? ''
        //                     },
        //                     price: {
        //                         DataType: 'String',
        //                         StringValue: price ?? ''
        //                     },
        //                     image: {
        //                         DataType: 'String',
        //                         StringValue: image ?? ''
        //                     },
        //                     link: {
        //                         DataType: 'String',
        //                         StringValue: link ?? ''
        //                     }
        //                 }
        //             });

        //             cache.set(articleId, articleId);
        //         } else {
        //             console.log(`${articleId} in cache`);
        //         }
        //     }
        //     for (const sale of activeSales) {
        //         console.log(sale);
        //     }

        //     if (entries.length > 0) {
        //         const queueUrl = `https://sqs.us-east-1.amazonaws.com/${AWS_ACCOUNT_ID}/tag-queue-${ENV}`;
        //         const sendMessageBatchInput: SendMessageBatchRequest = {
        //             QueueUrl: queueUrl,
        //             Entries: entries
        //         };
        //         const sendMessageBatchCommand = new SendMessageBatchCommand(
        //             sendMessageBatchInput
        //         );

        //         console.log(`SENDING QUEUE MESSAGES TO QUEUE: ${queueUrl}`);
        //         const response = await sqsClient.send(sendMessageBatchCommand);
        //         console.log(response);
        //         console.log(`${entries.length} MESSAGES PUBLISHED`);
        //     } else {
        //         console.log('NO MESSAGES SENT');
        //     }
    } catch (error) {
        // console.log('ERROR, SENDING SNS NOTIFICATION TO EMAIL');
        // console.error(error);
        // const params = {
        //     Message: `ERROR SCRAPPING PROMODESCUENTOS: ${(error as Error).message}`,
        //     TopicArn: ERROR_SNS_TOPIC_ARN
        // };
        // await snsClient.send(new PublishCommand(params));
        // console.log('ERROR NOTIFICATION SENT TO EMAIL');
    }
}

if (!IS_LOCAL_HOST) {
    cron.schedule('*/1 * * * *', async () => {
        await scrapTags();
    });
} else {
    scrapTags();
}
