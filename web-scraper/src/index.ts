import puppeteer, { PuppeteerLaunchOptions } from 'puppeteer';
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

dotenv.config();

type Sale = {
    articleId: string;
    title: string;
    price: string;
    image: string;
    link: string;
    isExpired: boolean;
};

const tags = ['bug', 'error', 'corran', 'preciazo'];
const cache = new NodeCache({ stdTTL: 86400, checkperiod: 60 });
const sqsClient = new SQSClient({ credentials: fromEnv() });
const snsClient = new SNSClient({ credentials: fromEnv() });
const { IS_LOCAL_HOST, AWS_ACCOUNT_ID, ENV, ERROR_SNS_TOPIC_ARN } = process.env;
const VERSION = '1.1.0';

function wait(seconds: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, seconds * 1000);
    });
}

async function scrapTags() {
    try {
        console.log(`VERSION: ${VERSION}`);

        const puppeteerConfig: PuppeteerLaunchOptions = {
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        };

        if (!IS_LOCAL_HOST) {
            puppeteerConfig['executablePath'] = '/usr/bin/google-chrome';
        }

        const browser = await puppeteer.launch(puppeteerConfig);
        const page = await browser.newPage();

        let sales: Sale[] = [];

        for (const tag of tags) {
            const tagUrl = `https://www.promodescuentos.com/search?q=${tag}`;

            console.log(`OPENING URL: ${tagUrl}`);
            await page.goto(tagUrl);

            console.log('DELAYING 3 SECONDS UNTIL ELEMENTS LOAD');
            await wait(3);

            console.log('SCRAPING HTML ELEMENTS');
            const containerElement = await page.$('.js-threadList');

            if (containerElement) {
                const tagSales = (await containerElement.$$eval(
                    'article',
                    (articles) => {
                        return articles.map((article) => {
                            const threadLinkElement = article.querySelector(
                                '.thread-title .thread-link'
                            );

                            const priceElement = article.querySelector(
                                '.overflow--fade .threadItemCard-price'
                            );
                            const price = priceElement
                                ? priceElement.textContent.trim()
                                : null;

                            const imgElement = article.querySelector(
                                '.threadGrid-image img'
                            );
                            const image = imgElement
                                ? imgElement.getAttribute('src')
                                : null;

                            const anchorElement =
                                article.querySelector('.thread-title a');
                            const link = anchorElement
                                ? anchorElement.getAttribute('href')
                                : null;

                            const isExpired = article
                                .querySelector(
                                    '.threadGrid-headerMeta .size--all-s'
                                )
                                .textContent.trim();

                            return {
                                articleId: article.id,
                                title: threadLinkElement.textContent,
                                price,
                                image,
                                link,
                                isExpired: isExpired === 'Expirado'
                            };
                        });
                    }
                )) as Sale[];

                sales = sales.concat(tagSales);
            }
        }

        await browser.close();

        console.log('FILTERING ACTIVE SALES');
        const activeSales = sales.filter((bug) => !bug.isExpired);

        const entries = [];
        for (const sale of activeSales) {
            const { articleId, title, price, image, link } = sale;

            const itemInCache = cache.get(articleId);

            if (!itemInCache) {
                entries.push({
                    Id: uuidv4(),
                    MessageBody: title,
                    MessageAttributes: {
                        articleId: {
                            DataType: 'String',
                            StringValue: articleId
                        },
                        title: {
                            DataType: 'String',
                            StringValue: title ?? ''
                        },
                        price: {
                            DataType: 'String',
                            StringValue: price ?? ''
                        },
                        image: {
                            DataType: 'String',
                            StringValue: image ?? ''
                        },
                        link: {
                            DataType: 'String',
                            StringValue: link ?? ''
                        }
                    }
                });

                cache.set(articleId, articleId);
            } else {
                console.log(`${articleId} in cache`);
            }
        }
        for (const sale of activeSales) {
            console.log(sale);
        }
        // if (entries.length > 0) {
        //     const queueUrl = `https://sqs.us-east-1.amazonaws.com/${AWS_ACCOUNT_ID}/tag-queue-${ENV}`;
        //     const sendMessageBatchInput: SendMessageBatchRequest = {
        //         QueueUrl: queueUrl,
        //         Entries: entries
        //     };
        //     const sendMessageBatchCommand = new SendMessageBatchCommand(
        //         sendMessageBatchInput
        //     );

        //     console.log(`SENDING QUEUE MESSAGES TO QUEUE: ${queueUrl}`);
        //     const response = await sqsClient.send(sendMessageBatchCommand);
        //     console.log(response);
        //     console.log(`${entries.length} MESSAGES PUBLISHED`);
        // } else {
        //     console.log('NO MESSAGES SENT');
        // }
    } catch (error) {
        console.log('ERROR, SENDING SNS NOTIFICATION TO EMAIL');
        console.error(error);

        const params = {
            Message: `ERROR SCRAPPING PROMODESCUENTOS: ${(error as Error).message}`,
            TopicArn: ERROR_SNS_TOPIC_ARN
        };
        await snsClient.send(new PublishCommand(params));

        console.log('ERROR NOTIFICATION SENT TO EMAIL');
    }
}

if (!IS_LOCAL_HOST) {
    cron.schedule('*/1 * * * *', async () => {
        await scrapTags();
    });
} else {
    scrapTags();
}
