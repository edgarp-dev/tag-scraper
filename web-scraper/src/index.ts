import puppeteer from 'puppeteer';
import dotenv from 'dotenv';
import { fromEnv } from '@aws-sdk/credential-providers';
import { v4 as uuidv4 } from 'uuid';
import {
    SQSClient,
    SendMessageBatchCommand,
    SendMessageBatchRequest
} from '@aws-sdk/client-sqs'; // ES Modules import

dotenv.config();

type Sale = {
    title: string;
    price: string;
    image: string;
    link: string;
    isExpired: boolean;
};

function wait(seconds: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, seconds * 1000);
    });
}

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    console.log('OPENING URL: https://www.promodescuentos.com/search?q=bug');
    await page.goto('https://www.promodescuentos.com/search?q=bug');

    console.log('DELAYING 3 SECONDS UNTIL ELEMENTS LOAD');
    await wait(3);

    try {
        console.log('SCRAPING HTML ELEMENTS');
        const containerElement = await page.$('.js-threadList');

        if (containerElement) {
            const sales: Sale[] = await containerElement.$$eval(
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
                            title: threadLinkElement.textContent,
                            price,
                            image,
                            link,
                            isExpired: isExpired === 'Expirado'
                        };
                    });
                }
            );

            console.log('FILTERING ACTIVE SALES');
            const activeSales = sales.filter((bug) => !bug.isExpired);
            const sqsClient = new SQSClient({ credentials: fromEnv() });

            const entries = [];
            for (const sale of activeSales) {
                console.log('######');
                const { title, price, image, link, isExpired } = sale;
                console.log(title);
                console.log(price);
                console.log(image);
                console.log(link);
                console.log(isExpired);
                entries.push({
                    Id: uuidv4(),
                    MessageBody: title,
                    MessageAttributes: {
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
                            StringValue: 'test'
                        },
                        link: {
                            DataType: 'String',
                            StringValue: link ?? ''
                        },
                        isExpired: {
                            DataType: 'String',
                            StringValue: isExpired.toString() ?? false
                        }
                    }
                });
            }

            const sendMessageBatchInput: SendMessageBatchRequest = {
                QueueUrl:
                    'https://sqs.us-east-1.amazonaws.com/975050027353/tag-queue-dev',
                Entries: entries
            };
            const sendMessageBatchCommand = new SendMessageBatchCommand(
                sendMessageBatchInput
            );

            console.log('SENDING QUEUE MESSAGES');
            const response = await sqsClient.send(sendMessageBatchCommand);
            console.log(response);
            console.log('MESSAGES PUBLISHED');
        }
    } catch (eror) {
        console.log(eror);
    }

    await browser.close();
})();
