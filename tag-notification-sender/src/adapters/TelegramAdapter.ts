import axios from 'axios';
import Message from '../core/Message';
import NotificationService from '../ports/NotificationService';

export default class TelegramAdapter implements NotificationService {
    private readonly telegramToken: string;

    private readonly env: string;

    constructor(telegramToken: string, env: string) {
        this.telegramToken = telegramToken;
        this.env = env;
    }

    public async sendNotification(message: Message): Promise<void> {
        const telegramApiUrl = 'https://api.telegram.org/bot';
        const isProdEnv = this.env === 'prod';
        const channelId = isProdEnv
            ? '@promodescuentoserrores'
            : `@promosalesbot_${this.env}`;
        const url = `${telegramApiUrl}${this.telegramToken}/sendPhoto`;

        const { image, title, price, link } = message;
        const markdownMessage = `**${title}**

${price}

[IR A LA OFERTA](${link})`;

        console.log(`SENDING MESSAGE TO TELEGRAM CHANNEL: ${channelId}`);
        console.log(channelId, markdownMessage);

        const response = await axios.post(url, {
            chat_id: channelId,
            parse_mode: 'Markdown',
            photo: image,
            caption: markdownMessage
        });

        console.log('Message sent successfully:', response.data);
    }
}
