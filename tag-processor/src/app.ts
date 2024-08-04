import { SQSEvent } from 'aws-lambda';
import { DynamoDbAdapter, SnsAdapter, SqsAdapter } from './adapters';
import SalesProcessor from './core/sales-processor';

export const lambdaHandler = async (event: SQSEvent): Promise<void> => {
    try {
        const {
            TAG_PROCESSOR_DB,
            TAG_NOTIFICATION_TOPIC,
            FORCE_SEND_NOTIFICATION
        } = process.env;

        const sqsAdapter = new SqsAdapter(event);
        const dynamoDbAdapter = new DynamoDbAdapter(<string>TAG_PROCESSOR_DB);
        const snsAdapter = new SnsAdapter(<string>TAG_NOTIFICATION_TOPIC);
        const salesProcessor = new SalesProcessor(
            sqsAdapter,
            dynamoDbAdapter,
            snsAdapter
        );

        const forceSendNotification =
            <string>FORCE_SEND_NOTIFICATION === 'true' ? true : false;
        await salesProcessor.processSales(forceSendNotification);
    } catch (err) {
        console.log(err);
    }
};
