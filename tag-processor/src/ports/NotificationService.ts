export default interface NotificationService {
  publishNotification(message: string): Promise<void>;
}
