import { SQSEvent } from 'aws-lambda';
import { v4 as uuid } from 'uuid';
import {
    DynamoDBClient,
    PutItemCommand,
    QueryCommand
} from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';

export const lambdaHandler = async (event: SQSEvent): Promise<void> => {
    try {
        const dbClient = new DynamoDBClient();
        const queueMessages = event.Records;
        for (const message of queueMessages) {
            const { image, price, link, title } = message.messageAttributes;

            const { TAG_PROCESSOR_DB } = process.env;

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

            console.log(tagItem);
            if (tagItem.Count === 0) {
                console.log('ITEM NOT PROCESSED, SENDING NOTIFICATION');

                const putItemParams = {
                    TableName: TAG_PROCESSOR_DB,
                    Item: marshall({
                        id: uuid(),
                        title: title.stringValue,
                        image: image.stringValue,
                        price: price.stringValue,
                        link: link.stringValue
                    })
                };

                const pumItemResponse = await dbClient.send(
                    new PutItemCommand(putItemParams)
                );

                console.log(pumItemResponse);
            } else {
                console.log('ITEM PROCESSED BEFORE');
            }
        }
    } catch (err) {
        console.log(err);
    }
};
