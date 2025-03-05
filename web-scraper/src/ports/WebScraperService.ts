import { Page } from 'puppeteer';

export default interface WebScraperService {
  initScraper(isLocalHost: boolean): Promise<void>;
  getWebScraper(): Promise<Page>;
  openNewPage(): Promise<Page>;
  takeScreenshot(path: string): Promise<void>;
  closeBrowser(): Promise<void>;
}
