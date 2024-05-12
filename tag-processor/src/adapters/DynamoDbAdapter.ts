import {
    DynamoDBClient,
    PutItemCommand,
    QueryCommand
} from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import Sale from '../core/Sale';
import { DbRepository } from '../ports';

export default class DynamoDbAdapter implements DbRepository {
    private readonly dbClient: DynamoDBClient;

    private readonly tableName: string;

    constructor(tableName: string) {
        this.dbClient = new DynamoDBClient();
        this.tableName = tableName;
    }

    public async create(sale: Sale): Promise<void> {
        const putItemParams = {
            TableName: this.tableName,
            Item: marshall(sale)
        };

        await this.dbClient.send(new PutItemCommand(putItemParams));
    }

    public async get(
        key: string
    ): Promise<Record<string, unknown> | undefined> {
        const queryParams = {
            TableName: this.tableName,
            IndexName: 'TitleIndex',
            KeyConditionExpression: 'title = :title',
            ExpressionAttributeValues: {
                ':title': { S: key }
            },
            ProjectionExpression: 'title'
        };

        const dbItems = await this.dbClient.send(new QueryCommand(queryParams));
        if (dbItems.Items && dbItems.Count && dbItems.Count > 0) {
            const saleFromDb = dbItems.Items[0];

            return saleFromDb;
        }

        return undefined;
    }
}
