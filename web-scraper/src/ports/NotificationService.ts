export default interface NotificationService {
  notifyError(message: string, screenshotPath: string): Promise<void>;
}
