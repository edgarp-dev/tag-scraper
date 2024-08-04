import {
    DynamoDBClient,
    PutItemCommand,
    GetItemCommand
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
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
        const params = {
            TableName: this.tableName,
            Key: marshall({ id: key }) 
        };

        const response = await this.dbClient.send(new GetItemCommand(params));
        if (response.Item) {
            return unmarshall(response.Item);
        }

        return undefined;
    }
}
