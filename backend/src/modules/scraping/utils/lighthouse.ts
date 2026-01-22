import lighthouse from 'lighthouse';
import { chromium } from 'playwright-extra';

export interface LighthouseResults {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
}

export const lighthouseAnalyzer = {
  async analyze(url: string): Promise<LighthouseResults> {
    // Launch browser
    const browser = await chromium.launch({
      headless: true,
    });

    const wsEndpoint = browser.wsEndpoint();
    const port = parseInt(new URL(wsEndpoint).port, 10);

    try {
      const result = await lighthouse(url, {
        port,
        output: 'json',
        logLevel: 'error',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      });

      if (!result || !result.lhr) {
        throw new Error('Lighthouse failed to generate report');
      }

      const { categories } = result.lhr;

      return {
        performance: Math.round((categories.performance?.score || 0) * 100),
        accessibility: Math.round((categories.accessibility?.score || 0) * 100),
        bestPractices: Math.round((categories['best-practices']?.score || 0) * 100),
        seo: Math.round((categories.seo?.score || 0) * 100),
      };
    } finally {
      await browser.close();
    }
  },

  needsRedesign(results: LighthouseResults): boolean {
    // Consider a website needs redesign if any key metric is below 50
    return (
      results.performance < 50 ||
      results.seo < 50 ||
      results.accessibility < 40
    );
  },
};
