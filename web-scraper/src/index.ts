import puppeteer from 'puppeteer';

function wait(seconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, seconds * 1000);
  });
}

(async () => {
  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  console.log('OPENING URL: https://www.promodescuentos.com/search?q=bug');
  await page.goto('https://www.promodescuentos.com/search?q=bug');

  console.log('DELAYING 3 SECONDS UNTIL ELEMENTS LOAD');
  await wait(3);

  console.log('SCRAPING HTML ELEMENTS');
  const containerElement = await page.$('.js-threadList');

  if (containerElement) {
    const bugs = await containerElement.$$eval('article', (articles) => {
      return articles.map((article) => {
        const threadLinkElement = article.querySelector(
          '.thread-title .thread-link'
        );

        const priceElement = article.querySelector(
          '.overflow--fade .threadItemCard-price'
        );
        const price = priceElement ? priceElement.textContent.trim() : null;

        const imgElement = article.querySelector('.threadGrid-image img');
        const image = imgElement ? imgElement.getAttribute('src') : null;

        const anchorElement = article.querySelector('.footerMeta-actionSlot a');
        const link = anchorElement ? anchorElement.getAttribute('href') : null;

        return {
          title: threadLinkElement.textContent,
          price,
          image,
          link
        };
      });
    });

    // Iterate through the extracted thread-link text contents and log or perform other actions
    for (const bug of bugs) {
      const { title, price, image } = bug;
      console.log('Title:', title);
      console.log('Price:', price);
      console.log('Image:' + image);
      console.log('Price:' + price);
    }
  }

  await browser.close();
})();
