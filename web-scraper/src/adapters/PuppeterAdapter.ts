import puppeteer from 'puppeteer';
import { ScraperService } from '../ports';
import { ScrapedContent } from '../ports/ScraperService';

export default class PuppeterAdapter implements ScraperService {
    private wait(seconds: number): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(resolve, seconds * 1000);
        });
    }

    public async scrapPage(
        isLocalHost: boolean,
        url: string
    ): Promise<ScrapedContent[]> {
        console.log('Opening page');
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            executablePath: isLocalHost ? '/usr/bin/google-chrome' : undefined
        });
        const page = await browser.newPage();

        let scrapedContent: ScrapedContent[] = [];

        console.log(`OPENING URL: ${url}`);
        await page.goto(url);

        console.log('DELAYING 3 SECONDS UNTIL ELEMENTS LOAD');
        await this.wait(3);

        console.log('SCRAPING HTML ELEMENTS');
        const containerElement = await page.$('.js-threadList');

        if (containerElement) {
            const tagSales = await containerElement.$$eval(
                'article',
                (articles) => {
                    return articles.map((article) => {
                        const threadLinkElement = article.querySelector(
                            '.thread-title .thread-link'
                        );

                        const priceElement = article.querySelector(
                            '.overflow--fade .threadItemCard-price'
                        );
                        const price = priceElement
                            ? priceElement.textContent.trim()
                            : null;

                        const imgElement = article.querySelector(
                            '.threadGrid-image img'
                        );
                        const image = imgElement
                            ? imgElement.getAttribute('src')
                            : null;

                        const anchorElement =
                            article.querySelector('.thread-title a');
                        const link = anchorElement
                            ? anchorElement.getAttribute('href')
                            : null;

                        const isExpired = article
                            .querySelector(
                                '.threadGrid-headerMeta .size--all-s'
                            )
                            .textContent.trim();

                        return {
                            articleId: article.id,
                            title: threadLinkElement.textContent,
                            price,
                            image,
                            link,
                            isExpired: isExpired === 'Expirado'
                        };
                    });
                }
            );

            scrapedContent = scrapedContent.concat(tagSales);
        }

        await browser.close();

        return scrapedContent;
    }
}
