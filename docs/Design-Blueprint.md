# Boko - Design Blueprint

## Brand Identity

### Logo
**Concept:** Code Brackets `{BOKO}`
- Orange brackets wrapping the company name
- Signals technical/developer credibility
- Clean, modern, memorable

### Color Palette

#### Primary Colors
| Color | Hex | Usage |
|-------|-----|-------|
| Dark Background | `#0A0A0A` | Primary background |
| White | `#FFFFFF` | Primary text on dark |
| Orange (Dark Mode) | `#FF9500` | Accent, brackets, CTAs |
| Orange (Light Mode) | `#E07800` | Accent for light backgrounds |

#### Secondary Colors
| Color | Hex | Usage |
|-------|-----|-------|
| Gray 800 | `#1A1A1A` | Card backgrounds |
| Gray 600 | `#666666` | Secondary text |
| Gray 400 | `#888888` | Muted text, taglines |

### Typography

#### Font Family
**Primary:** Space Grotesk (Google Fonts)
- Clean, geometric sans-serif
- Modern tech aesthetic
- Good readability at all sizes

#### Font Weights
| Weight | Usage |
|--------|-------|
| 400 (Regular) | Body text, brackets |
| 500 (Medium) | Subheadings, taglines |
| 600 (SemiBold) | Logo text, headings |
| 700 (Bold) | Hero headlines, emphasis |

#### Type Scale
```
Hero:      72px / 80px (line-height)
H1:        48px / 56px
H2:        36px / 44px
H3:        24px / 32px
Body:      16px / 24px
Small:     14px / 20px
Caption:   12px / 16px
```

---

## Layout System

### Grid
- 12-column grid
- 24px gutters
- Max width: 1400px
- Padding: 40px (desktop), 20px (mobile)

### Spacing Scale
```
4px   - xs
8px   - sm
16px  - md
24px  - lg
32px  - xl
48px  - 2xl
64px  - 3xl
96px  - 4xl
```

---

## Navigation Design

### Desktop: Vertical Side Navigation
```
┌─────────────────────────────────────────┐
│ {B}                                     │
│                                         │
│ Home                                    │
│ Work                                    │
│ Services          [Main Content Area]   │
│ Pricing                                 │
│ About                                   │
│ Contact                                 │
│                                         │
│ [Social Icons]                          │
└─────────────────────────────────────────┘
```

- Fixed left sidebar (80px width)
- Logo/favicon at top
- Navigation links vertically stacked
- Social icons at bottom
- Subtle hover animations

### Mobile: Bottom Navigation or Hamburger
- Sticky bottom bar with icons
- Or: Hamburger menu with full-screen overlay

---

## Page Layouts

### Home Page
```
┌────────────────────────────────────────┐
│ HERO                                   │
│ "We build websites that convert"       │
│ [CTA Button]                           │
├────────────────────────────────────────┤
│ SERVICES OVERVIEW (3 cards)            │
├────────────────────────────────────────┤
│ FEATURED WORK (2-3 projects)           │
├────────────────────────────────────────┤
│ TESTIMONIALS (carousel)                │
├────────────────────────────────────────┤
│ CTA SECTION                            │
└────────────────────────────────────────┘
```

### Work Page (Horizontal Scroll)
```
┌─────────────────────────────────────────────────────────────────┐
│ ← Project 1 ─── Project 2 ─── Project 3 ─── Project 4 → scroll │
└─────────────────────────────────────────────────────────────────┘
```

### Pricing Page (Timeline Style)
```
     ₹50K          ₹1L           ₹2L          Custom
       │             │             │             │
    ───●─────────────●─────────────●─────────────●───
       │             │             │             │
   One-Page     Multi-Page    Web Apps      Complex
```

