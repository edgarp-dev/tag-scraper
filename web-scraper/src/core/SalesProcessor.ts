import {
    CacheService,
    NotificationService,
    QueueService,
    ScraperService
} from '../ports';
import { ScrapedContent } from '../ports/ScraperService';
import { Sale } from './types';

export default class SalesProcessor {
    private readonly tags = ['bug', 'error', 'corran', 'preciazo'];

    private readonly scraperService: ScraperService;

    private readonly cacheService: CacheService;

    private readonly queueService: QueueService;

    private readonly notificationService: NotificationService;

    private readonly env: string;

    constructor(
        scraperService: ScraperService,
        cacheService: CacheService,
        queueService: QueueService,
        notificationService: NotificationService,
        env: string
    ) {
        this.scraperService = scraperService;
        this.cacheService = cacheService;
        this.queueService = queueService;
        this.notificationService = notificationService;
        this.env = env;
    }

    public async processSales(isLocalHost: boolean): Promise<Sale[]> {
        let sales: Sale[] = [];

        try {
            for (const tag of this.tags) {
                const url = `https://www.promodescuentos.com/search?q=${tag}`;
                const scrapedContent = await this.scraperService.scrapPage(
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

        return this.getActiveSales(sales);
    }

    private parseScrapedContent(scrapedContent: ScrapedContent[]): Sale[] {
        return scrapedContent.map((content: ScrapedContent) => {
            const { articleId, title, price, image, link, isExpired } = content;

            return {
                articleId: articleId ?? '',
                title: title ?? '',
                price: price ?? '',
                image: image ?? '',
                link: link ?? '',
                isExpired
            } as Sale;
        });
    }

    private getActiveSales(sales: Sale[]): Sale[] {
        const activeSales = sales.filter((sale) => !sale.isExpired);
        const salesNotInCache = activeSales.filter(
            ({ articleId }: Sale) => !this.cacheService.get(articleId)
        );

        for (const saleNotCached of salesNotInCache) {
            const { articleId } = saleNotCached;
            this.cacheService.set(articleId);
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
