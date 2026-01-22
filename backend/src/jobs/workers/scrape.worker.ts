import { Job } from 'bullmq';
import { ScrapeJobType, LeadCategory } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { googleMapsScraper } from '../../modules/scraping/scrapers/google-maps.scraper.js';
import { googleSearchScraper } from '../../modules/scraping/scrapers/google-search.scraper.js';
import { perplexityClient } from '../../modules/scraping/utils/perplexity.js';

interface ScrapeJobData {
  jobId: string;
  type: ScrapeJobType;
  query: string;
  location?: string;
  category?: LeadCategory;
  regionId?: string;
  maxResults: number;
}

export async function scrapeWorker(job: Job<ScrapeJobData>) {
  const { jobId, type, query, location, category, regionId, maxResults } = job.data;

  console.log(`Starting scrape job ${jobId}: ${type} - ${query}`);

  // Update job status to RUNNING
  await prisma.scrapeJob.update({
    where: { id: jobId },
    data: {
      status: 'RUNNING',
      startedAt: new Date(),
    },
  });

  try {
    let results: Array<{
      businessName: string;
      contactPerson?: string;
      email?: string;
      phone?: string;
      website?: string;
      address?: string;
      city?: string;
      state?: string;
      hasWebsite: boolean;
    }> = [];

    // Get region cities if regionId is provided
    let locations: string[] = location ? [location] : [];
    if (regionId) {
      const region = await prisma.scrapingRegion.findUnique({
        where: { id: regionId },
      });
      if (region) {
        locations = region.cities;
      }
    }

    // Scrape based on type
    switch (type) {
      case 'GOOGLE_MAPS':
        for (const loc of locations) {
          const mapResults = await googleMapsScraper.scrape(query, loc, maxResults);
          results.push(...mapResults);

          // Update progress
          await job.updateProgress({
            location: loc,
            found: results.length,
          });
        }
        break;

      case 'GOOGLE_SEARCH':
        for (const loc of locations) {
          const searchResults = await googleSearchScraper.scrape(query, loc, maxResults);
          results.push(...searchResults);

          await job.updateProgress({
            location: loc,
            found: results.length,
          });
        }
        break;

      case 'PERPLEXITY':
        const perplexityResults = await perplexityClient.searchBusinesses(
          query,
          locations[0]
        );
        results = perplexityResults.map((r) => ({
          businessName: r.name,
          email: r.email,
          phone: r.phone,
          website: r.website,
          address: r.address,
          city: r.city,
          hasWebsite: r.hasWebsite,
        }));
        break;
    }

    // Deduplicate and save leads
    let leadsCreated = 0;
    let leadsDuplicate = 0;

    for (const result of results) {
      // Check for existing lead with same name and city
      const existing = await prisma.lead.findFirst({
        where: {
          businessName: { equals: result.businessName, mode: 'insensitive' },
          city: result.city ? { equals: result.city, mode: 'insensitive' } : undefined,
        },
      });

      if (existing) {
        leadsDuplicate++;
        continue;
      }

      // Create the lead
      await prisma.lead.create({
        data: {
          businessName: result.businessName,
          contactPerson: result.contactPerson,
          email: result.email,
          phone: result.phone,
          website: result.website,
          address: result.address,
          city: result.city,
          state: result.state,
          category: category || 'OTHER',
          source: type === 'PERPLEXITY' ? 'PERPLEXITY' : type === 'GOOGLE_MAPS' ? 'GOOGLE_MAPS' : 'GOOGLE_SEARCH',
          leadType: result.hasWebsite ? 'OUTDATED_WEBSITE' : 'NO_WEBSITE',
          hasWebsite: result.hasWebsite,
          scrapeJobId: jobId,
        },
      });

      leadsCreated++;
    }

    // Update job with results
    await prisma.scrapeJob.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        leadsFound: results.length,
        leadsCreated,
        leadsDuplicate,
      },
    });

    console.log(`Scrape job ${jobId} completed: ${leadsCreated} leads created, ${leadsDuplicate} duplicates`);

    return {
      leadsFound: results.length,
      leadsCreated,
      leadsDuplicate,
    };
  } catch (error) {
    console.error(`Scrape job ${jobId} failed:`, error);

    // Update job with error
    await prisma.scrapeJob.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
      },
    });

    throw error;
  }
}
