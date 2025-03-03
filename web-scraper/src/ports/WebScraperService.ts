import { Browser, Page } from 'puppeteer';

export default interface WebScraperService {
  getBroswer(isLocalHost: boolean): Promise<Browser>;
  getPage(browser: Browser): Promise<Page>;
  openNewPage(browser: Browser): Promise<Page>;
  closeBrowser(): Promise<void>;
}
