export default interface NotificationService {
  notifyError(message: string, photoPath: string): Promise<void>;
}
