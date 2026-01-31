# Boko - Product Requirements Document

## Executive Summary

**Product Name:** Boko
**Tagline:** Powerful B2B Lead Generation SaaS
**Version:** 1.0 (MVP)
**Last Updated:** January 2026

Boko is a B2B lead generation SaaS platform that enables businesses to discover, qualify, and manage leads through automated web scraping, technical analysis (Lighthouse), and sales intelligence. The platform operates on a credit-based system with coupon distribution for early adopters.

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [Target Users](#2-target-users)
3. [Core Features](#3-core-features)
4. [Authentication System](#4-authentication-system)
5. [Credit System](#5-credit-system)
6. [Coupon Management](#6-coupon-management)
7. [Admin Panel](#7-admin-panel)
8. [Audit Logging](#8-audit-logging)
9. [Multi-Tenancy & Data Isolation](#9-multi-tenancy--data-isolation)
10. [Landing Page](#10-landing-page)
11. [Legal & Compliance](#11-legal--compliance)
12. [Technical Architecture](#12-technical-architecture)
13. [API Endpoints](#13-api-endpoints)
14. [Database Schema Changes](#14-database-schema-changes)
15. [Security Requirements](#15-security-requirements)
16. [Future Roadmap](#16-future-roadmap)
17. [Complete Pages & Routes](#17-complete-pages--routes)
18. [Simplified Leads System](#18-simplified-leads-system)
19. [Map-Based Region Selection](#19-map-based-region-selection)
20. [UI Improvement Requirements](#20-ui-improvement-requirements)
21. [Additional Feature Suggestions](#21-additional-feature-suggestions)

---

## 1. Product Vision

### Problem Statement
Finding quality B2B leads is expensive and time-consuming. Existing tools are either:
- Too expensive for small businesses and startups
- Too complex with features users don't need
- Lacking website quality analysis for sales qualification

### Solution
Boko provides an affordable, focused lead generation tool that:
- Automates lead discovery through Google Maps and web scraping
- Qualifies leads based on website quality (Lighthouse scores)
- Enriches leads with sales intelligence
- Manages leads through a simple pipeline

### Success Metrics
- User activation rate (first scrape within 24h of signup)
- Credit utilization rate
- User retention (monthly active users)
- Lead quality score (% of qualified leads)

---

## 2. Target Users

### Primary Persona: Agency Owner / Sales Rep
- **Role:** Digital agency owner, freelance web developer, B2B sales rep
- **Goal:** Find businesses that need websites or web services
- **Pain Points:**
  - Spending hours manually searching for leads
  - No way to assess if a business needs web services
  - Existing tools are too expensive

### Secondary Persona: Small Business Owner
- **Role:** Startup founder, local business owner
- **Goal:** Find potential clients or partners
- **Pain Points:**
  - Limited budget for lead generation tools
  - Need simple, focused solution

---

## 3. Core Features

### 3.1 Lead Discovery (Google Places API)

We use the **Google Places API (New)** - specifically the **Text Search API** with rectangular bounds - to discover businesses.

#### How It Works
1. User draws a rectangle on the map
2. System divides rectangle into grid cells (2km x 2km each)
3. For each cell, call Google Places Text Search API with `locationRestriction.rectangle`
4. Filter results based on user criteria (has phone, has website, etc.)
5. Return only matching leads, charge 1 credit per valid lead

#### API Used
```
POST https://places.googleapis.com/v1/places:searchText

Body:
{
  "textQuery": "restaurants",
  "locationRestriction": {
    "rectangle": {
      "low": { "latitude": 12.9, "longitude": 77.5 },
      "high": { "latitude": 12.95, "longitude": 77.55 }
    }
  }
}
```

#### Data Retrieved from Google Places API
| Field | API Field | Use |
|-------|-----------|-----|
| Business Name | `displayName` | Identification |
| Address | `formattedAddress` | Location |
| Phone | `nationalPhoneNumber` | Contact |
| Website | `websiteUri` | For Lighthouse analysis |
| Rating | `rating` | Quality indicator |
| Review Count | `userRatingCount` | Popularity |
| Business Type | `types` | Categorization |
| Price Level | `priceLevel` | Market segment |
| Location | `location` | Map display |
| Google Maps URL | `googleMapsUri` | Quick access |

**Credit Cost:** 1 credit per valid lead (no base cost)

### 3.2 Lead Qualification & Utilities
| Feature | Description | Credit Cost |
|---------|-------------|-------------|
| Lighthouse Analysis | Website performance/SEO scoring | 1 credit per analysis |
| Technical Analysis | Tech stack detection | 1 credit per analysis |
| Sales Intelligence | AI-powered business research (Perplexity) | 1 credit per lookup |

### 3.2 Lead Qualification & Utilities
| Feature | Description | Credit Cost |
|---------|-------------|-------------|
| Lighthouse Analysis | Website performance/SEO scoring | 1 credit per analysis |
| Technical Analysis | Tech stack detection | 1 credit per analysis |
| Sales Intelligence | AI-powered business research (Perplexity) | 1 credit per lookup |

### 3.3 Lead Generation Credits
| Action | Credit Cost |
|--------|-------------|
| Per valid lead (matching filters) | 1 credit |
| Leads not matching filters | FREE |
| Duplicate leads | FREE |

**Example:** User wants 10 leads with phone numbers. System finds 50 businesses, 10 have phones. Cost: **10 credits**

### 3.4 Lead Management
- Pipeline stages: **NEW -> CONTACTED -> INTERESTED -> CLOSED**
- Threaded activity timeline (notes, calls, emails in one view)
- Tags for organization
- Export to CSV

### 3.5 Failed Operation Handling
- **Automatic refund:** If a scrape or analysis fails, credits are automatically refunded
- **Partial refunds:** If a scrape partially completes, only charge for successful leads

---

## 4. Authentication System

### 4.1 Provider: Clerk
Use [Clerk](https://clerk.com) for authentication to get:
- Email/password authentication
- Email verification (mandatory)
- Password reset flow
- Two-factor authentication (2FA) - optional but recommended
- OAuth providers (Google login) - future consideration

### 4.2 User Registration Flow
```
1. User visits /signup
2. Enter email + password
3. Receive verification email
4. Click verification link
5. Complete profile (name, company - optional)
6. Redirect to dashboard with 0 credits
7. Show "Enter coupon code" prompt
```

### 4.3 User Login Flow
```
1. User visits /login
2. Enter email + password
3. If 2FA enabled -> Enter OTP
4. Redirect to dashboard
```

### 4.4 Password Reset Flow
```
1. User clicks "Forgot password"
2. Enter email
3. Receive reset link
4. Set new password
5. Redirect to login
```

### 4.5 Session Management
- JWT tokens via Clerk
- Session expiry: 7 days
- Refresh token rotation
- Logout invalidates all sessions (optional setting)

---

## 5. Credit System

### 5.1 Credit Model
```typescript
interface UserCredits {
  userId: string;
  balance: number;           // Current credit balance
  totalEarned: number;       // Lifetime credits earned (coupons)
  totalSpent: number;        // Lifetime credits spent
  lastUpdated: Date;
}
```

### 5.2 Credit Transactions
```typescript
interface CreditTransaction {
  id: string;
  userId: string;
  amount: number;            // Positive = credit, Negative = debit
  type: 'COUPON_REDEEM' | 'SCRAPE_JOB' | 'LEAD_GENERATED' | 'UTILITY_USE' | 'REFUND';
  description: string;       // Human-readable description
  referenceId?: string;      // Job ID, coupon code, etc.
  balanceAfter: number;      // Balance after transaction
  createdAt: Date;
}
```

### 5.3 Credit Deduction Logic
```typescript
// Before starting any operation
async function checkAndDeductCredits(userId: string, amount: number, type: string): Promise<boolean> {
  const user = await getUserCredits(userId);

  if (user.balance < amount) {
    throw new InsufficientCreditsError(`Need ${amount} credits, have ${user.balance}`);
  }

  // Deduct credits atomically
  await deductCredits(userId, amount, type);
  return true;
}

// On operation failure
async function refundCredits(userId: string, amount: number, reason: string): Promise<void> {
  await addCredits(userId, amount, 'REFUND', reason);
}
```

### 5.4 Credit Costs Summary
| Operation | Cost |
|-----------|------|
| Per valid lead from scrape | 1 credit |
| Lighthouse analysis | 1 credit |
| Technical analysis | 1 credit |
| Sales intelligence (Perplexity) | 1 credit |

**Scraping is free** - you only pay for valid leads that match your filters.

### 5.5 Low Balance Handling
- Show credit balance prominently in dashboard header
- Warning banner when balance < 10 credits
- Block operations when balance = 0
- Show "Get More Credits" CTA -> WhatsApp link

---

## 6. Coupon Management

### 6.1 Coupon Model
```typescript
interface Coupon {
  id: string;
  code: string;              // Unique, uppercase, 8-12 chars (e.g., "BETA100", "LAUNCH50")
  credits: number;           // Credits to award (admin decides amount)
  maxRedemptions: number;    // How many times can be used (1 = single-use)
  currentRedemptions: number;
  expiresAt?: Date;          // Optional expiry
  isActive: boolean;
  createdBy: string;         // Admin user ID
  createdAt: Date;
  note?: string;             // Internal note (e.g., "For Twitter giveaway")
}
```

### 6.2 Coupon Redemption Model
```typescript
interface CouponRedemption {
  id: string;
  couponId: string;
  userId: string;
  redeemedAt: Date;
  creditsAwarded: number;
}
```

### 6.3 Coupon Generation (Admin)
```
Admin Panel -> Coupons -> Generate New
- Code: Auto-generate or custom
- Credits: [input field] (any amount)
- Max Redemptions: 1 (single-use) or N (multi-use)
- Expiry: Optional date
- Note: Internal note

-> Generate -> Shows coupon code
-> Option to copy or email directly
```

### 6.4 Coupon Redemption (User)
```
Dashboard -> "Have a coupon?" -> Enter code
- Validate code exists and is active
- Check if user already redeemed (prevent double-redemption)
- Check max redemptions not exceeded
- Check not expired
- Award credits
- Record redemption
- Show success message with credits awarded
```

### 6.5 Bulk Coupon Generation
Admin can generate multiple single-use coupons at once:
```
Generate Bulk -> Count: 10, Credits: 100 each
-> Creates: LEEDO-A1B2, LEEDO-C3D4, LEEDO-E5F6, ...
-> Export as CSV for distribution
```

---

## 7. Admin Panel

### 7.1 Admin Route Protection

**CRITICAL:** Admin routes must be completely separate and obscure.

```
Public routes:     /login, /signup, /dashboard, /leads, etc.
Admin routes:      /nucleus-admin-{random-hash}/...

Example:           /nucleus-admin-x7k9m2/dashboard
```

The admin URL prefix should be:
- Stored in environment variable: `ADMIN_URL_PREFIX=nucleus-admin-x7k9m2`
- Not guessable (no `/admin`, `/panel`, `/manage`)
- Changed periodically for security

### 7.2 Admin Authentication
- Separate admin login page at `/{ADMIN_URL_PREFIX}/login`
- Only users with `role: 'ADMIN'` can access
- Additional password or PIN for admin access (optional)
- IP whitelist for admin routes (optional, production)

### 7.3 Admin Dashboard Features

#### 7.3.1 Overview
- Total users (with growth chart)
- Total credits distributed
- Total credits consumed
- Active users (last 7 days)
- Revenue potential (credits x price per credit)

#### 7.3.2 User Management
```
/nucleus-admin-xxx/users

- List all users with:
  - Email, name, signup date
  - Credit balance
  - Total scrapes run
  - Last active
  - Status (active/suspended)

- Actions:
  - View user details
  - Adjust credits manually
  - Suspend/unsuspend user
  - View user's activity log
```

#### 7.3.3 Coupon Management
```
/nucleus-admin-xxx/coupons

- List all coupons with:
  - Code, credits, redemptions, status

- Actions:
  - Generate single coupon
  - Generate bulk coupons
  - Deactivate coupon
  - View redemption history
```

#### 7.3.4 Audit Logs
```
/nucleus-admin-xxx/audit-logs

- Filter by:
  - User
  - Action type
  - Date range
  - External API

- View:
  - Timestamp
  - User
  - Action
  - Details
  - IP address
```

#### 7.3.5 System Health
```
/nucleus-admin-xxx/system

- Database status
- Redis status
- Queue status (pending jobs)
- External API status (Google, Perplexity)
- Error rates
```

---

## 8. Audit Logging

### 8.1 What to Log
Every external API call and significant action must be logged:

```typescript
interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  userEmail: string;
  action: AuditAction;
  resource: string;           // 'lead', 'scrape_job', 'coupon', etc.
  resourceId?: string;
  details: Record<string, any>;
  externalApi?: string;       // 'google_maps', 'google_places', 'perplexity', 'lighthouse'
  apiRequestId?: string;      // External API request ID if available
  ipAddress: string;
  userAgent: string;
  duration?: number;          // Request duration in ms
  status: 'SUCCESS' | 'FAILURE';
  errorMessage?: string;
}

type AuditAction =
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'USER_SIGNUP'
  | 'COUPON_REDEEM'
  | 'SCRAPE_JOB_START'
  | 'SCRAPE_JOB_COMPLETE'
  | 'SCRAPE_JOB_FAIL'
  | 'LEAD_CREATE'
  | 'LEAD_UPDATE'
  | 'LEAD_DELETE'
  | 'LIGHTHOUSE_RUN'
  | 'PERPLEXITY_QUERY'
  | 'GOOGLE_MAPS_SCRAPE'
  | 'GOOGLE_PLACES_API'
  | 'CREDIT_DEDUCT'
  | 'CREDIT_REFUND'
  | 'EXPORT_DATA'
  | 'ADMIN_ACTION';
```

### 8.2 External API Logging
Special attention to external API calls for cost tracking:

```typescript
interface ExternalApiLog {
  id: string;
  timestamp: Date;
  userId: string;
  api: 'GOOGLE_MAPS' | 'GOOGLE_PLACES' | 'PERPLEXITY' | 'LIGHTHOUSE';
  endpoint: string;
  requestPayload?: Record<string, any>;  // Sanitized, no secrets
  responseStatus: number;
  responseTime: number;
  creditsCharged: number;
  jobId?: string;
}
```

### 8.3 Log Retention
- Audit logs: 90 days (configurable)
- External API logs: 30 days
- Aggregate statistics: Forever

---

## 9. Multi-Tenancy & Data Isolation

### 9.1 Data Isolation Requirements
**CRITICAL:** Each user's data must be completely isolated.

- User A cannot see User B's leads
- User A cannot see User B's scrape jobs
- User A cannot see User B's activity logs
- User A cannot access User B's API keys

### 9.2 Implementation

#### Database Level
Every user-owned table must have `userId` column with index:

```sql
-- All queries must include userId filter
SELECT * FROM leads WHERE user_id = $1 AND ...
SELECT * FROM scrape_jobs WHERE user_id = $1 AND ...

-- Add Row Level Security (RLS) in Postgres
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY leads_isolation ON leads
  USING (user_id = current_setting('app.current_user_id')::uuid);
```

#### Application Level
```typescript
// Middleware to set user context
app.addHook('preHandler', async (request, reply) => {
  if (request.user) {
    // Set for RLS policies
    await prisma.$executeRaw`SELECT set_config('app.current_user_id', ${request.user.id}, true)`;
  }
});

// All service methods must scope by userId
class LeadService {
  async getLeads(userId: string, filters: LeadFilters) {
    return prisma.lead.findMany({
      where: {
        userId,  // ALWAYS include userId
        ...filters
      }
    });
  }
}
```

### 9.3 Shared Resources
Some resources are shared (read-only for users):
- Scraping regions
- Tags (system-defined)
- Service configurations

---

## 10. Landing Page

### 10.1 Landing Page Structure

```
[Navigation]
Logo | Features | Pricing | Login | Sign Up (CTA)

[Hero Section]
Headline: "Find B2B Leads That Actually Convert"
Subheadline: "Automated lead discovery with website quality scoring.
             Know which businesses need your services."
CTA: "Start Free" -> Signup
Secondary: "See How It Works" -> Demo video/scroll

[Social Proof]
"Trusted by 50+ agencies and freelancers"
Logo strip or testimonial snippets

[Features Section]
1. Discover Leads
   - Google Maps scraping
   - Location + category targeting
   - Bulk discovery

2. Qualify Instantly
   - Lighthouse website scoring
   - Tech stack detection
   - No website = hot lead

3. Enrich & Export
   - AI-powered business intel
   - Contact extraction
   - CSV export

[How It Works]
Step 1: Enter location + business type
Step 2: We find and score businesses
Step 3: Export qualified leads

[Pricing Section]
"Simple Credit-Based Pricing"
- Show credit costs
- "Get 100 free credits with code BETA100"
- "Need more? Contact us"

[FAQ Section]
- What is a credit?
- How many leads per scrape?
- Is my data private?
- How do I get more credits?

[Footer]
Links | Social | Legal | Contact
```

### 10.2 Key Messaging
- **Value prop:** Find leads with poor/no websites (they need your services)
- **Differentiator:** Website quality scoring built-in
- **Trust:** Data privacy, simple pricing, no subscriptions (yet)

---

## 11. Legal & Compliance

### 11.1 Required Pages
1. **Terms of Service** (`/terms`)
2. **Privacy Policy** (`/privacy`)

### 11.2 GDPR Compliance

#### Data Collection Disclosure
Clearly state what data is collected:
- Account data (email, name)
- Usage data (scrapes, leads viewed)
- Payment data (future)

#### User Rights
Implement these user actions:
- **Access:** Export all my data
- **Rectification:** Update my information
- **Erasure:** Delete my account and all data
- **Portability:** Export data in machine-readable format

#### Account Deletion Flow
```
Settings -> Delete Account
- Warning: "This will permanently delete all your data"
- Require password confirmation
- 7-day grace period (optional)
- Hard delete all user data after grace period
```

#### Data Processing
- Leads scraped are processed data, not personal data (business info)
- User activity logs retained for 90 days
- Clear data retention policy in Privacy Policy

### 11.3 Cookie Consent
- Analytics cookies (if used) require consent
- Authentication cookies are essential (no consent needed)
- Show cookie banner for EU users

---

## 12. Technical Architecture

### 12.1 System Overview

```
+------------------------------------------------------------------+
|                         FRONTEND                                  |
|                    Next.js (App Router)                          |
|  +-------------+  +-------------+  +---------------------------+ |
|  |  Landing    |  |  Dashboard  |  |  Admin Panel              | |
|  |  /          |  |  /dashboard |  |  /nucleus-admin-xxx       | |
|  +-------------+  +-------------+  +---------------------------+ |
+------------------------------------------------------------------+
                              |
                              | API Calls
                              v
+------------------------------------------------------------------+
|                         BACKEND                                   |
|                    Fastify + BullMQ                              |
|  +-------------+  +-------------+  +---------------------------+ |
|  |  Auth       |  |  Credits    |  |  Scraping                 | |
|  |  (Clerk)    |  |  System     |  |  Jobs                     | |
|  +-------------+  +-------------+  +---------------------------+ |
|  +-------------+  +-------------+  +---------------------------+ |
|  |  Leads      |  |  Coupons    |  |  Audit                    | |
|  |  CRUD       |  |  Management |  |  Logging                  | |
|  +-------------+  +-------------+  +---------------------------+ |
+------------------------------------------------------------------+
                              |
              +---------------+---------------+
              v               v               v
       +----------+    +----------+    +----------+
       | Postgres |    |  Redis   |    | External |
       |   DB     |    |  Queue   |    |  APIs    |
       +----------+    +----------+    +----------+
```

### 12.2 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, Tailwind CSS, Framer Motion |
| Backend | Fastify, TypeScript, Zod validation |
| Database | PostgreSQL 16 (Prisma ORM) |
| Queue | Redis + BullMQ |
| Auth | Clerk |
| Scraping | Playwright, Puppeteer Stealth |
| Hosting | Vercel (frontend), Railway (backend) |

### 12.3 Module Structure

```
backend/src/
├── modules/
│   ├── auth/           # Clerk integration
│   ├── users/          # User management
│   ├── credits/        # Credit system
│   ├── coupons/        # Coupon management
│   ├── leads/          # Lead CRUD
│   ├── scraping/       # Scrape jobs
│   ├── qualification/  # Lighthouse, tech analysis
│   ├── audit/          # Audit logging
│   └── admin/          # Admin-only endpoints
├── jobs/
│   ├── queue.ts
│   └── workers/
├── middleware/
│   ├── auth.ts         # Clerk verification
│   ├── admin.ts        # Admin check
│   └── credits.ts      # Credit check
└── utils/
```

---

## 13. API Endpoints

### 13.1 Authentication (via Clerk)
```
POST   /api/auth/webhook          # Clerk webhook for user sync
GET    /api/auth/me               # Get current user + credits
```

### 13.2 Credits
```
GET    /api/credits               # Get credit balance
GET    /api/credits/transactions  # Get transaction history
POST   /api/credits/check         # Check if user has enough credits
```

### 13.3 Coupons
```
POST   /api/coupons/redeem        # Redeem a coupon code
  Body: { code: string }
```

### 13.4 Leads
```
GET    /api/leads                 # List user's leads (paginated)
GET    /api/leads/:id             # Get single lead
PUT    /api/leads/:id             # Update lead
DELETE /api/leads/:id             # Delete lead
POST   /api/leads/export          # Export leads as CSV
```

### 13.5 Scraping
```
POST   /api/scraping/jobs         # Start scrape job (checks credits)
GET    /api/scraping/jobs         # List user's jobs
GET    /api/scraping/jobs/:id     # Get job status + results
```

### 13.6 Utilities
```
POST   /api/qualify/lighthouse    # Run Lighthouse (1 credit)
POST   /api/qualify/tech-stack    # Tech analysis (1 credit)
POST   /api/enrich/intelligence   # Perplexity lookup (1 credit)
```

### 13.7 Admin Endpoints
```
# All prefixed with /{ADMIN_URL_PREFIX}/api/admin/

GET    /users                     # List all users
GET    /users/:id                 # Get user details
PUT    /users/:id/credits         # Adjust user credits
PUT    /users/:id/status          # Suspend/activate user

GET    /coupons                   # List all coupons
POST   /coupons                   # Create coupon
POST   /coupons/bulk              # Create bulk coupons
PUT    /coupons/:id               # Update coupon
DELETE /coupons/:id               # Deactivate coupon

GET    /audit-logs                # Query audit logs
GET    /api-logs                  # Query external API logs
GET    /stats                     # Dashboard statistics
```

---

## 14. Database Schema Changes

### 14.1 New Tables

```prisma
// User credits tracking
model UserCredits {
  id           String   @id @default(uuid())
  userId       String   @unique
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  balance      Int      @default(0)
  totalEarned  Int      @default(0)
  totalSpent   Int      @default(0)
  updatedAt    DateTime @updatedAt
}

// Credit transactions
model CreditTransaction {
  id           String   @id @default(uuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  amount       Int                    // Positive or negative
  type         CreditTransactionType
  description  String
  referenceId  String?                // Job ID, coupon ID, etc.
  balanceAfter Int
  createdAt    DateTime @default(now())

  @@index([userId, createdAt])
}

enum CreditTransactionType {
  COUPON_REDEEM
  SCRAPE_JOB
  LEAD_GENERATED
  UTILITY_USE
  REFUND
  ADMIN_ADJUSTMENT
}

// Coupons
model Coupon {
  id                 String   @id @default(uuid())
  code               String   @unique
  credits            Int
  maxRedemptions     Int      @default(1)
  currentRedemptions Int      @default(0)
  expiresAt          DateTime?
  isActive           Boolean  @default(true)
  note               String?
  createdBy          String
  createdAt          DateTime @default(now())

  redemptions        CouponRedemption[]

  @@index([code, isActive])
}

// Coupon redemptions
model CouponRedemption {
  id             String   @id @default(uuid())
  couponId       String
  coupon         Coupon   @relation(fields: [couponId], references: [id])
  userId         String
  user           User     @relation(fields: [userId], references: [id])
  creditsAwarded Int
  redeemedAt     DateTime @default(now())

  @@unique([couponId, userId])  // Prevent double redemption
}

// Audit logs
model AuditLog {
  id          String      @id @default(uuid())
  timestamp   DateTime    @default(now())
  userId      String?
  userEmail   String?
  action      String
  resource    String
  resourceId  String?
  details     Json?
  externalApi String?
  ipAddress   String?
  userAgent   String?
  duration    Int?
  status      AuditStatus
  error       String?

  @@index([userId, timestamp])
  @@index([action, timestamp])
  @@index([externalApi, timestamp])
}

enum AuditStatus {
  SUCCESS
  FAILURE
}

// External API call logs
model ExternalApiLog {
  id              String   @id @default(uuid())
  timestamp       DateTime @default(now())
  userId          String
  api             String
  endpoint        String
  responseStatus  Int
  responseTime    Int
  creditsCharged  Int
  jobId           String?

  @@index([userId, timestamp])
  @@index([api, timestamp])
}
```

### 14.2 Existing Table Changes

```prisma
model User {
  // Add fields
  clerkId       String?  @unique  // Clerk user ID
  role          UserRole @default(USER)
  status        UserStatus @default(ACTIVE)
  lastActiveAt  DateTime?

  // Add relations
  credits           UserCredits?
  creditTransactions CreditTransaction[]
  couponRedemptions  CouponRedemption[]
}

enum UserRole {
  USER
  ADMIN
}

enum UserStatus {
  ACTIVE
  SUSPENDED
}

model Lead {
  id                    String      @id @default(uuid())
  userId                String
  user                  User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Google Places API Data
  googlePlaceId         String?     @unique  // For duplicate detection
  name                  String
  address               String?
  city                  String?
  state                 String?
  country               String?
  postalCode            String?
  latitude              Float?
  longitude             Float?

  // Contact Info
  phone                 String?
  internationalPhone    String?
  email                 String?     // Extracted from website
  website               String?
  googleMapsUrl         String?

  // Business Details
  businessTypes         String[]    // e.g., ["restaurant", "cafe"]
  primaryType           String?
  businessStatus        String?     // OPERATIONAL, CLOSED_TEMPORARILY, CLOSED_PERMANENTLY
  priceLevel            Int?        // 0-4 ($ to $$$$)

  // Ratings & Reviews
  rating                Float?      // 1.0 - 5.0
  reviewCount           Int?        // userRatingCount
  editorialSummary      String?     // AI-generated description

  // Opening Hours (JSON for flexibility)
  openingHours          Json?       // regularOpeningHours

  // Photos
  photoUrl              String?     // First photo URL
  photoReference        String?     // For fetching more photos

  // Lighthouse / Website Analysis
  lighthouseScore       Int?        // 0-100
  lighthousePerformance Int?
  lighthouseSeo         Int?
  lighthouseAccessibility Int?
  lighthouseBestPractices Int?
  websiteStatus         WebsiteStatus?
  techStack             String[]    // Detected technologies

  // Lead Management
  stage                 LeadStage   @default(NEW)
  closedReason          ClosedReason?
  score                 Int?        // Composite lead score (0-100)
  tags                  Tag[]

  // Enrichment
  salesIntelligence     Json?       // Perplexity response
  enrichedAt            DateTime?

  // Source Tracking
  scrapeJobId           String?
  scrapeJob             ScrapeJob?  @relation(fields: [scrapeJobId], references: [id])
  source                LeadSource  @default(GOOGLE_MAPS)

  // Timestamps
  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt
  lastActivityAt        DateTime?

  // Relations
  activities            LeadActivity[]
  reminders             Reminder[]

  @@index([userId])
  @@index([userId, stage])
  @@index([userId, score])
  @@index([googlePlaceId])
}

enum LeadStage {
  NEW
  CONTACTED
  INTERESTED
  CLOSED
}

enum ClosedReason {
  WON
  LOST_NOT_INTERESTED
  LOST_NO_BUDGET
  LOST_COMPETITOR
  LOST_NO_RESPONSE
}

enum WebsiteStatus {
  NO_WEBSITE
  POOR_WEBSITE      // Score < 50
  MODERATE_WEBSITE  // Score 50-69
  GOOD_WEBSITE      // Score >= 70
}

enum LeadSource {
  GOOGLE_MAPS
  GOOGLE_SEARCH
  MANUAL
  IMPORT
}

model LeadActivity {
  id          String       @id @default(uuid())
  leadId      String
  lead        Lead         @relation(fields: [leadId], references: [id], onDelete: Cascade)
  userId      String
  type        ActivityType
  content     String       // Note text or activity description
  metadata    Json?        // duration, outcome, etc.
  createdAt   DateTime     @default(now())

  @@index([leadId, createdAt])
}

enum ActivityType {
  NOTE
  CALL
  EMAIL
  MEETING
  STAGE_CHANGE
  SYSTEM
}

model Reminder {
  id        String         @id @default(uuid())
  userId    String
  leadId    String
  lead      Lead           @relation(fields: [leadId], references: [id], onDelete: Cascade)
  remindAt  DateTime
  note      String?
  status    ReminderStatus @default(PENDING)
  createdAt DateTime       @default(now())

  @@index([userId, status, remindAt])
}

enum ReminderStatus {
  PENDING
  COMPLETED
  DISMISSED
}

model ScrapeJob {
  // Add userId for multi-tenancy
  userId         String
  user           User    @relation(fields: [userId], references: [id])
  creditsCharged Int     @default(0)

  @@index([userId])
}
```

---

## 15. Security Requirements

### 15.1 Authentication Security
- [x] Email verification required
- [x] Password requirements (min 8 chars, complexity via Clerk)
- [x] 2FA support
- [x] Rate limiting on auth endpoints (5 attempts/minute)
- [x] Session expiry (7 days)

### 15.2 API Security
- [x] All endpoints require authentication (except public)
- [x] Admin endpoints require admin role + separate URL
- [x] Rate limiting per user (100 requests/minute)
- [x] Input validation with Zod
- [x] SQL injection prevention (Prisma parameterized queries)
- [x] XSS prevention (React auto-escaping)

### 15.3 Data Security
- [x] Row-level security for multi-tenancy
- [x] Encrypted database connections (SSL)
- [x] Secrets in environment variables
- [x] No sensitive data in logs
- [x] HTTPS only

### 15.4 Admin Security
- [x] Obscure admin URL (not guessable)
- [x] Admin-only role check
- [x] All admin actions logged
- [x] Optional: IP whitelist for admin

---

## 16. Future Roadmap

### Phase 2: Payments
- Stripe integration (global)
- Razorpay integration (India)
- Credit packages (100, 500, 1000 credits)
- Subscription plans (optional)
- Invoicing

### Phase 3: Advanced Features
- API access for programmatic use
- Webhook notifications
- Team accounts
- White-label option
- CRM integrations (HubSpot, Salesforce)

### Phase 4: Scale
- Multiple scraping regions
- Faster scraping with distributed workers
- AI-powered lead scoring
- Automated outreach (email sequences)

---

## 17. Complete Pages & Routes

### 17.1 Public Pages (No Auth)
| Route | Page | Purpose |
|-------|------|---------|
| `/` | Landing Page | Marketing, features, pricing, CTA |
| `/login` | Login | Clerk-powered login |
| `/signup` | Signup | Clerk-powered registration |
| `/terms` | Terms of Service | Legal |
| `/privacy` | Privacy Policy | Legal/GDPR |

### 17.2 User Dashboard Pages (Auth Required)
| Route | Page | Purpose |
|-------|------|---------|
| `/dashboard` | Dashboard Home | Stats, recent activity, credit balance |
| `/leads` | Leads List | All leads with filters, search, bulk actions |
| `/leads/[id]` | Lead Detail | Single lead view with notes, activities |
| `/scraping` | New Scrape | Map-based region selection, start scrape |
| `/scraping/jobs` | Scrape Jobs | List of scrape jobs with status |
| `/scraping/jobs/[id]` | Job Detail | Job progress, results |
| `/regions` | My Regions | Saved regions for quick re-scraping |
| `/settings` | Settings | Profile, notifications, account deletion |
| `/settings/api-keys` | API Keys | Manage API keys (future) |
| `/redeem` | Redeem Coupon | Enter coupon code |

### 17.3 Admin Pages (Obscure URL)
| Route | Page | Purpose |
|-------|------|---------|
| `/{ADMIN_PREFIX}/` | Admin Dashboard | Overview stats |
| `/{ADMIN_PREFIX}/users` | User Management | List, view, suspend users |
| `/{ADMIN_PREFIX}/coupons` | Coupon Management | Generate, list, deactivate |
| `/{ADMIN_PREFIX}/audit` | Audit Logs | All user actions |
| `/{ADMIN_PREFIX}/api-logs` | API Logs | External API call logs |
| `/{ADMIN_PREFIX}/system` | System Health | DB, Redis, queue status |

---

## 18. Simplified Leads System

### 18.1 No Two-Level System
**REMOVE:** The current "Prospects vs Leads" two-level system.

**NEW:** Single "Leads" system where all discovered businesses are leads.

### 18.2 Simplified Pipeline Stages
**OLD (Remove):**
```
NEW -> CONTACTED -> QUALIFIED -> PROPOSAL -> NEGOTIATION -> WON/LOST
```

**NEW (4 stages only):**
```
NEW -> CONTACTED -> INTERESTED -> CLOSED (Won/Lost)
```

| Stage | Description | Color |
|-------|-------------|-------|
| NEW | Just discovered, not contacted | Gray |
| CONTACTED | Reached out, awaiting response | Blue |
| INTERESTED | Responded positively, in conversation | Orange |
| CLOSED | Deal done (won) or rejected (lost) | Green/Red |

### 18.3 Lead Status Substates
For CLOSED stage, add a `closedReason`:
- `WON` - Converted to customer
- `LOST_NOT_INTERESTED` - Not interested
- `LOST_NO_BUDGET` - Budget issues
- `LOST_COMPETITOR` - Went with competitor
- `LOST_NO_RESPONSE` - Never responded

### 18.4 Threaded Notes/Activity System

**Current Problem:** Adding notes is clunky, activities are separate from notes.

**New Design:** Single threaded timeline combining notes and activities.

```typescript
interface LeadActivity {
  id: string;
  leadId: string;
  userId: string;
  type: 'NOTE' | 'CALL' | 'EMAIL' | 'MEETING' | 'STAGE_CHANGE' | 'SYSTEM';
  content: string;           // Note text or activity description
  metadata?: {
    from?: string;           // For stage changes
    to?: string;
    duration?: number;       // For calls (minutes)
    outcome?: string;        // Call/meeting outcome
  };
  createdAt: Date;
}
```

**UI Pattern:**
```
Lead Detail Page
├── Header (Name, Website, Score, Stage Dropdown)
├── Contact Info (Email, Phone, Address)
├── Quick Actions (Call, Email, Add Note)
└── Activity Timeline
    ├── [Today]
    │   ├── Note: "Sent follow-up email about pricing"
    │   └── Stage changed: CONTACTED -> INTERESTED
    ├── [Yesterday]
    │   ├── Call: "Discussed requirements, 15 min"
    │   └── Note: "They need e-commerce site, budget ~2L"
    └── [Jan 20]
        └── System: "Lead created from Google Maps scrape"
```

**Adding Notes - Simplified:**
- Single text input at top of timeline
- Press Enter or click to add
- Optional: Select type (Note/Call/Email/Meeting)
- No modal, no extra clicks

---

## 19. Map-Based Region Selection

### 19.1 Overview
Replace predefined city dropdowns with interactive map drawing.

**Current System (Remove):**
- Dropdown with 4 predefined cities
- Fixed regions stored in database

**New System:**
- Interactive map (Leaflet/Mapbox)
- User draws rectangle to select area
- System divides into grid cells
- Each cell is searched separately
- Progress shown in real-time

### 19.2 User Flow

```
1. User goes to /scraping
2. Map loads centered on their location (or last used location)
3. User clicks "Draw Region" button
4. User draws a rectangle on the map
5. System shows:
   - Area size (e.g., "25km x 30km")
   - Estimated grid cells (e.g., "~75 cells")
   - Estimated credits (e.g., "25 + ~150 leads = ~175 credits")
6. User enters business type (e.g., "restaurants", "gyms")
7. User clicks "Start Scrape"
8. System:
   - Divides rectangle into 2km x 2km cells
   - Queues search for each cell
   - Shows progress map with cells colored:
     - Gray: Pending
     - Blue: In progress
     - Green: Completed
     - Red: Failed
9. Results stream in as each cell completes
```

### 19.3 Technical Implementation

#### Grid Division Algorithm
```typescript
interface Rectangle {
  southwest: { lat: number; lng: number };
  northeast: { lat: number; lng: number };
}

interface GridCell {
  id: string;
  bounds: Rectangle;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  leadsFound: number;
}

function divideIntoGrid(region: Rectangle, cellSizeKm: number = 2): GridCell[] {
  const cells: GridCell[] = [];

  // Calculate number of cells needed
  const latDiff = region.northeast.lat - region.southwest.lat;
  const lngDiff = region.northeast.lng - region.southwest.lng;

  // Approximate: 1 degree lat = 111km, 1 degree lng = 111km * cos(lat)
  const avgLat = (region.northeast.lat + region.southwest.lat) / 2;
  const kmPerDegreeLat = 111;
  const kmPerDegreeLng = 111 * Math.cos(avgLat * Math.PI / 180);

  const latStep = cellSizeKm / kmPerDegreeLat;
  const lngStep = cellSizeKm / kmPerDegreeLng;

  for (let lat = region.southwest.lat; lat < region.northeast.lat; lat += latStep) {
    for (let lng = region.southwest.lng; lng < region.northeast.lng; lng += lngStep) {
      cells.push({
        id: `${lat.toFixed(4)}_${lng.toFixed(4)}`,
        bounds: {
          southwest: { lat, lng },
          northeast: {
            lat: Math.min(lat + latStep, region.northeast.lat),
            lng: Math.min(lng + lngStep, region.northeast.lng)
          }
        },
        status: 'PENDING',
        leadsFound: 0
      });
    }
  }

  return cells;
}
```

#### Google Places API Call (per cell)
```typescript
async function searchCell(cell: GridCell, query: string): Promise<Place[]> {
  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
      'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber,places.rating'
    },
    body: JSON.stringify({
      textQuery: query,
      locationRestriction: {
        rectangle: {
          low: {
            latitude: cell.bounds.southwest.lat,
            longitude: cell.bounds.southwest.lng
          },
          high: {
            latitude: cell.bounds.northeast.lat,
            longitude: cell.bounds.northeast.lng
          }
        }
      },
      maxResultCount: 20
    })
  });

  return response.json();
}
```

### 19.4 Region Size Limits
To prevent abuse and excessive API costs:

| Plan | Max Area | Max Cells | Cell Size |
|------|----------|-----------|-----------|
| Free/Basic | 100 km² | 25 cells | 2km x 2km |
| Future Pro | 500 km² | 125 cells | 2km x 2km |

**Validation:**
```typescript
function validateRegion(region: Rectangle): { valid: boolean; error?: string } {
  const areaKm2 = calculateArea(region);
  const MAX_AREA = 100; // km²

  if (areaKm2 > MAX_AREA) {
    return {
      valid: false,
      error: `Region too large (${areaKm2.toFixed(0)} km²). Maximum is ${MAX_AREA} km².`
    };
  }

  return { valid: true };
}
```

### 19.5 Saved Regions (User Level)
Users can save regions for quick re-use:

```typescript
interface SavedRegion {
  id: string;
  userId: string;
  name: string;                    // e.g., "Downtown Bangalore"
  bounds: Rectangle;
  lastUsed: Date;
  timesUsed: number;
  createdAt: Date;
}
```

**UI:**
- "Save this region" button after drawing
- "My Regions" dropdown to quickly load saved regions
- Delete/rename saved regions in /regions page

### 19.6 Smart Scraping with Lead Filters

#### Overview
Users define quality filters BEFORE scraping. The system continues scraping until it finds the requested number of leads that match ALL filters.

#### User Flow
```
1. User draws region on map
2. User enters business type ("restaurants")
3. User sets "I want [10] leads"
4. User sets filters:
   ☑ Must have phone number
   ☑ Must have website
   ☐ Must have email
   ☐ Rating above [4.0]
   ☐ Review count above [10]
   ☐ No website (for web dev leads)
5. User clicks "Start Scrape"
6. System scrapes cells until 10 VALID leads found
7. User charged for valid leads only
```

#### Filter Options

| Filter | Description | Default |
|--------|-------------|---------|
| Has Phone | Business has phone number | Off |
| Has Website | Business has website URL | Off |
| Has Email | Email found on website | Off |
| No Website | For finding leads needing websites | Off |
| Min Rating | Minimum star rating (1-5) | None |
| Min Reviews | Minimum review count | None |
| Max Reviews | Maximum reviews (newer businesses) | None |
| Business Status | Only OPERATIONAL businesses | On |
| Price Level | Filter by $ to $$$$ | Any |

**Note:** "Has Website" and "No Website" are mutually exclusive.

#### Filter Model
```typescript
interface ScrapeFilters {
  // Contact filters
  hasPhone?: boolean;
  hasWebsite?: boolean;
  hasEmail?: boolean;       // Requires website scraping
  noWebsite?: boolean;      // For web dev lead gen

  // Rating filters
  minRating?: number;       // 1.0 - 5.0
  maxRating?: number;
  minReviews?: number;
  maxReviews?: number;

  // Business filters
  businessStatus?: 'OPERATIONAL' | 'ANY';
  priceLevel?: number[];    // [1, 2] = $ and $$

  // Target
  targetLeadCount: number;  // Stop when this many valid leads found
  maxCellsToSearch?: number; // Safety limit (default: 100)
}
```

#### Scraping Logic
```typescript
async function smartScrape(
  region: Rectangle,
  query: string,
  filters: ScrapeFilters,
  userId: string
): Promise<ScrapeResult> {
  const cells = divideIntoGrid(region);
  const validLeads: Lead[] = [];
  let cellsSearched = 0;
  let totalFound = 0;
  let totalFiltered = 0;

  for (const cell of cells) {
    // Stop if we have enough valid leads
    if (validLeads.length >= filters.targetLeadCount) {
      break;
    }

    // Safety limit
    if (cellsSearched >= (filters.maxCellsToSearch || 100)) {
      break;
    }

    // Search this cell
    const places = await searchCell(cell, query);
    cellsSearched++;
    totalFound += places.length;

    for (const place of places) {
      // Apply filters
      if (matchesFilters(place, filters)) {
        // Check for duplicates
        if (!isDuplicate(place, userId)) {
          validLeads.push(place);
          totalFiltered++;

          if (validLeads.length >= filters.targetLeadCount) {
            break;
          }
        }
      }
    }

    // Update job progress
    await updateJobProgress(jobId, {
      cellsSearched,
      totalFound,
      validLeads: validLeads.length,
      target: filters.targetLeadCount
    });
  }

  return {
    leads: validLeads,
    stats: {
      cellsSearched,
      totalFound,
      totalFiltered,
      duplicatesSkipped: totalFound - totalFiltered - validLeads.length
    }
  };
}

function matchesFilters(place: Place, filters: ScrapeFilters): boolean {
  // Phone filter
  if (filters.hasPhone && !place.nationalPhoneNumber) {
    return false;
  }

  // Website filters (mutually exclusive)
  if (filters.hasWebsite && !place.websiteUri) {
    return false;
  }
  if (filters.noWebsite && place.websiteUri) {
    return false;
  }

  // Rating filters
  if (filters.minRating && (!place.rating || place.rating < filters.minRating)) {
    return false;
  }
  if (filters.maxRating && place.rating && place.rating > filters.maxRating) {
    return false;
  }

  // Review count filters
  if (filters.minReviews && (!place.userRatingCount || place.userRatingCount < filters.minReviews)) {
    return false;
  }
  if (filters.maxReviews && place.userRatingCount && place.userRatingCount > filters.maxReviews) {
    return false;
  }

  // Business status
  if (filters.businessStatus === 'OPERATIONAL' && place.businessStatus !== 'OPERATIONAL') {
    return false;
  }

  // Price level
  if (filters.priceLevel?.length && !filters.priceLevel.includes(place.priceLevel)) {
    return false;
  }

  return true;
}
```

#### Credit Charging
```
Per valid lead: 1 credit
NO base job cost

Example:
- User wants 10 leads with phone numbers
- System searches 15 cells, finds 47 businesses
- 10 match the "has phone" filter
- Cost: 10 credits (that's it!)

NOT charged for:
- Businesses that don't match filters
- Duplicate businesses
- Failed cell searches
- The scraping itself (only results)
```

**Simple rule:** You only pay for leads you actually get.

#### UI: Filter Panel
```
┌─────────────────────────────────────────────────────────────┐
│  Scrape Settings                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Business Type                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ restaurants                                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  I want [ 10 ▼ ] leads                                     │
│                                                             │
│  ─────────────────────────────────────────────────────     │
│  Lead Quality Filters                                       │
│  ─────────────────────────────────────────────────────     │
│                                                             │
│  Contact Info                                               │
│  ☑ Must have phone number                                  │
│  ☐ Must have website                                       │
│  ☐ Must have email (slower - scrapes websites)             │
│                                                             │
│  For Web Dev Leads                                          │
│  ☐ NO website (businesses needing websites)                │
│                                                             │
│  Ratings                                                    │
│  Rating: [ Any ▼ ] to [ Any ▼ ]                            │
│  Reviews: [ Any ▼ ] to [ Any ▼ ]                           │
│                                                             │
│  Business Status                                            │
│  ◉ Only open businesses                                    │
│  ○ Include temporarily closed                              │
│                                                             │
│  ─────────────────────────────────────────────────────     │
│  Cost: 10 credits                                           │
│  (1 credit per lead × 10 leads)                            │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              🔍 Start Scraping                       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

#### Progress Display During Scrape
```
┌─────────────────────────────────────────────────────────────┐
│  Scraping in Progress...                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Progress: ████████░░░░░░░░ 7/10 leads found               │
│                                                             │
│  Stats:                                                     │
│  • Cells searched: 12 of 45                                │
│  • Total businesses found: 89                              │
│  • Matching your filters: 7                                │
│  • Duplicates skipped: 3                                   │
│                                                             │
│  Recent matches:                                            │
│  ✓ Cafe Mocha - 4.5★ - Has phone                          │
│  ✓ The Coffee House - 4.2★ - Has phone                    │
│  ✓ Brew & Bite - 4.8★ - Has phone                         │
│                                                             │
│  [Map showing cells: green=done, blue=current, gray=pending]│
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              ⏹ Stop Scraping                         │   │
│  └─────────────────────────────────────────────────────┘   │
│  (You'll be charged for leads found so far)                │
└─────────────────────────────────────────────────────────────┘
```

#### Database Schema Addition
```prisma
model ScrapeJob {
  // ... existing fields ...

  // Filter settings (stored as JSON)
  filters           Json?       // ScrapeFilters object

  // Progress tracking
  targetLeadCount   Int         @default(10)
  validLeadsFound   Int         @default(0)
  totalPlacesFound  Int         @default(0)
  duplicatesSkipped Int         @default(0)
}
```

### 19.7 Google Places API Data Fields

The Google Places API (New) provides extensive data. We should capture these fields for each lead:

#### Essential Fields (Always Capture)
| Field | API Field | Purpose |
|-------|-----------|---------|
| Name | `displayName` | Business name |
| Place ID | `id` | Unique identifier, prevent duplicates |
| Address | `formattedAddress` | Full address |
| Location | `location` | Lat/lng for map display |
| Phone | `nationalPhoneNumber` | Contact |
| Website | `websiteUri` | For Lighthouse analysis |
| Types | `types` | Business categories |
| Rating | `rating` | Average rating (1-5) |
| Review Count | `userRatingCount` | Number of reviews |
| Price Level | `priceLevel` | $ to $$$$ |
| Business Status | `businessStatus` | OPERATIONAL, CLOSED, etc. |

#### Enrichment Fields (Capture if Available)
| Field | API Field | Purpose |
|-------|-----------|---------|
| Opening Hours | `regularOpeningHours` | Operating schedule |
| Photos | `photos` | First photo for preview |
| Editorial Summary | `editorialSummary` | AI description |
| Google Maps Link | `googleMapsUri` | Quick access |

#### Business Intelligence Fields (Future)
| Field | API Field | Purpose |
|-------|-----------|---------|
| Delivery | `delivery` | Service offerings |
| Dine In | `dineIn` | Service offerings |
| Reservable | `reservable` | Business model indicator |
| Price Range | `priceRange` | Detailed pricing |
| Reviews | `reviews` | Sentiment analysis |

#### Field Mask for API Request
```typescript
const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.nationalPhoneNumber',
  'places.internationalPhoneNumber',
  'places.websiteUri',
  'places.googleMapsUri',
  'places.types',
  'places.primaryType',
  'places.rating',
  'places.userRatingCount',
  'places.priceLevel',
  'places.businessStatus',
  'places.regularOpeningHours',
  'places.photos',
  'places.editorialSummary'
].join(',');
```

**Note:** Different fields have different pricing tiers. We use mostly "Pro" tier fields to balance data richness with cost.

**Sources:**
- [Place Data Fields (New)](https://developers.google.com/maps/documentation/places/web-service/data-fields)
- [Text Search (New)](https://developers.google.com/maps/documentation/places/web-service/text-search)

### 19.7 Database Schema for Regions

```prisma
model SavedRegion {
  id           String   @id @default(uuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name         String
  southwestLat Float
  southwestLng Float
  northeastLat Float
  northeastLng Float
  lastUsed     DateTime @default(now())
  timesUsed    Int      @default(0)
  createdAt    DateTime @default(now())

  @@index([userId])
}

model ScrapeJobCell {
  id          String   @id @default(uuid())
  jobId       String
  job         ScrapeJob @relation(fields: [jobId], references: [id], onDelete: Cascade)
  cellIndex   Int
  swLat       Float
  swLng       Float
  neLat       Float
  neLng       Float
  status      CellStatus @default(PENDING)
  leadsFound  Int       @default(0)
  startedAt   DateTime?
  completedAt DateTime?
  error       String?

  @@index([jobId, status])
}

enum CellStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  FAILED
}
```

---

## 20. UI Improvement Requirements

### 20.1 Dashboard Redesign
**Current Issues:**
- Too cluttered
- Not focused on key actions

**New Design Principles:**
- Credit balance prominent (top right)
- "New Scrape" as primary CTA
- Recent scrapes with quick status
- Recent leads preview
- Clean, minimal

**Dashboard Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  LEEDO                        Credits: 450 ▼  [+ Get More]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [+ New Scrape]                                      │   │
│  │  Start discovering leads in any area                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────┐  ┌─────────────────────────────┐  │
│  │ Recent Scrapes      │  │ Lead Pipeline               │  │
│  │                     │  │                             │  │
│  │ ● Koramangala     ✓ │  │ NEW         ████░░  45     │  │
│  │ ● HSR Layout      ⟳ │  │ CONTACTED   ██░░░░  12     │  │
│  │ ● Indiranagar     ✓ │  │ INTERESTED  █░░░░░   5     │  │
│  │                     │  │ CLOSED      █░░░░░   3     │  │
│  └─────────────────────┘  └─────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Recent Leads                            [View All →] │   │
│  │                                                      │   │
│  │ Cafe Mocha         No Website    NEW      2h ago    │   │
│  │ TechStart Inc      Score: 45     NEW      3h ago    │   │
│  │ Fitness Hub        Score: 62     CONTACTED 1d ago   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 20.2 Lead List Improvements
**Current Issues:**
- Too many columns
- Hard to scan
- Bulk actions hidden

**New Design:**
- Card-based or compact list view toggle
- Key info only: Name, Website Status, Stage, Last Activity
- Inline stage change (dropdown)
- Quick actions on hover
- Bulk select with floating action bar

### 20.3 Lead Detail Page Improvements
**Current Issues:**
- Notes/activities hard to add
- Too much scrolling

**New Design:**
```
┌─────────────────────────────────────────────────────────────┐
│ ← Back to Leads                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Cafe Mocha                              [Stage: NEW ▼]     │
│  cafe-mocha.com (Score: 45 - Poor)                         │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ 📞 Call      │  │ 📧 Email     │  │ 📍 Location  │     │
│  │ +91 98xxx    │  │ info@cafe..  │  │ Koramangala  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Activity                                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Add a note...                            [+ Note]   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Today                                                      │
│  ├─ 📝 "Called but no answer, will try tomorrow"          │
│  │     2 hours ago                                         │
│  │                                                         │
│  Yesterday                                                  │
│  ├─ 📞 Called (5 min) - "Interested, wants proposal"      │
│  │     Jan 25, 3:45 PM                                     │
│  │                                                         │
│  ├─ 🔄 Stage changed: NEW → CONTACTED                     │
│  │     Jan 25, 3:40 PM                                     │
│  │                                                         │
│  Jan 24                                                     │
│  └─ ⚙️ Lead created from scrape "Koramangala Cafes"       │
│        Jan 24, 10:00 AM                                    │
└─────────────────────────────────────────────────────────────┘
```

### 20.4 Scraping Page Redesign
**New Flow:**
1. Full-width map
2. Draw rectangle tool
3. Side panel with:
   - Business type input
   - Region stats (area, cells)
   - Credit estimate
   - Start button

**During Scrape:**
- Map shows cell progress (colored squares)
- Side panel shows:
  - Progress bar
  - Leads found count
  - Current cell being scraped
  - Live result preview

### 20.5 Design System Updates
- Consistent spacing (4px grid)
- Limited color palette
- Clear visual hierarchy
- Mobile-first responsive
- Loading states for all actions
- Empty states with helpful CTAs

---

## 21. Additional Feature Suggestions

### 21.1 Lead Scoring System (MVP)
Automatically score leads based on multiple factors:

| Factor | Weight | Score Logic |
|--------|--------|-------------|
| Website Status | 40% | No website = 100, Poor (<50) = 80, Moderate = 40, Good = 10 |
| Has Email | 15% | Found = 100, Not found = 0 |
| Has Phone | 15% | Found = 100, Not found = 0 |
| Business Type Match | 15% | Exact match = 100, Related = 50 |
| Reviews/Rating | 15% | Low reviews = higher score (newer business) |

**Display:** Show composite score (0-100) with color coding:
- 🔥 Hot (80-100): Red badge
- 🟠 Warm (50-79): Orange badge
- 🔵 Cool (0-49): Blue badge

### 21.2 Duplicate Detection (MVP)
Prevent duplicate leads across scrapes:

```typescript
// Check for duplicates before creating lead
async function isDuplicate(lead: NewLead, userId: string): Promise<boolean> {
  const existing = await prisma.lead.findFirst({
    where: {
      userId,
      OR: [
        { phone: lead.phone },
        { email: lead.email },
        { website: normalizeUrl(lead.website) },
        {
          AND: [
            { name: { contains: lead.name, mode: 'insensitive' } },
            { city: lead.city }
          ]
        }
      ]
    }
  });
  return !!existing;
}
```

**UI:** Show "X duplicates skipped" after scrape completes.

### 21.3 Smart Filters & Saved Views (MVP)
Let users save filter combinations:

```typescript
interface SavedFilter {
  id: string;
  userId: string;
  name: string;              // "Hot Leads in Bangalore"
  filters: {
    stages?: string[];
    scoreMin?: number;
    scoreMax?: number;
    hasEmail?: boolean;
    hasPhone?: boolean;
    hasWebsite?: boolean;
    createdAfter?: Date;
    tags?: string[];
  };
  isDefault: boolean;        // Show on dashboard
}
```

**Preset Filters:**
- "Hot Leads" (score > 80)
- "No Website" (website = null)
- "Has Contact" (email OR phone exists)
- "Stale" (no activity > 7 days)

### 21.4 Follow-up Reminders (MVP)
Set reminders for leads:

```typescript
interface Reminder {
  id: string;
  userId: string;
  leadId: string;
  remindAt: Date;
  note: string;
  status: 'PENDING' | 'COMPLETED' | 'DISMISSED';
}
```

**UI:**
- "Remind me" button on lead detail
- Quick options: "Tomorrow", "In 3 days", "Next week", "Custom"
- Dashboard widget: "Due Today" with reminder count
- In-app notification when reminder is due

### 21.5 Keyboard Shortcuts (MVP)
For power users:

| Shortcut | Action |
|----------|--------|
| `n` | New scrape |
| `g l` | Go to leads |
| `g d` | Go to dashboard |
| `/` | Focus search |
| `j/k` | Navigate list (down/up) |
| `Enter` | Open selected lead |
| `e` | Edit lead |
| `Esc` | Close modal/go back |
| `?` | Show shortcuts help |

### 21.6 Quick Actions / Command Palette (Future)
`Cmd+K` to open command palette:
- Search leads by name
- Quick navigation
- Run common actions
- Change lead stage

### 21.7 Email Finder Integration (Future)
Integrate with email finding services:
- Hunter.io
- Apollo.io
- Clearbit

**Credit Cost:** 2 credits per email lookup
**UI:** "Find Email" button on leads without email

### 21.8 Export Enhancements (MVP)

**Export Formats:**
- CSV (current)
- Excel (.xlsx)
- Google Sheets (direct export)

**Export Options:**
- All leads
- Selected leads only
- Current filtered view
- Include/exclude fields

**Export Templates:**
Save field selection for quick re-export

### 21.9 Lead Activity Heatmap (Future)
Show when you're most active with leads:

```
Activity Heatmap (Last 30 Days)
        Mon Tue Wed Thu Fri Sat Sun
Week 1   █   ██  █   ███ █
Week 2   ██  █   ██  █   ██
Week 3   ███ ██  █   ██  ███ █
Week 4   █   ███ ██  █   ██
```

Helps identify patterns and optimize outreach timing.

### 21.10 Bulk Actions (MVP)

**On Lead List:**
- Select multiple leads (checkbox)
- Floating action bar appears:
  - Change stage (all selected)
  - Add tag (all selected)
  - Export selected
  - Delete selected

**Implementation:**
```typescript
// Bulk stage update
async function bulkUpdateStage(leadIds: string[], stage: string, userId: string) {
  return prisma.lead.updateMany({
    where: {
      id: { in: leadIds },
      userId  // Security: only user's leads
    },
    data: { stage }
  });
}
```

### 21.11 Lead Import (Future)
Import leads from CSV:
- Map columns to fields
- Duplicate detection
- Preview before import
- Import history

### 21.12 Scrape Templates (MVP)
Save business type + region combinations:

```typescript
interface ScrapeTemplate {
  id: string;
  userId: string;
  name: string;              // "Restaurants in South Bangalore"
  businessTypes: string[];   // ["restaurant", "cafe"]
  regionId?: string;         // Saved region
  lastUsed: Date;
}
```

**UI:** "Save as template" after configuring scrape, "My Templates" dropdown

### 21.13 Real-time Collaboration Indicators (Future)
For future team features:
- Show who's viewing a lead
- Lock editing when someone else is editing
- Activity feed across team

### 21.14 Lead Decay / Aging Alerts (MVP)
Notify when leads are going stale:

**Rules:**
- NEW lead with no activity > 3 days → Warning
- CONTACTED lead with no response > 7 days → Follow-up reminder
- Any lead with no activity > 14 days → "At risk" flag

**Dashboard Widget:** "Leads Needing Attention" with count

### 21.15 Mobile Responsiveness (MVP)
Ensure all pages work on mobile:
- Responsive lead list (card view on mobile)
- Touch-friendly map drawing
- Swipe actions on leads
- Mobile-optimized forms

### 21.16 Dark/Light Mode Toggle (MVP)
Currently dark-only. Add toggle:
- Respect system preference by default
- Manual override in settings
- Persist preference

### 21.17 Onboarding Flow (MVP)
First-time user experience:

```
Step 1: Welcome
        "Let's find your first leads!"

Step 2: Enter Coupon (if have one)
        [Skip] [Enter Code]

Step 3: Draw Your First Region
        Interactive tutorial highlighting map

Step 4: Enter Business Type
        Suggestions: "restaurants", "gyms", etc.

Step 5: Start Scrape
        "Watch as we find leads for you!"

Step 6: Explore Results
        Highlight key features
```

**Track:** `user.onboardingCompleted: boolean`

### 21.18 Feature Prioritization Matrix

| Feature | Impact | Effort | Priority |
|---------|--------|--------|----------|
| Lead Scoring | High | Low | MVP |
| Duplicate Detection | High | Low | MVP |
| Smart Scrape Filters | High | Medium | MVP |
| Follow-up Reminders | Medium | Medium | MVP |
| Bulk Actions | High | Low | MVP |
| Export (CSV) | Medium | Low | MVP |
| Onboarding Flow | High | Medium | MVP |

#### Future Considerations
- Team accounts
- API access
- CRM integrations
- Chrome extension

---

## Appendix A: Credit Cost Reference

| Operation | Credits | Notes |
|-----------|---------|-------|
| Scraping (base) | 0 | FREE - no base cost |
| Per valid lead | 1 | Only leads matching your filters |
| Filtered out leads | 0 | FREE - not charged |
| Duplicate leads | 0 | FREE - automatically skipped |
| Lighthouse analysis | 1 | Per website |
| Technical analysis | 1 | Per website |
| Sales intelligence | 1 | Per business |
| Failed operation | 0 | Full refund |

**Simple rule:** 1 credit = 1 valid lead. That's it.

---

## Appendix B: Admin URL Configuration

```env
# .env
ADMIN_URL_PREFIX=nucleus-admin-x7k9m2

# Generate a new prefix
node -e "console.log('nucleus-admin-' + require('crypto').randomBytes(4).toString('hex'))"
```

---

## Appendix C: Welcome Email Template

```
Subject: Welcome to Boko - Let's find some leads!

Hi {name},

Welcome to Boko! You're all set to start discovering B2B leads.

Your account:
- Email: {email}
- Current credits: {credits}

Quick start:
1. Go to your dashboard: {dashboardUrl}
2. Click "New Scrape"
3. Enter a location and business type
4. We'll find and score leads for you

Need credits? Enter a coupon code in your dashboard, or contact us on WhatsApp: {whatsappLink}

Questions? Just reply to this email.

Happy prospecting!
The Boko Team
```

---

*Document Version: 1.1*
*Last Updated: January 26, 2026*
*Status: Ready for Development*
