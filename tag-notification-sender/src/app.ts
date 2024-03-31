import { SNSEvent } from 'aws-lambda';
import axios from 'axios';

export const lambdaHandler = async (event: SNSEvent): Promise<void> => {
    const messageRecords = event.Records;

    try {
        for (const snsMessage of messageRecords) {
            const message = JSON.parse(snsMessage.Sns.Message);

            const { TELEGRAM_TOKEN, ENV } = process.env;
            const telegramApiUrl = 'https://api.telegram.org/bot';
            const token = TELEGRAM_TOKEN;
            const isProdEnv = ENV === 'prod';
            const channelId = isProdEnv
                ? '@promodescuentoserrores'
                : `@promosalesbot_${ENV}`;
            const url = `${telegramApiUrl}${token}/sendPhoto`;

            const { image, title, price, link } = message;
            const markdownMessage = `**${title}**

${price}

[COMPRAR](${link})`;

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
    } catch (err) {
        console.log(err);
    }
};
