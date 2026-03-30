# AutoResearch PRD — Paper Maps Living Intelligence System

> **Version:** 1.0  
> **Date:** 2026-03-30  
> **Status:** Draft → Implementation  
> **Repo:** summarstudios/papermaps

---

## 1. Executive Summary

Paper Maps is "The anti-Google-Maps" — beautifully curated, opinionated city maps that surface the soul of a place: the hidden chai stall, the century-old bookshop, the rooftop where locals go at sunset. Not the TripAdvisor top-10. The real thing.

But cities are living organisms. Places open and close. The chai stall that defined a neighbourhood gets replaced by a bubble tea chain. The unknown rooftop gets featured in a Condé Nast article and promptly ruined by influencers. **Without active curation, every map starts dying the day it's published.**

The AutoResearch system is the immune system of Paper Maps. It continuously monitors city pulse — blogs, social media, food platforms, local news — filters signals through an LLM curation rubric that knows what "Paper Maps worthy" means, surfaces proposals for human review, and ensures every map stays alive, honest, and trustworthy.

Inspired by Andrej Karpathy's AutoResearch pattern: **plan → search → try → evaluate → improve → repeat.** Applied to city curation, this becomes: **monitor → discover → score → propose → review → publish → feedback → improve.**

**Key outcomes:**
- Maps stay fresh without 24/7 manual curation work
- Every city change has a traceable audit trail
- Curators spend time on decisions, not on discovery
- New cities get objectively ready-to-launch signals
- The curation rubric improves over time from user feedback

---

## 2. The Problem

### 2.1 Maps Go Stale

A Paper Maps city guide is only as good as its freshness. Consider:

- The average urban neighbourhood in India sees **15–30% POI turnover per year** (cafes, restaurants, shops)
- A "hidden gem" that gets featured on Instagram typically sees quality/authenticity degrade within 6–18 months
- New quality places open constantly — a map published 8 months ago is already missing gems
- Closed places remain on maps, destroying trust with users who show up to find a shuttered door

### 2.2 Manual Curation Doesn't Scale

Current workflow:
1. Curator visits/researches a city personally
2. Discovers places through personal network, travel, blogs
3. Manually enters POIs into the admin panel
4. Publishes map
5. ??? (nothing — map is now frozen in amber)

This produces excellent initial maps but creates a maintenance bottleneck:
- A single curator cannot monitor 6 cities simultaneously
- Discovery is limited by personal network and time
- No systematic signal processing from social/digital sources
- Removal/update decisions happen reactively (if at all)

### 2.3 The Signal Exists, It's Just Scattered

Every day, thousands of data signals about city places are published:
- Instagram geotags showing what's trending
- Food bloggers discovering new spots
- Zomato/Swiggy listing new restaurants
- Reddit threads where locals share gems
- Local news covering new openings and closures
- Google Reviews surfacing new places gaining momentum

This signal is rich, real-time, and free. No system is synthesizing it for Paper Maps purposes.

### 2.4 No Feedback Loop

Current Paper Maps has no mechanism to:
- Know which POIs users actually find valuable (saves, shares, clicks)
- Understand which categories/areas are underserved
- Feed user engagement data back to improve curation quality
- Identify which POIs are "famous" vs truly hidden

### 2.5 City Expansion Is Guesswork

Adding a new city requires answering: "Is there enough here for a quality Paper Maps guide?" Currently, this is a gut call. There's no data-driven signal for: how many quality places exist in Hampi? Is Coorg ready? Has Pondicherry been done to death?

---

## 3. The AutoResearch Solution

### 3.1 Core Pattern

```
MONITOR → DISCOVER → SCORE → PROPOSE → REVIEW → PUBLISH → FEEDBACK → IMPROVE
   ↑                                                                        |
   └────────────────────────────────────────────────────────────────────────┘
```

The loop never stops. Each iteration makes the next one smarter.

### 3.2 What AutoResearch Does (and Doesn't Do)

**Does:**
- Continuously discovers candidate places from multiple sources
- Filters out obvious non-starters (chains, tourist traps, duplicates)
- Scores candidates against the Paper Maps rubric
- Surfaces high-confidence candidates for human curator review
- Flags existing POIs that may need removal/review
- Proposes new cities when signal density crosses threshold
- Tracks what resonates with users
- Improves scoring rubric based on feedback

**Doesn't:**
- Publish directly to maps without human review (curator is always in the loop)
- Make final editorial decisions
- Replace the curator's taste and judgment
- Scrape data in ways that violate platforms' ToS (uses public APIs and ethical scraping)

### 3.3 The Curator Contract

AutoResearch is a **proposal engine, not a publishing engine.** Every change to a published map requires explicit human approval. The system's job is to reduce the discovery and evaluation work from hours to minutes. The curator's job is to say yes, no, or "interesting, let me investigate."

---

