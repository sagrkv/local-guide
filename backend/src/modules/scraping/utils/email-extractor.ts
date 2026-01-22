import emailRegex from 'email-regex';
import * as cheerio from 'cheerio';

export const emailExtractor = {
  extractFromText(text: string): string[] {
    const regex = emailRegex({ exact: false });
    const matches = text.match(regex) || [];

    // Filter out common false positives
    return [...new Set(matches)].filter((email) => {
      const lower = email.toLowerCase();
      // Filter out common non-personal emails
      if (lower.includes('example.com')) return false;
      if (lower.includes('test.com')) return false;
      if (lower.includes('email@')) return false;
      if (lower.includes('@email')) return false;
      if (lower.startsWith('your@')) return false;
      // Filter out image/file extensions that might match
      if (lower.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) return false;
      return true;
    });
  },

  extractFromHtml(html: string): string[] {
    const $ = cheerio.load(html);
    const emails: string[] = [];

    // Find mailto links
    $('a[href^="mailto:"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href) {
        const email = href.replace('mailto:', '').split('?')[0];
        if (email) emails.push(email);
      }
    });

    // Extract from text content
    const textContent = $('body').text();
    const textEmails = this.extractFromText(textContent);
    emails.push(...textEmails);

    // Look in common places
    const commonSelectors = [
      '.contact',
      '.footer',
      '#contact',
      '#footer',
      '[class*="contact"]',
      '[class*="footer"]',
      '[id*="contact"]',
    ];

    commonSelectors.forEach((selector) => {
      $(selector).each((_, el) => {
        const sectionText = $(el).text();
        const sectionEmails = this.extractFromText(sectionText);
        emails.push(...sectionEmails);
      });
    });

    // Also check meta tags
    $('meta[content*="@"]').each((_, el) => {
      const content = $(el).attr('content');
      if (content) {
        const metaEmails = this.extractFromText(content);
        emails.push(...metaEmails);
      }
    });

    return [...new Set(emails)];
  },

  findBestEmail(emails: string[]): string | undefined {
    if (emails.length === 0) return undefined;
    if (emails.length === 1) return emails[0];

    // Prefer emails with these patterns (in order)
    const preferredPatterns = [
      /^(info|contact|hello|enquiry|enquiries|sales)@/i,
      /^(support|help|admin)@/i,
    ];

    for (const pattern of preferredPatterns) {
      const match = emails.find((e) => pattern.test(e));
      if (match) return match;
    }

    // If no preferred pattern, return the first one
    return emails[0];
  },
};
