import { LoginService, WebScraperService } from '../ports';

export default class LoginAdapter implements LoginService {
  private readonly webScraper: WebScraperService;
  constructor(webScrapper: WebScraperService) {
    this.webScraper = webScrapper;
  }

  public async login(isLocalHost: boolean): Promise<void> {
    const browser = await this.webScraper.getBroswer(isLocalHost);
    const page = await this.webScraper.getPage(browser);

    console.log('Logging in to page');

    await page.goto('https://www.promodescuentos.com/', {
      waitUntil: 'networkidle2'
    });

    await page.$eval('button[data-t="login"]', (button) => button.click());

    await page.waitForSelector('input[name="identity"]', { visible: true });
    await page.$eval('input[name="identity"]', (input) => {
      const email = 'mageerauld+7jety@gmail.com';
      input.focus();
      for (let i = 0; i < email.length; i++) {
        const event = new KeyboardEvent('keydown', { bubbles: true });
        input.dispatchEvent(event);
        input.value += email[i];
        const inputEvent = new Event('input', { bubbles: true });
        input.dispatchEvent(inputEvent);
      }
    });

    await page.$eval('button[type="submit"]', (button) => button.click());

    await page.waitForSelector('input[name="password"]', { visible: true });
    await page.$eval('input[name="password"]', (input) => {
      const value = 'zWt7)I44z!8_';
      input.focus();
      for (let i = 0; i < value.length; i++) {
        const event = new KeyboardEvent('keydown', { bubbles: true });
        input.dispatchEvent(event);
        input.value += value[i];
        const inputEvent = new Event('input', { bubbles: true });
        input.dispatchEvent(inputEvent);
      }
    });

    await page.$eval('button[type="submit"]', (button) => button.click());
  }
}
