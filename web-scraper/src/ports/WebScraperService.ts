import { Browser, Page } from 'puppeteer';

export default interface WebScraperService {
  getBroswer(isLocalHost: boolean): Promise<Browser>;
  getPage(browser: Browser): Promise<Page>;
}
