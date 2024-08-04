import {
    SQSClient,
    SendMessageBatchCommand,
    SendMessageBatchRequest,
    SendMessageBatchRequestEntry
} from '@aws-sdk/client-sqs';
import { v4 as uuidv4 } from 'uuid';
import { fromEnv } from '@aws-sdk/credential-providers';
import { Sale } from '../core/types';
import { QueueService } from '../ports';

export default class SqsAdapter implements QueueService {
    private readonly queueUrl: string;

    private readonly sqsClient: SQSClient;

    constructor(awsAccountId: string, env: string) {
        this.queueUrl = `https://sqs.us-east-1.amazonaws.com/${awsAccountId}/tag-queue-${env}`;
        this.sqsClient = new SQSClient({ credentials: fromEnv() });
    }
    public async sendBatchMessages(sales: Sale[]): Promise<void> {
        const queueMessageEntries = this.createQueueMessageEntries(sales);

        if (queueMessageEntries.length > 0) {
            console.log(`SENDING QUEUE MESSAGES TO QUEUE: ${this.queueUrl}`);

            for (let i = 0; i < queueMessageEntries.length; i += 10) {
                const batch = queueMessageEntries.slice(i, i + 10);

                const sendMessageBatchInput: SendMessageBatchRequest = {
                    QueueUrl: this.queueUrl,
                    Entries: batch
                };
                const sendMessageBatchCommand = new SendMessageBatchCommand(
                    sendMessageBatchInput
                );

                const response = await this.sqsClient.send(
                    sendMessageBatchCommand
                );
                console.log(response);
                console.log(`${batch.length} MESSAGES PUBLISHED`);
            }
        } else {
            console.log('NO MESSAGES SENT');
        }
    }

    private createQueueMessageEntries(
        sales: Sale[]
    ): SendMessageBatchRequestEntry[] {
        return sales.map((sale) => {
            const { title, threadId, price, image, link } = sale;
            return {
                Id: uuidv4(),
                MessageBody: title,
                MessageAttributes: {
                    threadId: {
                        DataType: 'String',
                        StringValue: threadId
                    },
                    title: {
                        DataType: 'String',
                        StringValue: title
                    },
                    price: {
                        DataType: 'String',
                        StringValue: price
                    },
                    image: {
                        DataType: 'String',
                        StringValue: image
                    },
                    link: {
                        DataType: 'String',
                        StringValue: link
                    }
                }
            };
        });
    }
}
