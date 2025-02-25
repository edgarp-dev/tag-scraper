import { TagProcessorService, WebScraperService } from '../ports';
import { ScrapedContent } from '../ports/TagProcessorService';

export default class TagProcessorAdapter implements TagProcessorService {
  private readonly webScraper: WebScraperService;
  constructor(webScrapper: WebScraperService) {
    this.webScraper = webScrapper;
  }

  public async processTags(
    isLocalHost: boolean,
    url: string
  ): Promise<ScrapedContent[]> {
    const browser = await this.webScraper.getBroswer(isLocalHost);
    const page = await this.webScraper.getPage(browser);

    let scrapedContent: ScrapedContent[] = [];

    console.log(`OPENING URL: ${url}`);
    await page.goto(url, {
      waitUntil: 'networkidle2'
    });

    console.log('SCRAPING HTML ELEMENTS');

    await Promise.race([
      page.waitForSelector('.js-threadList'),
      this.timeOut()
    ]);

    page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));

    const containerElement = await page.$('.js-threadList');
    if (containerElement) {
      console.log('PROCESSING SCRAPED ELEMENTS');

      const tagSales = await containerElement.$$eval('article', (articles) => {
        return articles.map((article) => {
          const threadLinkElement = article.querySelector(
            '.thread-title .thread-link'
          );
          const title = threadLinkElement?.textContent?.trim() ?? '';

          const priceElement = article.querySelector(
            '.text--b.size--all-xl.size--fromW3-xxl'
          );
          const price = priceElement?.textContent?.trim() ?? '$0';

          const imgElement = article.querySelector('.threadListCard-image img');
          const image = imgElement?.getAttribute('src') ?? '';

          const link = threadLinkElement?.getAttribute('href') ?? '';

          const expiredElement = article.querySelector(
            '.chip--type-expired .size--all-s'
          );
          const isExpired =
            expiredElement?.textContent?.trim().includes('Expiró') ?? false;

          return {
            threadId: article.id,
            id: article.id.replace('thread_', ''),
            title: title,
            price,
            image,
            link,
            isExpired
          };
        });
      });
      scrapedContent = scrapedContent.concat(tagSales);
    }

    return scrapedContent;
  }

  private timeOut(): Promise<void> {
    const timeoutInMilliseconds = 10000;
    return new Promise((_resolve, reject) => {
      setTimeout(
        () =>
          reject(
            new Error(
              `Timeout reached after ${timeoutInMilliseconds} milliseconds`
            )
          ),
        timeoutInMilliseconds
      );
    });
  }
}
