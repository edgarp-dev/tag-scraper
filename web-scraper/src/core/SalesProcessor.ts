import {
  CacheService,
  NotificationService,
  QueueService,
  TagProcessorService
} from '../ports';
import { ScrapedContent } from '../ports/TagProcessorService';
import { Sale } from './types';

export default class SalesProcessor {
  // private readonly tags = ['bug', 'error', 'corran'];
  private readonly tags = ['bug'];

  private readonly tagProcessorService: TagProcessorService;

  private readonly cacheService: CacheService;

  private readonly queueService: QueueService;

  private readonly notificationService: NotificationService;

  private readonly env: string;

  constructor(
    tagProcessorService: TagProcessorService,
    cacheService: CacheService,
    queueService: QueueService,
    notificationService: NotificationService,
    env: string
  ) {
    this.tagProcessorService = tagProcessorService;
    this.cacheService = cacheService;
    this.queueService = queueService;
    this.notificationService = notificationService;
    this.env = env;
  }

  public async processSales(
    isLocalHost: boolean,
    forceSendNotitfication: boolean
  ): Promise<Sale[]> {
    let sales: Sale[] = [];

    try {
      for (const tag of this.tags) {
        const url = `https://www.promodescuentos.com/search?q=${tag}`;
        const scrapedContent = await this.tagProcessorService.processTags(
          isLocalHost,
          url
        );

        sales = sales.concat(this.parseScrapedContent(scrapedContent));
      }
    } catch (error: unknown) {
      console.error(error);

      await this.notificationService.notifyError(
        (error as Error).message,
        this.env
      );
    }

    return this.getActiveSales(sales, forceSendNotitfication);
  }

  private parseScrapedContent(scrapedContent: ScrapedContent[]): Sale[] {
    return scrapedContent.map((content: ScrapedContent) => {
      const { threadId, title, price, image, link, isExpired } = content;

      return {
        threadId: threadId ?? '',
        title: title ?? '',
        price: price ?? '',
        image: image ?? '',
        link: link ?? '',
        isExpired
      } as Sale;
    });
  }

  private getActiveSales(
    sales: Sale[],
    forceSendNotitfication: boolean
  ): Sale[] {
    const activeSales = forceSendNotitfication
      ? sales
      : sales.filter((sale) => !sale.isExpired);
    const salesNotInCache = activeSales.filter(
      ({ threadId }: Sale) => !this.cacheService.get(threadId)
    );

    for (const saleNotCached of salesNotInCache) {
      const { threadId } = saleNotCached;
      this.cacheService.set(threadId);
    }

    return salesNotInCache;
  }

  public async sendQueueBatchMessages(sales: Sale[]): Promise<void> {
    try {
      await this.queueService.sendBatchMessages(sales);
    } catch (error: unknown) {
      console.error(error);

      await this.notificationService.notifyError(
        (error as Error).message,
        this.env
      );
    }
  }
}
