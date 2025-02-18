import { SQSEvent } from 'aws-lambda';
import { QueueService } from '../ports';
import SaleMessage from '../core/SaleMessage';

export default class SqsAdapter implements QueueService {
  private readonly event: SQSEvent;

  constructor(event: SQSEvent) {
    this.event = event;
  }

  public getSalesMessages(): SaleMessage[] {
    return this.event.Records.map((record) => {
      const { threadId, image, price, link, title } = record.messageAttributes;

      const sale = new SaleMessage();
      sale.threadId = threadId.stringValue ?? '';
      sale.image = image.stringValue ?? '';
      sale.price = price.stringValue ?? '';
      sale.link = link.stringValue ?? '';
      sale.title = title.stringValue ?? '';

      return sale;
    });
  }
}
