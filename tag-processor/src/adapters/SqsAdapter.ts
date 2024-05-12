import { SQSEvent } from 'aws-lambda';
import { QueueService } from '../ports';
import Sale from '../core/Sale';

export default class SqsAdapter implements QueueService {
    private readonly event: SQSEvent;

    constructor(event: SQSEvent) {
        this.event = event;
    }

    public getSalesMessages(): Sale[] {
        return this.event.Records.map((record) => {
            const { image, price, link, title } = record.messageAttributes;

            const sale = new Sale();
            sale.image = image.stringValue ?? '';
            sale.price = price.stringValue ?? '';
            sale.link = link.stringValue ?? '';
            sale.title = title.stringValue ?? '';

            return sale;
        });
    }
}
