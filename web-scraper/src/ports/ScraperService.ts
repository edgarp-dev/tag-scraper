// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ScrapedContent = Record<string, any>;

export interface ScraperService {
    scrapPage(isLocalHost: boolean, url: string): Promise<ScrapedContent[]>;
}
