# Summer Studios - Product Requirements Document

## Overview

**Project:** Summer Studios Agency Website
**Type:** Web Development Agency Portfolio & Marketing Site
**Target Launch:** Q1 2026

---

## Business Context

### Company Description
Summer Studios is a web development agency targeting startups, tech companies, small businesses, and e-commerce brands in South India (Bangalore, Hyderabad, Mysore, Chennai, Kochi).

### Brand Positioning
- **Vibe:** Experimental & Edgy
- **Differentiator:** Technical credibility + fast delivery + productized pricing
- **Tagline Concept:** Code-first, design-driven

---

## Target Audience

### Primary Clients
1. **Startups** - Need MVPs, landing pages, web apps
2. **Tech Companies** - Need professional web presence
3. **Small Businesses** - Need affordable, quality websites
4. **E-commerce Brands** - Need online stores and product catalogs

### Geographic Focus
- Bangalore
- Hyderabad
- Mysore
- Chennai
- Kochi

---

## Product Offerings (Productized Pricing)

| Package | Price | Description |
|---------|-------|-------------|
| One-Page Site | ₹50,000 | Single landing page, responsive, basic animations |
| Multi-Page Site | ₹1,00,000 | 5-7 pages, custom design, contact forms |
| Web Apps/Tools | ₹2,00,000 | Database integration, user auth, admin panel |
| Complex Apps | Custom Quote | Mobile apps, large-scale web applications |

---

## Website Requirements

### Pages Required
1. **Home** - Hero, services overview, featured work, testimonials, CTA
2. **Work** - Portfolio gallery with case studies (horizontal scroll)
3. **Labs** - Three.js/WebGL experiments and creative coding playground
4. **Services** - Detailed service offerings
5. **Pricing** - Productized pricing packages (timeline style)
6. **About** - Team, story, values
7. **Contact** - Form, location, social links

### Navigation Pattern
- **Desktop:** Vertical side navigation (experimental)
- **Mobile:** Bottom navigation or hamburger menu
- **Work Page:** Horizontal scroll gallery
- **Labs Page:** Grid of interactive experiment cards with filter tags

---

## Technical Requirements

### Stack Considerations
- **Framework:** Next.js or Astro
- **Styling:** Tailwind CSS
- **Animations:** GSAP (now free, owned by Webflow) + Framer Motion
- **CMS:** Optional headless CMS for case studies

### Performance Goals
- Lighthouse score > 90
- First Contentful Paint < 1.5s
- Core Web Vitals passing

### Browser Support
- Chrome, Firefox, Safari, Edge (latest 2 versions)
- Mobile: iOS Safari, Chrome Android

---

## Design Requirements

### Visual Style
- Dark theme primary (#0A0A0A background)
- Warm accent colors (Orange #FF9500)
- Experimental typography and layouts
- Smooth, intentional animations

### Key Animations
- Page transitions
- Scroll-triggered reveals
- Hover interactions
- Loading states
- Cursor effects (optional)

### Design References
| Aspect | Primary Reference | What to Take |
|--------|-------------------|--------------|
| Navigation | Basement Studio | Vertical side nav, experimental feel |
| Typography | Linear, Stripe | Clean hierarchy, professional scale |
| Animations | Basement Studio, Cuberto | GSAP scroll triggers, horizontal scroll |
| Dark Theme | Linear, Vercel | Surface depth, accent usage |
| Portfolio | KOTA, Pentagram | Case study flow, project presentation |
| Pricing | Stripe, Linear | Clear tiers, comparison layout |

*See Design-Blueprint.md for detailed reference breakdown*

---

## Success Metrics

### KPIs
- Contact form submissions
- Time on site > 2 minutes
- Portfolio case study views
- Mobile engagement rate

### Goals (First 6 months)
- 50+ qualified leads
- 10+ client projects
- Portfolio of 5+ case studies

---

## Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Design | 2 weeks | Wireframes, mockups, design system |
| Development | 4 weeks | Full website build |
| Content | 1 week | Copy, images, case studies |
| Testing | 1 week | QA, performance optimization |
| Launch | - | Deployment, analytics setup |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Complex animations affecting performance | Progressive enhancement, lazy loading |
| Content delays | Use placeholder content, prioritize structure |
| Browser compatibility issues | Regular cross-browser testing |

---

## Approval

- [ ] Design direction approved
- [ ] Pricing structure confirmed
- [ ] Content outline approved
- [ ] Technical stack approved
