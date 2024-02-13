import { SQSEvent } from 'aws-lambda';

export const lambdaHandler = async (event: SQSEvent): Promise<void> => {
    console.log(event);
};
