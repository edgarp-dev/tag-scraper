import WebScraperService from './WebScraperService';

export type ScrapedContent = {
  threadId: string;
  id: string;
  title: string;
  price: string;
  image: string;
  link: string;
  isExpired: boolean;
};

export interface TagProcessorService {
  processTags(
    webScraperService: WebScraperService,
    url: string
  ): Promise<ScrapedContent[]>;
}