### Labs Page (Experiment Grid)
```
┌────────────────────────────────────────────────────┐
│ LABS                                               │
│ "Experiments & Creative Coding"                    │
├────────────────────────────────────────────────────┤
│ [All] [Three.js] [Shaders] [Gen Art] [Audio]       │  ← Filter tags
├────────────────────────────────────────────────────┤
│ ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│ │ WebGL    │  │ Shader   │  │ Particle │          │
│ │ Canvas   │  │ Preview  │  │ Preview  │          │
│ │ Preview  │  │          │  │          │          │
│ ├──────────┤  ├──────────┤  ├──────────┤          │
│ │Title     │  │Title     │  │Title     │          │
│ │Tags •Date│  │Tags •Date│  │Tags •Date│          │
│ └──────────┘  └──────────┘  └──────────┘          │
│                                                    │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│ │ ...      │  │ ...      │  │ ...      │          │
│ └──────────┘  └──────────┘  └──────────┘          │
└────────────────────────────────────────────────────┘
```

#### Labs Card Interaction
- **Hover:** Live WebGL preview activates (or video plays)
- **Click:** Opens full-screen interactive demo
- **Canvas:** Actual Three.js scene embedded in card (lazy-loaded)

#### Labs Technical Setup
```
/labs
  /[experiment-slug]     → Full demo page
  /experiments.json      → Experiment metadata
  /components
    ExperimentCard.tsx   → Card with embedded canvas
    ExperimentGrid.tsx   → Filterable grid
    DemoWrapper.tsx      → Full-screen demo container
```

---

## Component Library

### Buttons
```css
/* Primary Button */
background: #FF9500;
color: #000;
padding: 16px 32px;
border-radius: 8px;
font-weight: 600;

/* Secondary Button */
background: transparent;
border: 1px solid #FF9500;
color: #FF9500;

/* Ghost Button */
background: transparent;
color: #fff;
text-decoration: underline;
```

### Cards
```css
background: #1A1A1A;
border-radius: 16px;
padding: 32px;
border: 1px solid #222;
```

### Form Inputs
```css
background: #0A0A0A;
border: 1px solid #333;
border-radius: 8px;
padding: 16px;
color: #fff;
/* Focus state */
border-color: #FF9500;
```

---

## Animation Guidelines

### Principles
1. **Purposeful** - Every animation should have meaning
2. **Fast** - Keep under 300ms for micro-interactions
3. **Smooth** - Use easing functions, never linear
4. **Subtle** - Don't distract from content

### Timing
| Type | Duration | Easing |
|------|----------|--------|
| Hover | 150ms | ease-out |
| Page transition | 400ms | ease-in-out |
| Scroll reveal | 600ms | ease-out |
| Loading | 300ms | ease |

### Animation Library
- **GSAP** - Complex timeline animations, scroll triggers
- **Framer Motion** - React component animations
- **CSS** - Simple hover/focus states

### Key Animations
1. **Page Load** - Staggered fade-in of elements
2. **Scroll Reveals** - Elements animate in as you scroll
3. **Hover States** - Buttons scale, cards lift
4. **Navigation** - Smooth page transitions
5. **Work Gallery** - Momentum-based horizontal scroll

---

## Responsive Breakpoints

| Breakpoint | Width | Columns |
|------------|-------|---------|
| Mobile | < 640px | 4 |
| Tablet | 640px - 1024px | 8 |
| Desktop | > 1024px | 12 |

---

## Accessibility

- Color contrast ratio > 4.5:1
- Focus states for all interactive elements
- Alt text for all images
- Keyboard navigation support
- Reduced motion support for animations

---

## Design References & Inspirations

