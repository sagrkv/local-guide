/**
 * Lead Filters Type Definitions
 *
 * Pre-scrape filters that users can set to only pay credits for leads
 * matching their specified criteria.
 */

/**
 * Filter option for optional boolean fields.
 * - true: Must have this field (e.g., must have website)
 * - false: Must NOT have this field (e.g., must not have website)
 * - undefined: Don't filter by this field (any value accepted)
 */
export type BooleanFilterOption = boolean | undefined;

/**
 * Pre-scrape filter criteria for lead filtering.
 * Users only pay credits for leads matching these criteria.
 */
export interface LeadFilters {
  /**
   * Filter by website presence
   * - true: Only leads WITH a website
   * - false: Only leads WITHOUT a website
   * - undefined: Any (don't filter)
   */
  hasWebsite?: BooleanFilterOption;

  /**
   * Filter by email presence
   * - true: Only leads WITH an email
   * - false: Only leads WITHOUT an email
   * - undefined: Any (don't filter)
   */
  hasEmail?: BooleanFilterOption;

  /**
   * Filter by phone presence
   * - true: Only leads WITH a phone number
   * - false: Only leads WITHOUT a phone number
   * - undefined: Any (don't filter)
   */
  hasPhone?: BooleanFilterOption;

  /**
   * Minimum Google rating (1-5 stars)
   * Only leads with rating >= this value will match.
   * undefined means no minimum rating filter.
   */
  minRating?: number;

  /**
   * Minimum number of Google reviews
   * Only leads with reviewCount >= this value will match.
   * undefined means no minimum reviews filter.
   */
  minReviews?: number;
}

/**
 * Partial lead data used for filter validation.
 * Contains the fields that can be filtered against.
 */
export interface FilterableLead {
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
}

/**
 * Result of filter validation
 */
export interface FilterValidationResult {
  /** Whether the lead matches all filter criteria */
  isValid: boolean;

  /** Reasons why the lead was filtered out (if isValid is false) */
  filterReasons: string[];
}
