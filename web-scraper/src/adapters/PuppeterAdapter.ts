import puppeteer from 'puppeteer-extra';
import { PuppeteerLaunchOptions } from 'puppeteer';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { ScraperService } from '../ports';
import { ScrapedContent } from '../ports/ScraperService';

puppeteer.use(StealthPlugin());

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
        const launchConfig: PuppeteerLaunchOptions = {
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        };

        if (!isLocalHost) {
            launchConfig['executablePath'] = '/usr/bin/google-chrome';
        }

        const browser = await puppeteer.launch(launchConfig);

        const page = await browser.newPage();
        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        );

        let scrapedContent: ScrapedContent[] = [];

        console.log(`OPENING URL: ${url}`);
        await page.goto(url);

        console.log('SCRAPING HTML ELEMENTS');

        await Promise.race([
            page.waitForSelector('.js-threadList'),
            this.timeOut()
        ]);

        const containerElement = await page.$('.js-threadList');
        if (containerElement) {
            console.log('PROCESSING SCRAPED ELEMENTS');
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