### Navigation & Layout
| Reference | URL | What to Study |
|-----------|-----|---------------|
| Basement Studio | [basement.studio](https://basement.studio) | Vertical side navigation, experimental layouts, dark theme execution |
| KOTA | [kota.co.uk](https://kota.co.uk) | Clean portfolio grid, project case study flow, minimal navigation |
| Humane by Design | [humanebydesign.com](https://humanebydesign.com) | Side navigation patterns, content hierarchy |

### Typography & Type Animation
| Reference | URL | What to Study |
|-----------|-----|---------------|
| Linear | [linear.app](https://linear.app) | Inter/custom sans-serif usage, heading hierarchy, micro-copy tone |
| Stripe | [stripe.com](https://stripe.com) | Professional typography scale, documentation type styles |
| Basement Studio | [basement.studio](https://basement.studio) | Experimental type treatments, large display text |

### Animation & Interactions
| Reference | URL | What to Study |
|-----------|-----|---------------|
| Basement Studio | [basement.studio](https://basement.studio) | GSAP scroll animations, page transitions, cursor effects |
| Linear | [linear.app](https://linear.app) | Subtle micro-interactions, smooth state transitions |
| Lusion | [lusion.co](https://lusion.co) | Advanced WebGL, 3D elements (for future reference) |
| Cuberto | [cuberto.com](https://cuberto.com) | Scroll-triggered animations, horizontal scroll galleries |

### Color & Dark Theme
| Reference | URL | What to Study |
|-----------|-----|---------------|
| Linear | [linear.app](https://linear.app) | Dark UI surfaces, accent color usage, depth through subtle grays |
| Vercel | [vercel.com](https://vercel.com) | Dark theme contrast, gradient usage, card depth |
| Raycast | [raycast.com](https://raycast.com) | Dark mode execution, warm accent colors |

### Portfolio & Case Studies
| Reference | URL | What to Study |
|-----------|-----|---------------|
| KOTA | [kota.co.uk](https://kota.co.uk) | Case study structure, project presentation flow |
| Pentagram | [pentagram.com](https://pentagram.com) | Full-width project imagery, minimal text layouts |
| Huge Inc | [hugeinc.com](https://hugeinc.com) | Work filtering, project cards, horizontal scroll |

### Pricing Page
| Reference | URL | What to Study |
|-----------|-----|---------------|
| Stripe | [stripe.com/pricing](https://stripe.com/pricing) | Clear tier structure, feature comparison |
| Linear | [linear.app/pricing](https://linear.app/pricing) | Clean pricing cards, FAQ integration |
| Webflow | [webflow.com/pricing](https://webflow.com/pricing) | Visual pricing progression |

### Three.js / WebGL Portfolio Showcase
| Reference | URL | What to Study |
|-----------|-----|---------------|
| Lusion | [lusion.co](https://lusion.co) | Full-screen 3D hero, interactive WebGL case studies, smooth transitions between 2D/3D |
| Aristide Benoist | [aristidebenoist.com](https://aristidebenoist.com) | Minimal 3D accents, project thumbnails with WebGL hover effects |
| Active Theory | [activetheory.net](https://activetheory.net) | Case study videos with 3D demos, performance optimization |
| Bruno Simon | [bruno-simon.com](https://bruno-simon.com) | Gamified portfolio, full 3D environment navigation |
| Ilithya | [ilithya.rocks](https://ilithya.rocks) | Creative coding showcase, shader experiments as portfolio pieces |
| Codrops | [tympanus.net/codrops](https://tympanus.net/codrops) | WebGL tutorials turned into case studies, demo-first presentation |
| Awwwards WebGL | [awwwards.com/websites/webgl](https://awwwards.com/websites/webgl/) | Curated collection of best WebGL sites for ongoing inspiration |

#### Recommended Approaches for Three.js Showcase
1. **Hero Demo** - Interactive 3D scene as the landing hero (like Lusion)
2. **Hover Effects** - 3D distortion/morph on project thumbnails
3. **Case Study Embeds** - Live WebGL demos within project pages
4. **Dedicated Labs/Experiments Page** - Separate section for shader/3D experiments
5. **Video Fallback** - Screen recordings for mobile/low-power devices

#### Technical Considerations
- Use `drei` helpers for common Three.js patterns
- Implement `Suspense` for loading states
- Add `PerformanceMonitor` for adaptive quality
- Provide 2D fallbacks for accessibility
- Lazy-load 3D scenes to improve initial page load

### Overall Vibe Alignment
- **Basement Studio** → Experimental, edgy, dark (PRIMARY inspiration)
- **Linear** → Modern SaaS polish, clean execution
- **Stripe** → Professional credibility, trust
- **KOTA** → Portfolio presentation, case study flow
- **Lusion** → Three.js/WebGL showcase excellence
