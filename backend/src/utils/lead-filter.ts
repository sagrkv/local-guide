/**
 * Lead Filter Utility
 *
 * Validates leads against user-defined filter criteria.
 * Only leads that match all specified filters will be saved and charged credits.
 */

import type {
  LeadFilters,
  FilterableLead,
  FilterValidationResult,
} from '../types/filters.js';

/**
 * Check if a value is considered "present" (non-null, non-undefined, non-empty string)
 */
function hasValue(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return true;
}

/**
 * Validates a lead against the provided filter criteria.
 *
 * @param lead - The lead data to validate
 * @param filters - The filter criteria to validate against
 * @returns FilterValidationResult with isValid flag and filter reasons
 *
 * @example
 * ```typescript
 * const filters: LeadFilters = {
 *   hasWebsite: true,
 *   hasEmail: true,
 *   minRating: 3.5,
 *   minReviews: 10
 * };
 *
 * const result = isLeadValid(lead, filters);
 * if (result.isValid) {
 *   // Save lead and charge credits
 * } else {
 *   // Skip lead, log filter reasons
 *   console.log('Filtered out:', result.filterReasons);
 * }
 * ```
 */
export function isLeadValid(
  lead: FilterableLead,
  filters: LeadFilters | null | undefined
): FilterValidationResult {
  const filterReasons: string[] = [];

  // If no filters provided, all leads are valid
  if (!filters || Object.keys(filters).length === 0) {
    return { isValid: true, filterReasons: [] };
  }

  // Check hasWebsite filter
  if (filters.hasWebsite !== undefined) {
    const leadHasWebsite = hasValue(lead.website);
    if (filters.hasWebsite === true && !leadHasWebsite) {
      filterReasons.push('No website (filter requires website)');
    } else if (filters.hasWebsite === false && leadHasWebsite) {
      filterReasons.push('Has website (filter requires no website)');
    }
  }

  // Check hasEmail filter
  if (filters.hasEmail !== undefined) {
    const leadHasEmail = hasValue(lead.email);
    if (filters.hasEmail === true && !leadHasEmail) {
      filterReasons.push('No email (filter requires email)');
    } else if (filters.hasEmail === false && leadHasEmail) {
      filterReasons.push('Has email (filter requires no email)');
    }
  }

  // Check hasPhone filter
  if (filters.hasPhone !== undefined) {
    const leadHasPhone = hasValue(lead.phone);
    if (filters.hasPhone === true && !leadHasPhone) {
      filterReasons.push('No phone (filter requires phone)');
    } else if (filters.hasPhone === false && leadHasPhone) {
      filterReasons.push('Has phone (filter requires no phone)');
    }
  }

  // Check minRating filter
  if (filters.minRating !== undefined && filters.minRating > 0) {
    const leadRating = lead.rating ?? 0;
    if (leadRating < filters.minRating) {
      filterReasons.push(
        `Rating ${leadRating} < ${filters.minRating} (minimum required)`
      );
    }
  }

  // Check minReviews filter
  if (filters.minReviews !== undefined && filters.minReviews > 0) {
    const leadReviews = lead.reviewCount ?? 0;
    if (leadReviews < filters.minReviews) {
      filterReasons.push(
        `Reviews ${leadReviews} < ${filters.minReviews} (minimum required)`
      );
    }
  }

  return {
    isValid: filterReasons.length === 0,
    filterReasons,
  };
}

/**
 * Parse and validate filter criteria from JSON.
 * Returns null if filters are invalid or empty.
 *
 * @param filtersJson - JSON object or string containing filter criteria
 * @returns Validated LeadFilters or null
 */
export function parseFilters(
  filtersJson: unknown
): LeadFilters | null {
  if (!filtersJson) {
    return null;
  }

  // If it's a string, try to parse it
  let filters: Record<string, unknown>;
  if (typeof filtersJson === 'string') {
    try {
      filters = JSON.parse(filtersJson);
    } catch {
      return null;
    }
  } else if (typeof filtersJson === 'object' && filtersJson !== null) {
    filters = filtersJson as Record<string, unknown>;
  } else {
    return null;
  }

  // Build validated filters object
  const validatedFilters: LeadFilters = {};

  // Validate hasWebsite
  if ('hasWebsite' in filters && typeof filters.hasWebsite === 'boolean') {
    validatedFilters.hasWebsite = filters.hasWebsite;
  }

  // Validate hasEmail
  if ('hasEmail' in filters && typeof filters.hasEmail === 'boolean') {
    validatedFilters.hasEmail = filters.hasEmail;
  }

  // Validate hasPhone
  if ('hasPhone' in filters && typeof filters.hasPhone === 'boolean') {
    validatedFilters.hasPhone = filters.hasPhone;
  }

  // Validate minRating (must be number between 1-5)
  if ('minRating' in filters && typeof filters.minRating === 'number') {
    const rating = filters.minRating;
    if (rating >= 1 && rating <= 5) {
      validatedFilters.minRating = rating;
    }
  }

  // Validate minReviews (must be non-negative integer)
  if ('minReviews' in filters && typeof filters.minReviews === 'number') {
    const reviews = Math.floor(filters.minReviews);
    if (reviews >= 0) {
      validatedFilters.minReviews = reviews;
    }
  }

  // Return null if no valid filters were found
  if (Object.keys(validatedFilters).length === 0) {
    return null;
  }

  return validatedFilters;
}

/**
 * Get a human-readable summary of the applied filters
 *
 * @param filters - The filter criteria
 * @returns Human-readable filter description
 */
export function getFilterSummary(filters: LeadFilters | null | undefined): string {
  if (!filters || Object.keys(filters).length === 0) {
    return 'No filters applied';
  }

  const parts: string[] = [];

  if (filters.hasWebsite === true) {
    parts.push('has website');
  } else if (filters.hasWebsite === false) {
    parts.push('no website');
  }

  if (filters.hasEmail === true) {
    parts.push('has email');
  } else if (filters.hasEmail === false) {
    parts.push('no email');
  }

  if (filters.hasPhone === true) {
    parts.push('has phone');
  } else if (filters.hasPhone === false) {
    parts.push('no phone');
  }

  if (filters.minRating !== undefined) {
    parts.push(`rating >= ${filters.minRating}`);
  }

  if (filters.minReviews !== undefined) {
    parts.push(`reviews >= ${filters.minReviews}`);
  }

  return parts.join(', ');
}
