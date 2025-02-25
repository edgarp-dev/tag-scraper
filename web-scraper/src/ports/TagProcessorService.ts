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
  processTags(isLocalHost: boolean, url: string): Promise<ScrapedContent[]>;
}
