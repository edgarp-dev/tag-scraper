import { SNSEvent } from 'aws-lambda';

export const lambdaHandler = async (event: SNSEvent): Promise<void> => {
    console.log(event);
};