## 4. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    SOURCE MONITORS                       │
│  Instagram │ Blogs │ Zomato │ Reddit │ Google │ News    │
└────────────────────────┬────────────────────────────────┘
                         │ raw_signals (place mentions)
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  SIGNAL AGGREGATOR                       │
│  Dedup │ Geocode │ Entity Resolution │ Source Weight    │
└────────────────────────┬────────────────────────────────┘
                         │ resolved_candidates
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  LLM CURATION FILTER                     │
│  Paper Maps Rubric │ Scoring │ Evidence Synthesis       │
└────────────────────────┬────────────────────────────────┘
                         │ scored_proposals (score >= threshold)
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   PROPOSAL QUEUE                         │
│  Add │ Update │ Remove │ New City │ Admin UI Review     │
└────────────────────────┬────────────────────────────────┘
                         │ approved_proposals
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  PUBLISHED MAPS                          │
│  POIs │ Cities │ Collections │ Itineraries              │
└────────────────────────┬────────────────────────────────┘
                         │ user_engagement_events
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  FEEDBACK ENGINE                         │
│  Engagement Signals │ Rubric Calibration │ Model Tuning │
└─────────────────────────────────────────────────────────┘
```

### 4.1 Data Flow

1. **Source Monitors** run on schedules (hourly to weekly depending on source). They emit `RawSignal` records to a queue.
2. **Signal Aggregator** deduplicates by place identity, geocodes mentions, resolves entity (is "Koshy's" the same as "Koshy's Restaurant, St Marks Road"?), and attaches source weights.
3. **LLM Curation Filter** receives aggregated candidates and runs them through the Paper Maps rubric. Outputs a `Proposal` with score, reasoning, and evidence.
4. **Proposal Queue** holds pending proposals. Admin UI shows curators the queue with one-click approve/reject. High-confidence proposals bubble to top.
5. **Published Maps** are updated only on explicit curator approval. The full audit trail (which source, what signal, what score, who approved) is stored.
6. **Feedback Engine** collects user engagement events and periodically recalibrates scoring weights and rubric criteria.

---

## 5. Source Monitor Specifications

### 5.1 Instagram Geotag Monitor

**Purpose:** Detect emerging/trending spots through location tagging  
**Method:** Instagram Basic Display API + web scraping of public location pages  
**Frequency:** Every 6 hours  
**Signals to extract:**
- Post count per location tag (trending = rapid growth in tag volume)
- Caption sentiment and vocabulary (mentions of "hidden", "local", "gem", "must visit")
- Follower quality of posters (micro-influencers > mega, locals > tourists)
- Engagement rate on location posts
- Photo aesthetic quality (proxy: engagement vs follower ratio)

**Output schema:**
```json
{
  "source": "instagram_geotag",
  "place_name": "Brahmin's Coffee Bar",
  "location": { "lat": 12.9716, "lng": 77.5946 },
  "city": "bangalore",
  "signal_type": "trending",
  "evidence": {
    "post_count_7d": 145,
    "post_count_30d": 203,
    "growth_rate": 2.1,
    "sample_captions": ["...", "..."],
    "top_hashtags": ["#hiddengem", "#bangalorecafe"]
  },
  "scraped_at": "2026-03-30T10:00:00Z"
}
```

**Anti-patterns to filter:**
- Corporate/chain location tags (Starbucks, McDonald's, Barbeque Nation)
- Tourist traps with >10k consistent monthly posts (already overdone)
- Mall food courts and hotel restaurants

### 5.2 Travel Blog Monitor

**Purpose:** Discover editor-curated recommendations from trusted India travel writers  
**Sources:**
- Little Black Book (lbb.in) — city guides, neighbourhood features
- Nat Geo Traveller India (natgeotraveller.in)
- Time Out India (timeout.com/india)
- Curly Tales (curlytales.com)
- Condé Nast Traveller India
- Outlook Traveller
- Local blogs (city-specific, discovered via link graph)

**Method:** RSS feeds (where available) + periodic HTML scraping  
**Frequency:** Every 12 hours  
**Signals to extract:**
- Place mentions in article body (NER extraction)
- Article recency (prefer < 6 months)
- Article title signals ("hidden", "local", "secret", "underrated", "off the beaten path")
- Source reputation weight (LBB > random blog)
- How many times a place appears across multiple trusted sources (corroboration score)

**Output schema:**
```json
{
  "source": "travel_blog",
  "blog": "lbb",
  "article_url": "https://lbb.in/bangalore/...",
  "article_title": "12 Hidden Cafes In Bangalore Only Locals Know",
  "article_date": "2026-02-15",
  "place_name": "Matteo Coffea",
  "location_hint": "Church Street, Bangalore",
  "city": "bangalore",
  "signal_type": "editorial_mention",
  "evidence": {
    "article_excerpt": "...",
    "source_reputation_score": 0.85,
    "corroboration_count": 3
  }
}
```

**Priority signals:**
- Place mentioned in 3+ articles = high corroboration
- Place mentioned in "hidden gems" style articles = authenticity signal
- Place NOT appearing on Google Maps top results = off-beaten-path signal

### 5.3 Zomato/Swiggy New Listings Monitor

**Purpose:** Detect new quality food & drink places before they become mainstream  
**Method:** Zomato API (where available) + web scraping new restaurant listings  
**Frequency:** Every 24 hours  
**Signals to extract:**
- Newly listed restaurants in target cities (< 90 days old)
- Rating trajectory (rising fast = worth watching)
- Review content NLP (mentions of "ambience", "unique", "hidden", "local crowd")
- Price range (mid-range preferred over budget chains or luxury)
- Category signals (independent cafes, regional cuisine, specialty formats)
- Photo quality of listing

**Output schema:**
```json
{
  "source": "zomato",
  "place_name": "The Filter Coffee House",
  "zomato_id": "18892456",
  "location": { "lat": 12.9710, "lng": 77.5947, "area": "Indiranagar" },
  "city": "bangalore",
  "signal_type": "new_listing",
  "evidence": {
    "rating": 4.3,
    "rating_count": 127,
    "age_days": 45,
    "rating_velocity": 0.04,
    "price_for_two": 450,
    "review_samples": ["..."],
    "is_chain": false,
    "chain_name": null
  }
}
```

**Chain detection:**
- Known chain list (maintained in config)
- Multiple outlets in city = likely chain
- Franchisee patterns in name ("XYZ - Koramangala Branch")

### 5.4 Google Reviews Rising Monitor

**Purpose:** Catch places gaining rapid momentum before they hit mainstream curation  
**Method:** Google Places API (New) — search by location, filter by recency + rating  
**Frequency:** Every 48 hours  
**Signals to extract:**
- Places opened < 18 months with rating > 4.3
- Review volume growth rate (50+ reviews in < 3 months = signal)
- Review recency distribution (mostly recent = still alive and good)
- Editorial summary (Google's AI summary of what people say)
- Photo count and quality

**Output schema:**
```json
{
  "source": "google_reviews",
  "place_name": "Koshy's",
  "google_place_id": "ChIJXXX",
  "location": { "lat": 12.9725, "lng": 77.5938 },
  "city": "bangalore",
  "signal_type": "rising",
  "evidence": {
    "rating": 4.5,
    "review_count": 2340,
    "reviews_last_90d": 287,
    "age_months": 8,
    "editorial_summary": "...",
    "types": ["cafe", "restaurant"]
  }
}
```

### 5.5 Reddit Local Monitor

**Purpose:** Surface authentic local recommendations from real residents  
**Sources:**
- r/bangalore, r/mumbai, r/delhi, r/pune, r/hyderabad, r/Chennai
- r/india (city-tagged posts)
- r/IndiaTravelInformation
- City-specific subreddits for each Paper Maps city

**Method:** Reddit API (PRAW) — search for place recommendation threads  
**Frequency:** Every 6 hours  
**Signals to extract:**
- Posts asking "hidden gems in [city]", "underrated places in [city]", etc.
- Place mentions in top-voted comments (upvote count as quality signal)
- Multiple commenters independently mentioning same place = strong signal
- Time since post (recent posts preferred but older highly-upvoted also valid)
- Poster account age and karma (established locals > new accounts)

**Output schema:**
```json
{
  "source": "reddit",
  "subreddit": "bangalore",
  "thread_url": "https://reddit.com/r/bangalore/...",
  "thread_title": "What are some underrated places to eat in Bangalore?",
  "place_name": "Veena Stores",
  "city": "bangalore",
  "signal_type": "local_recommendation",
  "evidence": {
    "mention_count_in_thread": 3,
    "upvotes_on_mention": 127,
    "thread_upvotes": 456,
    "commenter_karma": 2341,
    "comment_text": "..."
  }
}
```

### 5.6 Local News Monitor

**Purpose:** Track new openings and closures in real-time  
**Sources:**
- Bangalore Mirror, Times of India (city sections)
- The Hindu (city editions)
- Deccan Herald
- Local city news sites (e.g., BangaloreInsider, Mumbai Live)

**Method:** RSS feeds + Google News API for city-specific restaurant/cafe news  
**Frequency:** Every 6 hours  
**Signals to extract:**
- "New opening" articles — place name, location, category
- "Closed permanently" or "shutdown" articles — flag existing POIs for removal review
- Awards/recognition (Michelin mention, local awards = quality signal)
- Renovation/change of ownership (may warrant re-evaluation)

**Output schema:**
```json
{
  "source": "local_news",
  "publication": "bangaloremirror",
  "article_url": "https://...",
  "article_date": "2026-03-28",
  "place_name": "The Permit Room",
  "city": "bangalore",
  "signal_type": "closure",
  "evidence": {
    "headline": "Iconic Permit Room on Residency Road shuts down",
    "excerpt": "...",
    "existing_poi_id": "poi_xyz_123"
  }
}
```

---

## 6. LLM Curation Filter

### 6.1 The Paper Maps Rubric

Every candidate place is scored against 8 dimensions. Scores are 0–10 per dimension. Weights are calibrated from feedback data.

| Dimension | Weight | Description |
|-----------|--------|-------------|
| **Hidden Gem Quality** | 25% | How undiscovered/under-the-radar is this place? Not on every list? |
| **Authenticity** | 20% | Does this have soul? Local ownership, original concept, real story? |
| **Character** | 15% | Is this place interesting, memorable, distinctive? |
| **Local Favourite Signal** | 15% | Do actual locals (not tourists) go here? |
| **Uniqueness** | 10% | Does this offer something that can't be replicated elsewhere? |
| **Longevity Confidence** | 10% | Will this still be good in 12 months? Not trendy, actually good? |
| **Non-Touristy** | 5% | Not already on tourist maps, not in every guidebook? |

**Composite Score = Σ(dimension_score × weight)**

**Thresholds:**
- Score < 5.0: Auto-reject (logged for learning, not surfaced to curators)
- Score 5.0–6.5: Low confidence — surfaced in "maybe" queue for periodic batch review
- Score 6.5–8.0: Medium confidence — surfaced in main proposal queue
- Score > 8.0: High confidence — flagged as priority, may get expedited review

### 6.2 The Rejection List

Before LLM scoring, a fast pre-filter eliminates obvious non-starters:

**Auto-reject if:**
- Name matches known chain list (Starbucks, Café Coffee Day, McDonald's, Barbeque Nation, etc.)
- Place is a mall, hotel lobby, airport terminal
- Already on Paper Maps for this city
- Closed/permanently shut (from news monitor signal)
- Google Maps user count > 50,000 reviews (too mainstream)
- Listed as "tourist attraction" on Google Maps (and has no hidden gem signal)

### 6.3 LLM Prompt Design

The curation filter uses a structured prompt with the Paper Maps editorial voice baked in:

```
You are a senior editor at Paper Maps — "The anti-Google-Maps."

