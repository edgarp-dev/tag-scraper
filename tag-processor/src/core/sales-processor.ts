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

  public async processSales(forceSendNotitication = false): Promise<void> {
    const salesMessages = this.queueService.getSalesMessages();

    for (const saleMessage of salesMessages) {
      const { threadId, title, image, price, link } = saleMessage;
      const saleFromDb = await this.dbRepository.get(threadId);

      if (!saleFromDb || forceSendNotitication) {
        console.log(
          forceSendNotitication
            ? 'FORCE SEND NOTITICATION MODE ENABLED'
            : 'ITEM NOT PROCESSED, SAVING TO DB'
        );
        const sale = {
          id: threadId,
          title: title,
          image: image,
          price: price,
          link: link,
          savedAt: new Date().toISOString()
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
