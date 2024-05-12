export type ScrapedContent = Record<string, unknown>;

export interface ScraperService {
    scrapPage(isLocalHost: boolean, url: string): Promise<ScrapedContent[]>;
}
