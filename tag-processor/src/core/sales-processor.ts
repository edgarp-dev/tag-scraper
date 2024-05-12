import { v4 as uuid } from 'uuid';
import { DbRepository, NotificationService, QueueService } from '../ports';

export default class SalesProcessor {
    private readonly queueService: QueueService;

    private readonly dbRepository: DbRepository;

    private readonly notificationService: NotificationService;

    constructor(
        queueService: QueueService,
        dbRepository: DbRepository,
        notificationService: NotificationService
    ) {
        this.queueService = queueService;
        this.dbRepository = dbRepository;
        this.notificationService = notificationService;
    }

    public async processSales(): Promise<void> {
        const salesMessages = this.queueService.getSalesMessages();

        for (const saleMessage of salesMessages) {
            const { title, image, price, link } = saleMessage;
            const saleFromDb = await this.dbRepository.get(title);

            if (!saleFromDb) {
                console.log('ITEM NOT PROCESSED, SAVING TO DB');
                const sale = {
                    id: uuid(),
                    title: title,
                    image: image,
                    price: price,
                    link: link
                };

                await this.dbRepository.create(sale);

                console.log('SENDING NOTIFICATION');

                await this.notificationService.publishNotification(
                    JSON.stringify(sale)
                );
            } else {
                console.log('ITEM PROCESSED BEFORE');
            }
        }
    }
}
