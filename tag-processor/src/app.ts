import { SQSEvent } from 'aws-lambda';
import { v4 as uuid } from 'uuid';
import {
    DynamoDBClient,
    PutItemCommand,
    QueryCommand
} from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

export const lambdaHandler = async (event: SQSEvent): Promise<void> => {
    try {
        const dbClient = new DynamoDBClient();
        const snsClient = new SNSClient();

        const queueMessages = event.Records;
        for (const message of queueMessages) {
            const { image, price, link, title } = message.messageAttributes;

            const { TAG_PROCESSOR_DB, TAG_NOTIFICATION_TOPIC } = process.env;

            const queryParams = {
                TableName: TAG_PROCESSOR_DB,
                IndexName: 'TitleIndex',
                KeyConditionExpression: 'title = :title',
                ExpressionAttributeValues: {
                    ':title': { S: <string>title.stringValue }
                },
                ProjectionExpression: 'title'
            };
            const tagItem = await dbClient.send(new QueryCommand(queryParams));

            if (tagItem.Count === 0) {
                console.log('ITEM NOT PROCESSED, SENDING NOTIFICATION');

                const saleItem = {
                    id: uuid(),
                    title: title.stringValue,
                    image: image.stringValue,
                    price: price.stringValue,
                    link: link.stringValue
                };

                const putItemParams = {
                    TableName: TAG_PROCESSOR_DB,
                    Item: marshall(saleItem)
                };

                await dbClient.send(new PutItemCommand(putItemParams));

                const publishParams = {
                    TopicArn: TAG_NOTIFICATION_TOPIC,
                    Message: JSON.stringify(saleItem)
                };

                const publishMessageResponse = await snsClient.send(
                    new PublishCommand(publishParams)
                );
                console.log(publishMessageResponse);
            } else {
                console.log('ITEM PROCESSED BEFORE');
            }
        }
    } catch (err) {
        console.log(err);
    }
};