Paper Maps publishes beautifully curated maps of Indian cities that reveal what locals love: 
the chai stall that's been there 60 years, the hole-in-the-wall idli shop, the bookshop 
with a cat, the sunset spot only neighbourhood kids know.

We REJECT: chains, tourist traps, generic places, Instagram-famous-but-souless spots,
anything that's already on every other list.

We ACCEPT: places with soul, local favourites, off-the-beaten-path, authentic, 
character-rich, independently owned, places that tell a story about the city.

---

Evaluate this candidate place for inclusion in the Paper Maps [CITY] guide:

Place: [NAME]
Location: [AREA, CITY]
Sources: [SOURCE LIST]
Evidence: [AGGREGATED EVIDENCE]

Score this place on:
1. Hidden Gem Quality (0-10): How undiscovered is this?
2. Authenticity (0-10): Does it have real soul?
3. Character (0-10): Is it interesting, memorable?
4. Local Favourite Signal (0-10): Do locals (not tourists) love this?
5. Uniqueness (0-10): Does it offer something unreplicable?
6. Longevity Confidence (0-10): Will it still be good in 12 months?
7. Non-Touristy (0-10): Not already on every list?

Then:
- Provide a 2-sentence "why this belongs on Paper Maps" write-up (if score > 6.5)
- Flag any concerns or conditions
- Recommend: ADD / MAYBE / REJECT

