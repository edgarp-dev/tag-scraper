import { CacheService, ScraperService } from '../ports';
import { ScrapedContent } from '../ports/ScraperService';
import { Sale } from './types';

export default class SalesProcessor {
    private readonly tags = ['bug', 'error', 'corran', 'preciazo'];

    private readonly scraperService: ScraperService;

    private readonly cacheService: CacheService;

    constructor(scraperService: ScraperService, cacheService: CacheService) {
        this.scraperService = scraperService;
        this.cacheService = cacheService;
    }

    public async processSales(isLocalHost: boolean): Promise<void> {
        let sales: Sale[] = [];
        for (const tag of this.tags) {
            const url = `https://www.promodescuentos.com/search?q=${tag}`;
            const scrapedContent = await this.scraperService.scrapPage(
                isLocalHost,
                url
            );

            sales = sales.concat(this.parseScrapedContent(scrapedContent));
        }

        const activeSales = this.getActiveSales(sales);
        console.log(activeSales);
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
        activeSales.forEach(({ articleId }: Sale) =>
            console.log(`CACHE: ${this.cacheService.get(articleId)}`)
        );
        const salesNotInCache = activeSales.filter(
            ({ articleId }: Sale) => !this.cacheService.get(articleId)
        );

        for (const saleNotCached of salesNotInCache) {
            const { articleId } = saleNotCached;
            console.log(`Saving to cache ${articleId}`);
            this.cacheService.set(articleId);
        }

        return salesNotInCache;
    }
}
