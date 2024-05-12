import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import { fromEnv } from '@aws-sdk/credential-providers';
import { NotificationService } from '../ports';

export default class SnsAdapter implements NotificationService {
    private readonly snsClient: SNSClient;

    private readonly errorTopicSnsArn: string;
    constructor(errorTopicSnsArn: string) {
        this.snsClient = new SNSClient({ credentials: fromEnv() });
        this.errorTopicSnsArn = errorTopicSnsArn;
    }

    public async notifyError(message: string, env: string): Promise<void> {
        console.log('ERROR, SENDING SNS NOTIFICATION TO EMAIL');
        const params = {
            Message: `[${env.toUpperCase()}] ERROR SCRAPPING PROMODESCUENTOS: ${message}`,
            TopicArn: this.errorTopicSnsArn
        };
        await this.snsClient.send(new PublishCommand(params));
        console.log('ERROR NOTIFICATION SENT TO EMAIL');
    }
}