Output as JSON.
```

### 6.4 Removal / Downgrade Scoring

When a signal suggests an existing POI should be re-evaluated:

```
You are evaluating whether an existing Paper Maps POI should be REMOVED or FLAGGED for review.

Current POI: [NAME, DESCRIPTION, CITY]
Reason for review: [SIGNAL TYPE AND EVIDENCE]

Evaluate:
1. Closure confidence (0-10): How confident are we it's closed?
2. Quality decline (0-10): Has it lost what made it special?
3. Overfamousness (0-10): Has it become too mainstream/touristy?

Recommend: REMOVE / FLAG_FOR_REVIEW / KEEP
```

### 6.5 Corroboration Bonus

If a candidate is mentioned by multiple independent sources, a corroboration multiplier applies:

- 2 independent sources: score × 1.1
- 3 independent sources: score × 1.2
- 4+ independent sources: score × 1.3

---

## 7. Proposal Queue

### 7.1 Database Schema

```prisma
model AutoResearchSignal {
  id            String   @id @default(cuid())
  source        String   // instagram_geotag | travel_blog | zomato | google | reddit | news
  rawData       Json     // full raw signal payload
  placeName     String
  placeLocation Json?    // { lat, lng, area }
  citySlug      String
  signalType    String   // new_place | trending | closure | rising | local_rec
  scrapedAt     DateTime
  processedAt   DateTime?
  status        String   @default("pending") // pending | aggregated | filtered | rejected
  createdAt     DateTime @default(now())
}

model AutoResearchCandidate {
  id                  String   @id @default(cuid())
  signals             AutoResearchSignal[]
  placeName           String
  placeLocation       Json     // { lat, lng, area }
  citySlug            String
  resolvedGoogleId    String?  // Google Places ID after geocoding
  corroborationCount  Int      @default(1)
  sources             String[] // which sources contributed
  aggregatedEvidence  Json     // combined evidence from all signals
  status              String   @default("pending") // pending | scored | proposed | rejected
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}

