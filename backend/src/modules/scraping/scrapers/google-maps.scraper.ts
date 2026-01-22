import { chromium } from 'playwright-extra';
import type { Browser, Page } from 'playwright-core';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
// @ts-ignore
import UserAgent from 'user-agents';
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
  interval: 60000, // 1 minute
});

export const googleMapsScraper = {
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
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
        ],
      });

      const context = await browser.newContext({
        userAgent: userAgent.toString(),
        viewport: { width: 1920, height: 1080 },
        locale: 'en-US',
      });

      const page = await context.newPage();

      // Navigate to Google Maps search
      const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(`${query} in ${location}`)}`;

      await queue.add(async () => {
        await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 30000 });
        await delay(config.scrapeDelayMs);
      });

      // Wait for results to load
      await page.waitForSelector('[role="feed"]', { timeout: 10000 }).catch(() => null);

      // Scroll to load more results
      const resultsContainer = await page.$('[role="feed"]');
      if (resultsContainer) {
        for (let i = 0; i < 5 && maxResults > 10; i++) {
          await resultsContainer.evaluate((el) => {
            el.scrollTop = el.scrollHeight;
          });
          await delay(1500);
        }
      }

      // Extract business listings
      const listings = await page.$$('[role="feed"] > div > div > a[href*="/maps/place/"]');
      const businesses: ScrapedBusiness[] = [];

      for (const listing of listings.slice(0, maxResults)) {
        try {
          const business = await this.extractBusinessInfo(page, listing);
          if (business) {
            businesses.push({
              ...business,
              city: location,
            });
          }
        } catch (error) {
          console.error('Error extracting business:', error);
        }

        // Rate limit between extractions
        await delay(config.scrapeDelayMs);
      }

      return businesses;
    } catch (error) {
      console.error('Google Maps scraping error:', error);
      return [];
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  },

  async extractBusinessInfo(page: Page, listing: any): Promise<ScrapedBusiness | null> {
    try {
      // Click on the listing to open details
      await listing.click();
      await delay(2000);

      // Extract basic info from the side panel
      const name = await page.$eval(
        'h1.DUwDvf',
        (el) => el.textContent?.trim() || ''
      ).catch(() => '');

      if (!name) return null;

      // Extract phone number
      const phone = await page.$eval(
        '[data-item-id*="phone"] .Io6YTe',
        (el) => el.textContent?.trim() || ''
      ).catch(() => undefined);

      // Extract website
      const website = await page.$eval(
        '[data-item-id*="authority"] a',
        (el) => el.getAttribute('href') || ''
      ).catch(() => undefined);

      // Extract address
      const address = await page.$eval(
        '[data-item-id*="address"] .Io6YTe',
        (el) => el.textContent?.trim() || ''
      ).catch(() => undefined);

      // Try to extract email if website exists
      let email: string | undefined;
      if (website) {
        try {
          const websiteResponse = await page.context().request.get(website, {
            timeout: 10000,
          });
          const html = await websiteResponse.text();
          const emails = emailExtractor.extractFromHtml(html);
          email = emailExtractor.findBestEmail(emails);
        } catch (error) {
          // Failed to fetch website for email
        }
      }

      return {
        businessName: name,
        phone,
        website: website || undefined,
        address,
        email,
        hasWebsite: !!website,
      };
    } catch (error) {
      console.error('Error extracting business info:', error);
      return null;
    }
  },
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
