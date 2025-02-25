import { SNSEvent } from 'aws-lambda';
import { SnsAdapter, TelegramAdapter } from './adapters';
import { NotificationProcessor } from './ports';

export const lambdaHandler = async (event: SNSEvent): Promise<void> => {
  try {
    const snsAdapter = new SnsAdapter(event);
    const { TELEGRAM_TOKEN, ENV } = process.env;
    const telegramAdapter = new TelegramAdapter(
      <string>TELEGRAM_TOKEN,
      <string>ENV
    );
    const notificationProcessor = new NotificationProcessor(
      snsAdapter,
      telegramAdapter
    );

    await notificationProcessor.sendTelegramNotifications();
  } catch (err) {
    console.log(err);
  }
};