model AutoResearchProposal {
  id                 String    @id @default(cuid())
  candidateId        String?
  candidate          AutoResearchCandidate? @relation(fields: [candidateId], references: [id])
  proposalType       String    // add_poi | remove_poi | update_poi | new_city | flag_review
  citySlug           String
  existingPoiId      String?   // for remove/update proposals
  
  // LLM scoring output
  llmScore           Float
  llmDimensions      Json      // { hiddenGem: 8.2, authenticity: 7.5, ... }
  llmReasoning       String    // 2-sentence "why it belongs"
  llmConcerns        String?   // any flags raised
  llmModel           String    // which model was used
  llmPromptVersion   String    // for reproducibility
  
  // Proposal content
  suggestedName      String?
  suggestedCategory  String?
  suggestedDesc      String?
  evidenceSummary    String    // human-readable summary for curator
  sourceUrls         String[]  // links to source articles/posts
  
  // Review state
  status             String    @default("pending") // pending | approved | rejected | deferred
  reviewedBy         String?   // curator email/id
  reviewedAt         DateTime?
  reviewNote         String?   // curator's note on decision
  
  // Outcome
  resultingPoiId     String?   // if approved add, the new POI id
  
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
}

model AutoResearchAuditTrail {
  id           String   @id @default(cuid())
  poiId        String   // the POI this is about
  eventType    String   // proposed | approved | rejected | published | removed | flagged
  proposalId   String?
  actorType    String   // system | curator
  actorId      String?  // curator email if human
  metadata     Json     // full event context
  createdAt    DateTime @default(now())
}

model AutoResearchFeedbackSignal {
  id          String   @id @default(cuid())
  poiId       String
  citySlug    String
  eventType   String   // save | share | click | map_view | direction_click
  sessionId   String?  // anonymous session for aggregation
  metadata    Json?
  createdAt   DateTime @default(now())
}

model CityReadinessScore {
  id               String   @id @default(cuid())
  citySlug         String   @unique
  cityName         String
  totalCandidates  Int      @default(0)
  qualityCandidates Int     @default(0) // score > 7.0
  sourceDiversity  Int      @default(0) // how many sources have coverage
  geographicSpread Float    @default(0) // std dev of candidate locations
  readinessScore   Float    @default(0) // composite
  isReady          Boolean  @default(false)
  lastCalculated   DateTime @default(now())
}
```

### 7.2 Admin UI — Proposal Queue View

The curator-facing interface is a **triage board** optimized for fast, informed decisions.

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  AutoResearch Queue — Bangalore (12 pending)            │
│  [All] [High Confidence] [Add] [Remove] [New City]     │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│ 🟢 HIGH (8.4)  │  Matteo Coffea — Church Street        │
│ ADD POI        │  Category: Café                        │
│                │  "A micro-roastery tucked in a lane    │
│                │   that Bangalore's coffee scene        │
│                │   considers sacred. Three sources,      │
│                │   none touristy."                      │
│                │  Sources: LBB · Reddit (127 upvotes)   │
│                │  · Instagram (trending, 3 weeks)       │
│ [✓ APPROVE]   [✗ REJECT]   [→ DEFER]   [👁 DETAILS]  │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│ 🟡 MEDIUM (6.8)│  The Permit Room — Residency Rd       │
│ REMOVE POI    │  Reason: Closure confirmed             │
│                │  "Bangalore Mirror reports permanent   │
│                │   closure as of March 2026."          │
│                │  Sources: BangaloreMirror · Google     │
│                │   (temporarily closed status)         │
│ [✓ REMOVE]    [✗ KEEP]   [→ INVESTIGATE]              │
└─────────────────────────────────────────────────────────┘
```

**Detail view** (on "DETAILS" click):
- Full evidence from each source (with links)
- LLM scoring breakdown (dimension by dimension)
- Google Maps embed to verify location
- Photo pull from sources
- Existing similar POIs on the map (prevent duplicates)
- One-click "Open in Google Maps" for quick verification

**Keyboard shortcuts:**
- `A` = Approve
- `R` = Reject  
- `D` = Defer
- `→` = Next proposal
- `←` = Previous proposal

### 7.3 Proposal State Machine

```
PENDING → SCORED → PROPOSED → [APPROVED | REJECTED | DEFERRED]
                                    |
                              PUBLISHED (POI live on map)
```

Auto-rejection (pre-LLM filter) goes directly: `PENDING → FILTERED_OUT`

---

## 8. Feedback Loop Design

### 8.1 User Engagement Events

Every user interaction with a POI or map is a signal:

```typescript
type FeedbackEvent = 
  | 'poi_click'          // user tapped on a POI marker
  | 'poi_save'           // user bookmarked/saved a POI
  | 'poi_share'          // user shared a POI card
  | 'poi_directions'     // user tapped "get directions"
  | 'poi_deepdive'       // user opened full POI detail page
  | 'map_panned_to'      // user navigated to this area
  | 'collection_save'    // user saved the collection containing this POI
  | 'itinerary_add'      // user added this POI to their itinerary
```

**High-value signals** (strong positive): `poi_save`, `poi_share`, `itinerary_add`  
**Medium signals**: `poi_directions`, `poi_deepdive`  
**Weak signals**: `poi_click`

### 8.2 Engagement Score Per POI

