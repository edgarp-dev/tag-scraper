import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import { NotificationService } from '../ports';

export default class SnsAdapter implements NotificationService {
    private readonly snsClient: SNSClient;

    private readonly notificationTopic: string;

    constructor(notificationTopic: string) {
        this.snsClient = new SNSClient();
        this.notificationTopic = notificationTopic;
    }

    public async publishNotification(message: string): Promise<void> {
        const publishParams = {
            TopicArn: this.notificationTopic,
            Message: message
        };

        await this.snsClient.send(new PublishCommand(publishParams));
    }
}
