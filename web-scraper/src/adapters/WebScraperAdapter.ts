import puppeteer from 'puppeteer-extra';
import { Browser, LaunchOptions, Page } from 'puppeteer';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { WebScraperService } from '../ports';

puppeteer.use(StealthPlugin());

export default class WebScraperAdapter implements WebScraperService {
  private page: Page | undefined;

  private browser: Browser | undefined;

  public async initScraper(isLocalHost: boolean): Promise<void> {
    const launchConfig: LaunchOptions = {
      headless: 'shell',
      protocolTimeout: 120000,
      defaultViewport: {
        width: 1366,
        height: 768
      },
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    };

    if (!isLocalHost) {
      launchConfig['executablePath'] = '/usr/bin/google-chrome';
    }

    if (!this.browser) {
      this.browser = await puppeteer.launch(launchConfig);
    }
  }

  public async getWebScraper(): Promise<Page> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    if (!this.page) {
      this.page = await this.browser.newPage();
    }

    await this.page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    );

    return this.page;
  }

  public async openNewPage(): Promise<Page> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const page = await this.browser.newPage();

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    );

    this.page = page;

    return page;
  }

  public async closeBrowser(): Promise<void> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    await this.browser.close();

    this.browser = undefined;
    this.page = undefined;
  }

  public async takeScreenshot(path: string): Promise<void> {
    await this.page?.screenshot({ path });
  }
}