```
EngagementScore = 
  (saves × 5) + (shares × 4) + (itinerary_adds × 4) +
  (direction_clicks × 3) + (deepdives × 2) + (clicks × 1)
  
  normalized by map view count for the city
```

### 8.3 Rubric Calibration

Monthly, a calibration job runs:

1. Take all POIs published in the last 6 months with > 50 engagement events
2. Compare their original AutoResearch scores to their actual engagement scores
3. Identify which rubric dimensions predict real engagement vs which don't
4. Propose rubric weight adjustments (human curator reviews the adjustment before applying)

This creates a data flywheel: the system gets better at predicting what users love.

### 8.4 Negative Signals

- A POI with declining engagement over 90 days → flag for "has this place lost its soul?" review
- A POI with 0 engagement over 60 days (and map has decent traffic) → flag for quality check
- A POI with sudden spike in negative reviews on Zomato/Google → flag for review

---

## 9. Traceability Requirements

Every POI in Paper Maps should have a complete audit trail answering:
- Why was this added?
- Who approved it?
- What evidence existed at the time?
- What was the LLM's reasoning?
- Has anything changed since?
- How are users engaging with it?

### 9.1 POI Provenance Panel (Admin)

In the admin POI detail view, add a "Provenance" section:

```
┌─────────────────────────────────────────────────────────┐
│ PROVENANCE — Brahmin's Coffee Bar                       │
│                                                         │
│ Added: 2025-11-15 by [curator@papermaps.in]            │
│ AutoResearch Score: 8.7                                 │
│ Source: 3 sources (LBB article, Reddit x47 upvotes,    │
│          Instagram trending 2 weeks)                   │
│ LLM Reasoning: "The quintessential Bangalore breakfast  │
│   ritual. A 70-year-old institution that has somehow   │
│   remained a locals-only pilgrimage."                  │
│                                                         │
│ Engagement: 127 saves · 43 shares · 89 directions      │
│ Last reviewed: Never                                    │
│                                                         │
│ [View Full Audit Trail] [Flag for Review]              │
└─────────────────────────────────────────────────────────┘
```

### 9.2 Audit Trail Events

All of these are stored in `AutoResearchAuditTrail`:

| Event | Triggered By | Data Stored |
|-------|-------------|-------------|
| `signal_received` | Source monitor | Raw signal payload |
| `candidate_created` | Signal aggregator | Combined evidence |
| `llm_scored` | Curation filter | Full prompt + response |
| `proposal_created` | Pipeline | Proposal details |
| `proposal_reviewed` | Curator | Decision + note |
| `poi_published` | System | POI ID + approval chain |
| `poi_flagged` | System/Curator | Flag reason |
| `poi_removed` | Curator | Removal reason + evidence |
| `rubric_updated` | Calibration job | Old vs new weights |

### 9.3 Export / Accountability

- Monthly audit reports downloadable as CSV (for founder review)
- "Why is this on the map?" URL shareable: `/admin/poi/:id/provenance`
- All LLM prompts + responses stored (model accountability)

---

## 10. City Expansion Logic

### 10.1 The City Readiness Score

Before adding a new city to Paper Maps, AutoResearch evaluates readiness:

```
CityReadinessScore = (
  quality_candidates × 0.40 +    // number of candidates with score > 7.0
  source_diversity × 0.25 +      // how many different sources have coverage
  geographic_spread × 0.20 +     // candidates spread across city, not just one area
  local_signal_strength × 0.15   // reddit/local blog activity, not just travel blogs
)
```

**Threshold for "city is ready":** CityReadinessScore > 70 AND quality_candidates >= 15

### 10.2 City Candidate Discovery

AutoResearch passively monitors signals for cities NOT yet on Paper Maps. When bloggers, Redditors, or Instagram users discuss a city:

1. Place mentions are collected but put in a "city watch" pool
2. When a city crosses 10 quality candidates, it enters active monitoring
3. When it crosses 15 quality candidates with good geographic spread → `city_ready` proposal

### 10.3 City Ready Proposal

```
┌─────────────────────────────────────────────────────────┐
│ 🏙️ NEW CITY READY — Hampi                              │
│                                                         │
│ Quality candidates: 18                                  │
│ Source diversity: 5 (Instagram, LBB, Reddit, Google,   │
│                      Nat Geo Traveller)                 │
│ Geographic spread: HIGH (ruins area, river area,        │
│                          village area all covered)      │
│ City Readiness Score: 78/100                           │
│                                                         │
│ Top 5 candidates:                                       │
│ • Mango Tree Restaurant (9.1) — riverside, locals love  │
│ • Hampi Bazaar bookshop (8.7) — unique, authentic      │
│ • [3 more...]                                          │
│                                                         │
│ [🏙️ CREATE CITY] [⏳ DEFER 30 DAYS] [✗ NOT NOW]      │
└─────────────────────────────────────────────────────────┘
```

### 10.4 Cities Currently on Watch List

