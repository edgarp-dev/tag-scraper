export default interface NotificationService {
  notifyError(message: string, env: string): Promise<void>;
}
