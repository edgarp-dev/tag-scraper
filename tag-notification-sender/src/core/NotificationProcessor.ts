import { EventProcessor } from '../ports';
import NotificationService from '../ports/NotificationService';

export default class NotificationProcessor {
    private readonly eventProcessor: EventProcessor;

    private readonly notificationService: NotificationService;

    constructor(
        eventProcessor: EventProcessor,
        notificationService: NotificationService
    ) {
        this.eventProcessor = eventProcessor;
        this.notificationService = notificationService;
    }

    public async sendTelegramNotifications(): Promise<void> {
        const messages = this.eventProcessor.getMessages();

        for (const message of messages) {
            await this.notificationService.sendNotification(message);
        }
    }
}
