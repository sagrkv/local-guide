import { chromium, Browser } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import UserAgent from 'user-agents';
import * as cheerio from 'cheerio';
import PQueue from 'p-queue';
import { config } from '../../../config.js';
import { emailExtractor } from '../utils/email-extractor.js';

// Add stealth plugin
chromium.use(StealthPlugin());

interface ScrapedBusiness {
  businessName: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  hasWebsite: boolean;
}

// Rate limiting queue
const queue = new PQueue({
  intervalCap: config.scrapeMaxRequestsPerMinute,
  interval: 60000,
});

export const googleSearchScraper = {
  async scrape(query: string, location: string, maxResults: number = 25): Promise<ScrapedBusiness[]> {
    const userAgent = new UserAgent({ deviceCategory: 'desktop' });
    let browser: Browser | null = null;

    try {
      browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
        ],
      });

      const context = await browser.newContext({
        userAgent: userAgent.toString(),
        viewport: { width: 1920, height: 1080 },
        locale: 'en-US',
      });

      const page = await context.newPage();
      const businesses: ScrapedBusiness[] = [];

      // Construct search queries targeting businesses without/with poor websites
      const searchQueries = [
        `${query} ${location}`,
        `${query} ${location} contact`,
        `new ${query} ${location}`,
      ];

      for (const searchQuery of searchQueries) {
        if (businesses.length >= maxResults) break;

        try {
          await queue.add(async () => {
            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&num=20`;
            await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 30000 });
            await delay(config.scrapeDelayMs);
          });

          // Wait for search results
          await page.waitForSelector('#search', { timeout: 10000 }).catch(() => null);

          // Get page HTML
          const html = await page.content();
          const $ = cheerio.load(html);

          // Extract search results
          const results = $('#search .g');

          for (let i = 0; i < results.length && businesses.length < maxResults; i++) {
            const result = results.eq(i);

            // Extract title and link
            const titleEl = result.find('h3').first();
            const linkEl = result.find('a').first();
            const title = titleEl.text().trim();
            const link = linkEl.attr('href');

            if (!title || !link || link.startsWith('/search')) continue;

            // Skip common non-business results
            if (this.shouldSkipResult(title, link)) continue;

            // Check if this is a potential business
            const business: ScrapedBusiness = {
              businessName: this.cleanBusinessName(title),
              website: link,
              city: location,
              hasWebsite: true,
            };

            // Try to extract more info from the website
            try {
              const websiteInfo = await this.extractFromWebsite(page, link);
              Object.assign(business, websiteInfo);
            } catch (error) {
              // Continue without additional info
            }

            // Deduplicate by name
            if (!businesses.some((b) =>
              b.businessName.toLowerCase() === business.businessName.toLowerCase()
            )) {
              businesses.push(business);
            }

            await delay(config.scrapeDelayMs);
          }
        } catch (error) {
          console.error(`Error with search query "${searchQuery}":`, error);
        }
      }

      return businesses;
    } catch (error) {
      console.error('Google Search scraping error:', error);
      return [];
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  },

  async extractFromWebsite(page: any, url: string): Promise<Partial<ScrapedBusiness>> {
    try {
      await queue.add(async () => {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await delay(1000);
      });

      const html = await page.content();
      const $ = cheerio.load(html);

      // Extract email
      const emails = emailExtractor.extractFromHtml(html);
      const email = emailExtractor.findBestEmail(emails);

      // Extract phone - look for common patterns
      const phoneRegex = /(?:\+91[\-\s]?)?(?:[6-9]\d{9}|[0-9]{2,4}[\-\s]?[0-9]{6,8})/g;
      const bodyText = $('body').text();
      const phones = bodyText.match(phoneRegex);
      const phone = phones ? phones[0].replace(/[\s-]/g, '') : undefined;

      // Try to find address
      const addressSelectors = [
        '[class*="address"]',
        '[id*="address"]',
        '.contact-info',
        '.footer',
      ];

      let address: string | undefined;
      for (const selector of addressSelectors) {
        const el = $(selector).first();
        if (el.length) {
          const text = el.text().trim();
          if (text.length > 10 && text.length < 200) {
            address = text;
            break;
          }
        }
      }

      return {
        email,
        phone,
        address,
      };
    } catch (error) {
      return {};
    }
  },

  shouldSkipResult(title: string, link: string): boolean {
    const skipDomains = [
      'wikipedia.org',
      'facebook.com',
      'twitter.com',
      'instagram.com',
      'linkedin.com',
      'youtube.com',
      'justdial.com',
      'sulekha.com',
      'indiamart.com',
      'glassdoor.com',
    ];

    const skipTitlePatterns = [
      /top \d+/i,
      /best \d+/i,
      /\d+ best/i,
      /list of/i,
      /wikipedia/i,
      /review/i,
    ];

    // Check domain
    for (const domain of skipDomains) {
      if (link.includes(domain)) return true;
    }

    // Check title patterns
    for (const pattern of skipTitlePatterns) {
      if (pattern.test(title)) return true;
    }

    return false;
  },

  cleanBusinessName(title: string): string {
    return title
      .replace(/\s*[-|–—]\s*.+$/, '') // Remove everything after dash/pipe
      .replace(/\s*\|.+$/, '')
      .replace(/\s+/g, ' ')
      .trim();
  },
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
