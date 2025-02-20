import { SNSEvent } from 'aws-lambda';
import Message from '../core/Message';
import EventProcessor from '../ports/EventProcessor';

export default class SnsAdapter implements EventProcessor {
  private readonly event: SNSEvent;

  constructor(event: SNSEvent) {
    this.event = event;
  }

  getMessages(): Message[] {
    const messageRecords = this.event.Records;

    return messageRecords.map((messageRecord) => {
      const rawMessage = JSON.parse(messageRecord.Sns.Message);

      const { image, title, price, link } = rawMessage;

      const message = new Message();
      message.image = image;
      message.title = title;
      message.price = price;
      message.link = link;

      return message;
    });
  }
}
