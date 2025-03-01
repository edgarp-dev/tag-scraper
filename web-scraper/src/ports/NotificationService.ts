export default interface NotificationService {
  notifyError(message: string): Promise<void>;
}
