import { SNSEvent } from 'aws-lambda';

export const lambdaHandler = async (event: SNSEvent): Promise<void> => {
    const messageRecords = event.Records;

    for (const message of messageRecords) {
        console.log(message);
    }
};
