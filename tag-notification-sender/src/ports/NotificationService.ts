import Message from '../core/Message';

export default interface NotificationService {
    sendNotification(message: Message): Promise<void>;
}
