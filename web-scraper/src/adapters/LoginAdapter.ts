import { LoginService, NotificationService, WebScraperService } from '../ports';

export default class LoginAdapter implements LoginService {
  private readonly notificationService: NotificationService;

  private readonly screenshotPath = 'screenshot.png';

  constructor(notificationService: NotificationService) {
    this.notificationService = notificationService;
  }

  public async login(webScraperService: WebScraperService): Promise<void> {
    let webScraper;
    try {
      webScraper = await webScraperService.getWebScraper();

      await webScraper.goto('https://www.promodescuentos.com/', {
        waitUntil: 'networkidle2'
      });

      const loginButton = await webScraper.$('button[data-t="login"]');

      if (loginButton) {
        console.log('Logging in to page');

        await webScraper.$eval('button[data-t="login"]', (button) =>
          button.click()
        );

        await webScraper.waitForSelector('input[name="identity"]', {
          visible: true
        });
        await webScraper.$eval('input[name="identity"]', (input) => {
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

        await webScraper.$eval('button[type="submit"]', (button) =>
          button.click()
        );

        await webScraper.waitForSelector('input[name="password"]', {
          visible: true
        });
        await webScraper.$eval('input[name="password"]', (input) => {
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

        await webScraper.$eval('button[type="submit"]', (button) =>
          button.click()
        );
      }
    } catch (error) {
      await webScraper?.screenshot({ path: this.screenshotPath });

      await this.notificationService.notifyError(
        (error as Error).message,
        this.screenshotPath
      );
    }
  }
}
