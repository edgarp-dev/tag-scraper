import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import { NotificationService } from '../ports';

export default class TelegramAdapter implements NotificationService {
  private readonly telegramToken: string;

  constructor(telegramToken: string) {
    this.telegramToken = telegramToken;
  }

  public async notifyError(message: string, photoPath: string): Promise<void> {
    const screenshotExists = fs.existsSync(photoPath);

    const telegramApiUrl = 'https://api.telegram.org/bot';
    const channelId = '-1002253352797';
    const url = `${telegramApiUrl}${this.telegramToken}/${screenshotExists ? 'sendPhoto' : 'sendMessage'}`;

    const currentDate = new Date();
    const formattedDate = this.formatDate(currentDate);
    const errorMessage = `Error message: ${message}.\nDate: ${formattedDate}`;

    try {
      if (screenshotExists) {
        console.log('Sending message with screenshot...');
        const form = new FormData();
        form.append('chat_id', channelId);
        form.append('caption', errorMessage);
        form.append('photo', fs.createReadStream(photoPath));

        const response = await axios.post(url, form, {
          headers: form.getHeaders()
        });

        console.log('Message sent successfully:', response.data);
      } else {
        const response = await axios.post(url, {
          chat_id: channelId,
          text: errorMessage
        });

        console.log('Message sent successfully:', response.data);
      }
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
