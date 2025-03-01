import axios from 'axios';
import { NotificationService } from '../ports';

export default class TelegramAdapter implements NotificationService {
  private readonly telegramToken: string;

  constructor(telegramToken: string) {
    this.telegramToken = telegramToken;
  }

  public async notifyError(message: string): Promise<void> {
    const telegramApiUrl = 'https://api.telegram.org/bot';
    const channelId = '-1002253352797';
    const url = `${telegramApiUrl}${this.telegramToken}/sendMessage`;

    const currentDate = new Date();
    const formattedDate = this.formatDate(currentDate);
    const errorMessage = `Error message: ${message}.\nDate: ${formattedDate}`;

    try {
      const response = await axios.post(url, {
        chat_id: channelId,
        text: errorMessage
      });

      console.log('Message sent successfully:', response.data);
    } catch (error) {
      console.error('Error sending the message:', (error as Error).message);
    }
  }

  private formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
}
