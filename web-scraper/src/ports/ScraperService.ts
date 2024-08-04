// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ScrapedContent = {
    threadId: string;
    id: string;
    title: string;
    price: string;
    image: string;
    link: string;
    isExpired: boolean;
};

export interface ScraperService {
    scrapPage(isLocalHost: boolean, url: string): Promise<ScrapedContent[]>;
}
