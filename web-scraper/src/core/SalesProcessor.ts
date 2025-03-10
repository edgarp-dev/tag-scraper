import {
  CacheService,
  LoginService,
  QueueService,
  TagProcessorService,
  WebScraperService
} from '../ports';
import { ScrapedContent } from '../ports/TagProcessorService';
import { wait } from '../utils/promiseUtils';
import { Sale } from './types';

export default class SalesProcessor {
  private readonly tags = ['bug', 'error', 'corran'];

  private readonly webScrapperService: WebScraperService;

  private readonly loginService: LoginService;

  private readonly tagProcessorService: TagProcessorService;

  private readonly cacheService: CacheService;

  private readonly queueService: QueueService;

  constructor(
    webScrapperService: WebScraperService,
    loginService: LoginService,
    tagProcessorService: TagProcessorService,
    cacheService: CacheService,
    queueService: QueueService
  ) {
    this.webScrapperService = webScrapperService;
    this.loginService = loginService;
    this.tagProcessorService = tagProcessorService;
    this.cacheService = cacheService;
    this.queueService = queueService;
  }

  public async processSales(
    isLocalHost: boolean,
    forceSendNotitfication: boolean
  ): Promise<Sale[]> {
    await this.webScrapperService.initScraper(isLocalHost);

    let sales: Sale[] = [];
    await this.loginService.login(this.webScrapperService);

    await wait(2);

    for (const tag of this.tags) {
      const url = `https://www.promodescuentos.com/search?q=${tag}`;
      const scrapedContent = await this.tagProcessorService.processTags(
        this.webScrapperService,
        url
      );

      sales = sales.concat(this.parseScrapedContent(scrapedContent));

      await wait(2);
    }

    sales = this.getActiveSales(sales, forceSendNotitfication);

    await this.webScrapperService.closeBrowser();

    return sales;
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
    await this.queueService.sendBatchMessages(sales);
  }
}