AutoResearch should actively monitor (even before they're on Paper Maps):
- Hampi (heritage, unique, international interest + local depth)
- Coorg (nature, coffee estates, distinct culture)
- Pondicherry (French quarter, beach cafes, unique vibe)
- Goa (but: needs "off-season locals-only" angle to differentiate)
- Ooty / Kodaikanal (hill station gems)
- Mangalore / Udupi (coastal cuisine culture)

---

## 11. Tech Stack Integration

### 11.1 Existing Stack

Paper Maps runs on:
- **Backend:** Fastify + Prisma ORM
- **Frontend:** Next.js 14+ (App Router)
- **Database:** PostgreSQL
- **Maps:** MapLibre GL
- **AI:** Existing AI enrichment pipeline (OpenAI / Claude integration)
- **Jobs:** Existing discovery jobs system

### 11.2 AutoResearch New Components

#### Backend (Fastify)

```
src/
  autoResearch/
    monitors/
      instagramMonitor.ts      # Instagram geotag scraping
      blogMonitor.ts           # Travel blog RSS + scraping
      zomatoMonitor.ts         # Zomato new listings
      googleReviewsMonitor.ts  # Google Places rising
      redditMonitor.ts         # Reddit PRAW integration
      newsMonitor.ts           # Local news RSS
    pipeline/
      signalAggregator.ts      # Dedup + entity resolution
      geocoder.ts              # Place → coordinates
      entityResolver.ts        # "Koshy's" = "Koshy's Restaurant, St Marks Rd"
    curation/
      llmFilter.ts             # Main curation filter
      rubricPrompts.ts         # Versioned prompt templates
      corroborationScorer.ts   # Multi-source bonus
    proposals/
      proposalEngine.ts        # Creates proposals from scored candidates
      cityReadiness.ts         # City expansion logic
    feedback/
      engagementTracker.ts     # User event collection
      rubricCalibrator.ts      # Monthly calibration job
    jobs/
      monitorOrchestrator.ts   # Runs all monitors on schedule
      pipelineJob.ts           # Processes signal queue
      calibrationJob.ts        # Monthly rubric update
    routes/
      proposals.ts             # GET/PATCH /admin/proposals
      signals.ts               # GET /admin/signals
      auditTrail.ts            # GET /admin/audit/:poiId
      cityReadiness.ts         # GET /admin/city-readiness
      feedback.ts              # POST /api/events (public, rate-limited)
```

#### Frontend (Next.js Admin)

```
app/
  admin/
    autoResearch/
      page.tsx                 # Dashboard overview
      proposals/
        page.tsx               # Proposal queue triage board
        [id]/
          page.tsx             # Proposal detail view
      signals/
        page.tsx               # Raw signals browser
      audit/
        [poiId]/
          page.tsx             # POI provenance view
      city-readiness/
        page.tsx               # City watch + readiness scores
      calibration/
        page.tsx               # Rubric weights + calibration history
```

### 11.3 Job Scheduling

Integrate with existing discovery jobs system:

```typescript
// Register AutoResearch jobs
registerJob('autoResearch:instagram', { cron: '0 */6 * * *' })
registerJob('autoResearch:blogs', { cron: '0 */12 * * *' })
registerJob('autoResearch:zomato', { cron: '0 8 * * *' })
registerJob('autoResearch:google', { cron: '0 10 */2 * *' })
registerJob('autoResearch:reddit', { cron: '0 */6 * * *' })
registerJob('autoResearch:news', { cron: '0 */6 * * *' })
registerJob('autoResearch:pipeline', { cron: '*/30 * * * *' })  // Every 30min
registerJob('autoResearch:cityReadiness', { cron: '0 9 * * 1' }) // Every Monday
registerJob('autoResearch:calibration', { cron: '0 9 1 * *' })  // 1st of month
```

### 11.4 Environment Variables

```
INSTAGRAM_ACCESS_TOKEN=
GOOGLE_PLACES_API_KEY=
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
ZOMATO_API_KEY=
OPENAI_API_KEY=        # (already exists)
AUTORESCARCH_LLM_MODEL=gpt-4o
AUTORESCARCH_MIN_SCORE=6.5
AUTORESCARCH_PROMPT_VERSION=v1
```

### 11.5 API Endpoints

```
# Admin — Proposals
GET    /admin/auto-research/proposals            # List proposals (with filters)
GET    /admin/auto-research/proposals/:id        # Proposal detail
PATCH  /admin/auto-research/proposals/:id        # Approve/reject/defer

# Admin — Signals
GET    /admin/auto-research/signals              # Browse raw signals
GET    /admin/auto-research/signals/stats        # Signal volume stats

# Admin — Audit
GET    /admin/auto-research/audit/:poiId         # POI audit trail
GET    /admin/auto-research/audit/export         # CSV export

# Admin — City Readiness
GET    /admin/auto-research/city-readiness       # All watched cities
POST   /admin/auto-research/city-readiness/run   # Trigger recalculation

# Admin — Calibration
GET    /admin/auto-research/calibration          # Current weights + history
POST   /admin/auto-research/calibration/run      # Trigger calibration
PATCH  /admin/auto-research/calibration          # Apply proposed weights

# Public (rate-limited)
POST   /api/events                               # User engagement events
```

---

## 12. GitHub Issues List

The following issues are created to track implementation. All tagged with `autoResearch`.

| # | Title | Labels | Priority |
|---|-------|--------|----------|
| AR-01 | [ARCH] AutoResearch database schema — signals, candidates, proposals, audit trail | autoResearch, backend, pipeline | High |
| AR-02 | [ARCH] AutoResearch pipeline engine — signal queue, orchestration, scheduling | autoResearch, backend, pipeline | High |
| AR-03 | [SCRAPER] Instagram geotag monitor | autoResearch, backend, scraper | Medium |
| AR-04 | [SCRAPER] Travel blog monitor (LBB, Nat Geo, Time Out India, Curly Tales) | autoResearch, backend, scraper | High |
| AR-05 | [SCRAPER] Zomato/Swiggy new listings monitor | autoResearch, backend, scraper | Medium |
| AR-06 | [SCRAPER] Google Places rising places monitor | autoResearch, backend, scraper | Medium |
| AR-07 | [SCRAPER] Reddit local recommendations monitor | autoResearch, backend, scraper | Medium |
| AR-08 | [SCRAPER] Local news monitor for openings/closures | autoResearch, backend, scraper | Medium |
| AR-09 | [AI] LLM curation filter — Paper Maps rubric scoring | autoResearch, backend, ai-pipeline | High |
| AR-10 | [AI] Corroboration scoring + entity resolution | autoResearch, backend, ai-pipeline | High |
| AR-11 | [FRONTEND] Proposal queue triage UI | autoResearch, frontend, admin | High |
| AR-12 | [FRONTEND] Proposal detail view with evidence | autoResearch, frontend, admin | High |
| AR-13 | [BACKEND] Proposal review API (approve/reject/defer) | autoResearch, backend | High |
| AR-14 | [FRONTEND] POI provenance + audit trail view | autoResearch, frontend, admin | Medium |
| AR-15 | [BACKEND] User engagement event tracking API | autoResearch, backend, pipeline | High |
| AR-16 | [AI] Feedback loop — monthly rubric calibration job | autoResearch, backend, ai-pipeline | Low |
| AR-17 | [ARCH] City readiness engine + city watch list | autoResearch, backend, pipeline | Medium |
| AR-18 | [FRONTEND] City readiness dashboard + new city proposal UI | autoResearch, frontend, admin | Medium |
| AR-19 | [BACKEND] AutoResearch admin dashboard API (stats, metrics) | autoResearch, backend | Medium |
| AR-20 | [FRONTEND] AutoResearch admin dashboard overview page | autoResearch, frontend, admin |Medium |

---

## 13. Success Metrics

### 13.1 System Health
- Signal volume per source per day (target: > 50 signals/day across all sources)
- Pipeline latency (target: signal → proposal in < 2 hours)
- Proposal queue throughput (curator reviews per week)

### 13.2 Quality Metrics
- Curator approval rate (target: > 40% of surfaced proposals approved)
- If < 20%: LLM filter is too loose, needs tightening
- If > 60%: LLM filter may be too conservative, missing gems

### 13.3 Map Freshness
- % of POIs added/reviewed in last 6 months (target: > 30%)
- Closed POI detection time (target: < 14 days from closure to removal)
- New quality place discovery time (target: < 30 days from opening to proposal)

### 13.4 User Value
- POI engagement rate (saves + shares / map views)
- Return user rate (users who visit multiple times — indicates trust in freshness)

---

## 14. Privacy & Ethics

- **No PII collection:** User engagement events are anonymized (session ID only, no user account)
- **Ethical scraping:** Respect robots.txt, rate limits, platform ToS
- **Data retention:** Raw signals stored 90 days, then deleted. Proposals + audit trail retained permanently.
- **Transparency:** Users can email to ask "why is this place on Paper Maps?" — provenance is accessible
- **Attribution:** When a blog article discovers a place, credit the source in the proposal (and optionally in the POI description)

---

## Appendix A: Known Chain List (Seed)

For auto-rejection pre-filter:

```
Starbucks, Café Coffee Day (CCD), Barista, McDonald's, Burger King, KFC, 
Pizza Hut, Domino's, Subway, Barbeque Nation, Mainland China, Faasos/Rebel Foods,
Haldiram's (chain outlets), MTR (chain, not original), Social (Impresario chain),
Hard Rock Cafe, TGI Fridays, Chili's, PVR food courts, INOX food courts,
Zara, H&M, Westside, Shoppers Stop
```

Note: Some chains have iconic original locations (MTR on Lalbagh Road, original Koshy's) that are NOT auto-rejected — the entity resolver handles these special cases.

---

## Appendix B: Prompt Version Control

All LLM prompts are versioned. When a prompt is updated:
1. New version stored in `rubricPrompts.ts` (e.g., `CURATION_PROMPT_V2`)
2. All new proposals tagged with prompt version
3. Old proposals retain their original version tag
4. Calibration job can compare performance across prompt versions

This enables A/B testing of curation prompts and full reproducibility of past decisions.

---

*End of AutoResearch PRD v1.0*
