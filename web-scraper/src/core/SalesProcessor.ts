import { CacheService, QueueService, ScraperService } from '../ports';
import { ScrapedContent } from '../ports/ScraperService';
import { Sale } from './types';

export default class SalesProcessor {
    private readonly tags = ['bug', 'error', 'corran', 'preciazo'];

    private readonly scraperService: ScraperService;

    private readonly cacheService: CacheService;

    private readonly queueService: QueueService;

    constructor(
        scraperService: ScraperService,
        cacheService: CacheService,
        queueService: QueueService
    ) {
        this.scraperService = scraperService;
        this.cacheService = cacheService;
        this.queueService = queueService;
    }

    public async processSales(isLocalHost: boolean): Promise<Sale[]> {
        let sales: Sale[] = [];
        for (const tag of this.tags) {
            const url = `https://www.promodescuentos.com/search?q=${tag}`;
            const scrapedContent = await this.scraperService.scrapPage(
                isLocalHost,
                url
            );

            sales = sales.concat(this.parseScrapedContent(scrapedContent));
        }
        // console.log(sales);
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
        await this.queueService.sendBatchMessages(sales);
    }
}
