import puppeteer from 'puppeteer-extra';
import { Browser, LaunchOptions, Page } from 'puppeteer';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { WebScraperService } from '../ports';

puppeteer.use(StealthPlugin());

export default class WebScraperAdapter implements WebScraperService {
  private page: Page | undefined;

  private broswer: Browser | undefined;

  public async getBroswer(isLocalHost: boolean): Promise<Browser> {
    const launchConfig: LaunchOptions = {
      headless: 'shell',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    };

    if (!isLocalHost) {
      launchConfig['executablePath'] = '/usr/bin/google-chrome';
    }

    if (!this.broswer) {
      this.broswer = await puppeteer.launch(launchConfig);
    }

    return this.broswer;
  }

  public async getPage(browser: Browser): Promise<Page> {
    if (!this.page) {
      this.page = await browser.newPage();
    }

    await this.page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    );

    return this.page;
  }

  public async openNewPage(browser: Browser): Promise<Page> {
    const page = await browser.newPage();

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    );

    this.page = page;

    return page;
  }

  public async closeBrowser(): Promise<void> {
    await this.broswer?.close();

    this.broswer = undefined;
    this.page = undefined;
  }
}
