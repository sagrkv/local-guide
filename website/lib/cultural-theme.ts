// ============================================================================
// Cultural Theme System — Types, Presets, Utilities
// ============================================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CulturalPalette {
  primary: string;
  secondary: string;
  accent: string;
  gold: string;
  deep: string;
  background: string;
  surface: string;
  surfaceHover: string;
  text: string;
  textMuted: string;
  textOnPrimary: string;
  border: string;
  borderStrong: string;
}

export interface CulturalFonts {
  display: string;
  body: string;
  decorative?: string;
  displayUrl: string;
  bodyUrl: string;
  decorativeUrl?: string;
}

export interface CulturalPatternSet {
  heroOverlay: string;
  sectionBg: string;
  cardBorder: string;
  divider: string;
}

export interface CulturalMotifs {
  name: string;
  floatingShapes: string[];
  borderStyle: 'arch' | 'scallop' | 'wave' | 'straight' | 'ornate';
  cardCornerMotif?: string;
}

export interface CulturalLogo {
  svg: string;       // SVG path d-attribute
  width: number;     // viewBox width
  height: number;    // viewBox height
  alt: string;
}

export interface CulturalMapConfig {
  markerIcons: Record<string, string>;  // category slug → SVG path
  enable3D: boolean;
  enableTerrain: boolean;
  extrusionColor?: string;
}

export interface CulturalHero {
  imageUrl: string;
  imageAlt: string;
}

export interface CulturalTheme {
  id: string;
  name: string;
  palette: CulturalPalette;
  fonts: CulturalFonts;
  patterns: CulturalPatternSet;
  motifs: CulturalMotifs;
  logo?: CulturalLogo;
  tagline?: string;
  mapConfig?: CulturalMapConfig;
  hero?: CulturalHero;
  photoFilter?: string;  // CSS filter e.g. "saturate(1.1) sepia(0.05)"
}

// ---------------------------------------------------------------------------
// Font Library — Curated fonts organized by cultural region
// ---------------------------------------------------------------------------

export interface FontEntry {
  family: string;
  googleUrl: string;
  weights: string;
  style: string;
}

export const fontLibrary: Record<string, { display: FontEntry[]; body: FontEntry[] }> = {
  southIndian: {
    display: [
      {
        family: 'Yatra One',
        googleUrl: 'https://fonts.googleapis.com/css2?family=Yatra+One&display=swap',
        weights: '400',
        style: 'Warm, hand-drawn Indian script feel',
      },
      {
        family: 'Baloo 2',
        googleUrl: 'https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;800&display=swap',
        weights: '400;600;800',
        style: 'Rounded, friendly with Devanagari roots',
      },
      {
        family: 'Tiro Devanagari Hindi',
        googleUrl: 'https://fonts.googleapis.com/css2?family=Tiro+Devanagari+Hindi:ital@0;1&display=swap',
        weights: '400',
        style: 'Traditional Devanagari-inspired serif',
      },
    ],
    body: [
      {
        family: 'Source Sans 3',
        googleUrl: 'https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300;400;500;600;700&display=swap',
        weights: '300;400;500;600;700',
        style: 'Clean, highly readable sans-serif',
      },
      {
        family: 'Mukta',
        googleUrl: 'https://fonts.googleapis.com/css2?family=Mukta:wght@300;400;500;600;700&display=swap',
        weights: '300;400;500;600;700',
        style: 'Multi-script, excellent for Indian text',
      },
    ],
  },
  northIndian: {
    display: [
      {
        family: 'Rozha One',
        googleUrl: 'https://fonts.googleapis.com/css2?family=Rozha+One&display=swap',
        weights: '400',
        style: 'Bold, regal Devanagari-Latin display',
      },
      {
        family: 'Rajdhani',
        googleUrl: 'https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&display=swap',
        weights: '400;500;600;700',
        style: 'Geometric with Indian structural character',
      },
      {
        family: 'Khand',
        googleUrl: 'https://fonts.googleapis.com/css2?family=Khand:wght@400;500;600;700&display=swap',
        weights: '400;500;600;700',
        style: 'Compact, angular Devanagari-inspired',
      },
    ],
    body: [
      {
        family: 'Mukta',
        googleUrl: 'https://fonts.googleapis.com/css2?family=Mukta:wght@300;400;500;600;700&display=swap',
        weights: '300;400;500;600;700',
        style: 'Multi-script, excellent for Indian text',
      },
      {
        family: 'Poppins',
        googleUrl: 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap',
        weights: '300;400;500;600;700',
        style: 'Geometric sans with Indian design roots',
      },
    ],
  },
  coastal: {
    display: [
      {
        family: 'Playfair Display',
        googleUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&display=swap',
        weights: '400;500;600;700;800;900',
        style: 'Elegant transitional serif, colonial-coastal feel',
      },
      {
        family: 'Cormorant Garamond',
        googleUrl: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&display=swap',
        weights: '400;500;600;700',
        style: 'Refined, high-contrast serif',
      },
    ],
    body: [
      {
        family: 'Nunito',
        googleUrl: 'https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700&display=swap',
        weights: '300;400;500;600;700',
        style: 'Rounded, warm, beachy feel',
      },
      {
        family: 'Lato',
        googleUrl: 'https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap',
        weights: '300;400;700',
        style: 'Warm, stable sans-serif',
      },
    ],
  },
  heritage: {
    display: [
      {
        family: 'DM Serif Display',
        googleUrl: 'https://fonts.googleapis.com/css2?family=DM+Serif+Display&display=swap',
        weights: '400',
        style: 'Elegant serif with contemporary feel',
      },
      {
        family: 'Spectral',
        googleUrl: 'https://fonts.googleapis.com/css2?family=Spectral:wght@400;500;600;700&display=swap',
        weights: '400;500;600;700',
        style: 'Scholarly serif for heritage contexts',
      },
    ],
    body: [
      {
        family: 'DM Sans',
        googleUrl: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap',
        weights: '300;400;500;600;700',
        style: 'Clean geometric sans companion to DM Serif',
      },
      {
        family: 'Inter',
        googleUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
        weights: '300;400;500;600;700',
        style: 'Highly legible, universally clean',
      },
    ],
  },
  modern: {
    display: [
      {
        family: 'Space Grotesk',
        googleUrl: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap',
        weights: '400;500;600;700',
        style: 'Modern, tech-forward geometric',
      },
      {
        family: 'Sora',
        googleUrl: 'https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap',
        weights: '400;500;600;700;800',
        style: 'Contemporary, clean with personality',
      },
    ],
    body: [
      {
        family: 'Inter',
        googleUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
        weights: '300;400;500;600;700',
        style: 'Highly legible, universally clean',
      },
      {
        family: 'Plus Jakarta Sans',
        googleUrl: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap',
        weights: '300;400;500;600;700',
        style: 'Fresh, modern, excellent readability',
      },
    ],
  },
};

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

/** Mysore — inspired by Mysore painting tradition */
export const mysorePreset: CulturalTheme = {
  id: 'mysore',
  name: 'Mysore',
  palette: {
    primary: '#4A0E4E',
    secondary: '#D4AF37',
    accent: '#FFFFF0',
    gold: '#D4AF37',
    deep: '#2E0A2F',
    background: '#FAF8F5',
    surface: '#FFFFFF',
    surfaceHover: '#FFF8ED',
    text: '#1A1A1A',
    textMuted: '#6B4F6C',
    textOnPrimary: '#FAF8F5',
    border: '#E8D5B7',
    borderStrong: '#D4AF37',
  },
  fonts: {
    display: 'Yatra One',
    body: 'Source Sans 3',
    decorative: 'Tiro Devanagari Hindi',
    displayUrl:
      'https://fonts.googleapis.com/css2?family=Yatra+One&display=swap',
    bodyUrl:
      'https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300;400;500;600;700&display=swap',
    decorativeUrl:
      'https://fonts.googleapis.com/css2?family=Tiro+Devanagari+Hindi:ital@0;1&display=swap',
  },
  patterns: {
    heroOverlay: 'paisley',
    sectionBg: 'paisley',
    cardBorder: 'palace-arch',
    divider: 'lotus',
  },
  motifs: {
    name: 'mysore',
    floatingShapes: [
      // Paisley / mango motif
      'M12 2C12 2 8 6 8 12C8 18 12 22 12 22C12 22 18 20 20 16C22 12 20 8 16 6C14 5 12 2 12 2ZM12 8C13 10 14 12 13 14C12 16 11 14 11 12C11 10 12 8 12 8Z',
      // Lotus flower simplified
      'M16 20C16 20 12 16 12 12C12 8 16 4 16 4C16 4 20 8 20 12C20 16 16 20 16 20ZM16 4C16 4 12 8 12 12C12 16 16 20 16 20M8 12C4 12 2 16 2 16C2 16 6 18 8 16C10 14 8 12 8 12ZM24 12C28 12 30 16 30 16C30 16 26 18 24 16C22 14 24 12 24 12Z',
      // Elephant silhouette (trunk up)
      'M8 24L8 18C8 14 10 12 12 12L14 12C14 10 13 8 12 7C11 6 10 4 10 2L14 2C14 4 15 6 16 7C17 8 18 10 18 12L20 12C22 12 24 14 24 18L24 24L22 24L22 20L20 20L20 24L12 24L12 20L10 20L10 24ZM13 10C14 10 14.5 9.5 14.5 9C14.5 8.5 14 8 13 8C12 8 11.5 8.5 11.5 9C11.5 9.5 12 10 13 10Z',
      // Small decorative spiral
      'M16 8C16 8 20 8 20 12C20 16 16 16 16 16C16 16 12 16 12 12C12 10 14 8 16 8ZM16 10C15 10 14 11 14 12C14 13 15 14 16 14C17 14 18 13 18 12C18 11 17 10 16 10Z',
      // Diya / lamp
      'M12 4L12 8M8 8C8 8 8 12 12 12C16 12 16 8 16 8ZM6 12L18 12L16 20L8 20Z',
    ],
    borderStyle: 'arch',
    cardCornerMotif:
      'M0 24C0 24 4 20 8 20C12 20 12 16 12 12C12 8 8 4 8 4C8 4 12 0 16 0L24 0L24 4C20 4 16 4 16 8C16 12 20 12 20 16C20 20 16 24 16 24Z',
  },
  tagline: 'City of Palaces',
  logo: {
    svg: 'M16 2C16 2 10 4 8 8C6 12 6 16 8 18L10 20L12 18C12 18 14 20 16 22C18 20 20 18 20 18L22 20L24 18C26 16 26 12 24 8C22 4 16 2 16 2ZM16 6C18 8 20 12 20 14C20 16 18 17 16 17C14 17 12 16 12 14C12 12 14 8 16 6Z',
    width: 32,
    height: 32,
    alt: 'Mysore palace dome',
  },
  mapConfig: {
    markerIcons: {},
    enable3D: false,
    enableTerrain: false,
    extrusionColor: '#4A154B',
  },
  hero: { imageUrl: '', imageAlt: 'Mysore cityscape' },
  photoFilter: 'saturate(1.15) sepia(0.08)',
};

/** Goa — Portuguese-Indian coastal fusion */
export const goaPreset: CulturalTheme = {
  id: 'goa',
  name: 'Goa',
  palette: {
    primary: '#0E7490',
    secondary: '#1E3A5F',
    accent: '#F97316',
    gold: '#D4A843',
    deep: '#0C4A5E',
    background: '#FFFBF5',
    surface: '#FFFFFF',
    surfaceHover: '#F0F9FF',
    text: '#1E3A5F',
    textMuted: '#5B7B9A',
    textOnPrimary: '#FFFFFF',
    border: '#D1E3F0',
    borderStrong: '#0E7490',
  },
  fonts: {
    display: 'Playfair Display',
    body: 'Nunito',
    displayUrl:
      'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&display=swap',
    bodyUrl:
      'https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700&display=swap',
  },
  patterns: {
    heroOverlay: 'tile',
    sectionBg: 'tile',
    cardBorder: 'wave',
    divider: 'wave',
  },
  motifs: {
    name: 'goa',
    floatingShapes: [
      // Fish silhouette
      'M4 12C4 12 8 6 16 6C20 6 24 8 28 12C24 16 20 18 16 18C8 18 4 12 4 12ZM24 6L28 2L28 8ZM24 18L28 22L28 16ZM18 11C19 11 19.5 11.5 19.5 12C19.5 12.5 19 13 18 13C17 13 16.5 12.5 16.5 12C16.5 11.5 17 11 18 11Z',
      // Palm frond
      'M16 28L16 12M16 12C16 12 10 8 4 4M16 12C16 12 22 8 28 4M16 14C16 14 8 12 2 10M16 14C16 14 24 12 30 10M16 16C16 16 10 16 4 16M16 16C16 16 22 16 28 16',
      // Portuguese tile cross
      'M12 4L20 4L20 12L28 12L28 20L20 20L20 28L12 28L12 20L4 20L4 12L12 12ZM14 6L14 14L6 14L6 18L14 18L14 26L18 26L18 18L26 18L26 14L18 14L18 6Z',
      // Shell / scallop
      'M16 20C16 20 4 16 4 8C4 4 8 2 16 2C24 2 28 4 28 8C28 16 16 20 16 20ZM16 4C16 4 12 8 12 12M16 4C16 4 20 8 20 12M16 4L16 18M8 10C8 10 12 12 16 12M24 10C24 10 20 12 16 12',
      // Wave curl
      'M2 16C2 16 6 8 12 8C18 8 16 16 22 16C28 16 30 8 30 8',
    ],
    borderStyle: 'wave',
    cardCornerMotif:
      'M0 0L8 0C8 4 4 8 0 8ZM2 2L6 2C6 4 4 6 2 6Z',
  },
  tagline: 'Land of Sun, Sand & Sea',
  logo: {
    svg: 'M4 16C4 16 8 10 16 10C20 10 24 12 28 16M16 10C16 10 14 14 10 16M16 10C16 10 18 14 22 16M12 8C12 6 14 4 16 4C18 4 20 6 20 8M16 4L16 2M14 16L12 20L16 18L20 20L18 16',
    width: 32,
    height: 32,
    alt: 'Goa fish motif',
  },
  mapConfig: {
    markerIcons: {},
    enable3D: false,
    enableTerrain: false,
    extrusionColor: '#0E7490',
  },
  hero: { imageUrl: '', imageAlt: 'Goa coastline' },
  photoFilter: 'saturate(1.1) brightness(1.02)',
};

/** Jaipur — Rajasthani royal tradition */
export const jaipurPreset: CulturalTheme = {
  id: 'jaipur',
  name: 'Jaipur',
  palette: {
    primary: '#BE185D',
    secondary: '#1E40AF',
    accent: '#F59E0B',
    gold: '#D4A843',
    deep: '#7C1048',
    background: '#FEF3C7',
    surface: '#FFFBEB',
    surfaceHover: '#FEF9C3',
    text: '#451A2C',
    textMuted: '#7C5A6A',
    textOnPrimary: '#FFFFFF',
    border: '#F3D5A0',
    borderStrong: '#BE185D',
  },
  fonts: {
    display: 'Rozha One',
    body: 'Mukta',
    displayUrl:
      'https://fonts.googleapis.com/css2?family=Rozha+One&display=swap',
    bodyUrl:
      'https://fonts.googleapis.com/css2?family=Mukta:wght@300;400;500;600;700&display=swap',
  },
  patterns: {
    heroOverlay: 'jali',
    sectionBg: 'jali',
    cardBorder: 'arch',
    divider: 'arch',
  },
  motifs: {
    name: 'jaipur',
    floatingShapes: [
      // Peacock silhouette
      'M14 28L14 20C14 20 8 18 6 14C4 10 6 6 10 4C14 2 16 4 16 4C16 4 18 2 22 4C26 6 28 10 26 14C24 18 18 20 18 20L18 28ZM10 8C10 8 14 10 16 14M22 8C22 8 18 10 16 14M16 4L16 14M12 16C12 16 8 12 6 10M20 16C20 16 24 12 26 10',
      // Lotus / padma
      'M16 22C16 22 10 18 10 14C10 10 16 6 16 6C16 6 22 10 22 14C22 18 16 22 16 22ZM16 6C16 6 12 10 12 14M16 6C16 6 20 10 20 14M6 14C6 14 10 12 14 14M26 14C26 14 22 12 18 14',
      // Jali / geometric lattice star
      'M16 2L20 8L28 8L22 14L24 22L16 18L8 22L10 14L4 8L12 8ZM16 6L13 10L8 10L11 14L10 18L16 16L22 18L21 14L24 10L19 10Z',
      // Block print diamond
      'M16 4L28 16L16 28L4 16ZM16 8L24 16L16 24L8 16ZM16 12L20 16L16 20L12 16Z',
      // Arch / jharokha
      'M6 24L6 10C6 6 10 2 16 2C22 2 26 6 26 10L26 24ZM10 24L10 12C10 8 12 6 16 6C20 6 22 8 22 12L22 24',
    ],
    borderStyle: 'ornate',
    cardCornerMotif:
      'M0 16L4 12L0 8L4 4L8 0L12 4L16 0L16 4C12 4 8 8 8 12L8 16L4 12Z',
  },
  tagline: 'The Pink City',
  logo: {
    svg: 'M6 28L6 12C6 8 8 4 12 2L16 2C20 4 26 4 26 8L26 12L26 28ZM10 28L10 14C10 10 12 8 16 6C20 8 22 10 22 14L22 28M12 14L12 18M16 12L16 18M20 14L20 18M10 22L22 22',
    width: 32,
    height: 32,
    alt: 'Jaipur Hawa Mahal facade',
  },
  mapConfig: {
    markerIcons: {},
    enable3D: true,
    enableTerrain: true,
    extrusionColor: '#BE185D',
  },
  hero: { imageUrl: '', imageAlt: 'Jaipur skyline' },
  photoFilter: 'saturate(1.2) sepia(0.05)',
};

/** Default — warm earth tones for any city */
export const defaultPreset: CulturalTheme = {
  id: 'default',
  name: 'Default',
  palette: {
    primary: '#92400E',
    secondary: '#78350F',
    accent: '#B45309',
    gold: '#C5A55A',
    deep: '#451A03',
    background: '#FFFBF5',
    surface: '#FFFFFF',
    surfaceHover: '#FFF7ED',
    text: '#1C1917',
    textMuted: '#78716C',
    textOnPrimary: '#FFFFFF',
    border: '#E7E5E4',
    borderStrong: '#A8A29E',
  },
  fonts: {
    display: 'DM Serif Display',
    body: 'DM Sans',
    displayUrl:
      'https://fonts.googleapis.com/css2?family=DM+Serif+Display&display=swap',
    bodyUrl:
      'https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap',
  },
  patterns: {
    heroOverlay: 'diamond',
    sectionBg: 'dots',
    cardBorder: 'straight',
    divider: 'simple',
  },
  motifs: {
    name: 'default',
    floatingShapes: [
      // Simple diamond
      'M16 4L28 16L16 28L4 16Z',
      // Circle
      'M16 4A12 12 0 1 1 16 28A12 12 0 1 1 16 4ZM16 8A8 8 0 1 1 16 24A8 8 0 1 1 16 8Z',
      // Triangle
      'M16 4L28 28L4 28Z',
      // Hexagon
      'M16 4L26 10L26 22L16 28L6 22L6 10Z',
    ],
    borderStyle: 'straight',
  },
  tagline: 'Explore Like a Local',
  logo: {
    svg: 'M16 2L16 6M16 6L20 10L16 14L12 10L16 6ZM16 14L16 22M8 18L16 22L24 18M16 30A14 14 0 1016 2A14 14 0 1016 30Z',
    width: 32,
    height: 32,
    alt: 'Local Guide compass',
  },
  mapConfig: {
    markerIcons: {},
    enable3D: false,
    enableTerrain: false,
  },
  hero: { imageUrl: '', imageAlt: 'City view' },
  photoFilter: 'saturate(1.05)',
};

// ---------------------------------------------------------------------------
// Preset Registry
// ---------------------------------------------------------------------------

const presetMap: Record<string, CulturalTheme> = {
  mysore: mysorePreset,
  goa: goaPreset,
  jaipur: jaipurPreset,
  default: defaultPreset,
};

// ---------------------------------------------------------------------------
// Utility Functions
// ---------------------------------------------------------------------------

/** Retrieve a theme preset by ID. Falls back to default. */
export function getThemePreset(id: string): CulturalTheme {
  return presetMap[id] ?? defaultPreset;
}

/** Convert a CulturalTheme into a flat Record of CSS variable names to values. */
export function themeToCSSVariables(
  theme: CulturalTheme,
): Record<string, string> {
  const { palette, fonts } = theme;

  return {
    '--c-primary': palette.primary,
    '--c-secondary': palette.secondary,
    '--c-accent': palette.accent,
    '--c-gold': palette.gold,
    '--c-deep': palette.deep,
    '--c-bg': palette.background,
    '--c-surface': palette.surface,
    '--c-surface-hover': palette.surfaceHover,
    '--c-text': palette.text,
    '--c-text-muted': palette.textMuted,
    '--c-text-on-primary': palette.textOnPrimary,
    '--c-border': palette.border,
    '--c-border-strong': palette.borderStrong,
    '--c-font-display': `"${fonts.display}", serif`,
    '--c-font-body': `"${fonts.body}", sans-serif`,
    '--c-font-decorative': fonts.decorative
      ? `"${fonts.decorative}", serif`
      : `"${fonts.display}", serif`,
    ...(theme.photoFilter ? { '--c-photo-filter': theme.photoFilter } : {}),
    ...(theme.mapConfig?.extrusionColor
      ? { '--c-extrusion-color': theme.mapConfig.extrusionColor }
      : {}),
  };
}

/** Build a single Google Fonts URL that loads all fonts for the given theme. */
export function getGoogleFontsUrl(theme: CulturalTheme): string {
  const urls: string[] = [theme.fonts.displayUrl, theme.fonts.bodyUrl];
  if (theme.fonts.decorativeUrl) {
    urls.push(theme.fonts.decorativeUrl);
  }
  return urls.join('|');
}

/** Return an array of separate Google Fonts link hrefs (for <link> tags). */
export function getGoogleFontsLinks(theme: CulturalTheme): string[] {
  const links: string[] = [theme.fonts.displayUrl, theme.fonts.bodyUrl];
  if (theme.fonts.decorativeUrl) {
    links.push(theme.fonts.decorativeUrl);
  }
  return links;
}

/** List all available preset IDs. */
export function listPresetIds(): string[] {
  return Object.keys(presetMap);
}

/** Register a custom preset at runtime. */
export function registerPreset(theme: CulturalTheme): void {
  presetMap[theme.id] = theme;
}

// ---------------------------------------------------------------------------
// Theme Merge — DB overrides on top of preset base
// ---------------------------------------------------------------------------

/** Shape of the optional DB CityTheme used as overrides. */
export interface CityThemeOverrides {
  themePresetId?: string;
  colorPrimary?: string;
  colorSecondary?: string;
  colorAccent?: string;
  colorBackground?: string;
  colorText?: string;
  displayFontFamily?: string;
  bodyFontFamily?: string;
  displayFontUrl?: string;
  bodyFontUrl?: string;
}

/**
 * Merge a CulturalTheme preset with optional DB CityTheme overrides.
 * DB colors/fonts override preset values when present.
 * SVG motifs, patterns, and border styles always come from the preset.
 */
export function mergeThemeWithOverrides(
  preset: CulturalTheme,
  dbTheme?: CityThemeOverrides | null,
): CulturalTheme {
  if (!dbTheme) return preset;

  return {
    ...preset,
    palette: {
      ...preset.palette,
      ...(dbTheme.colorPrimary ? { primary: dbTheme.colorPrimary } : {}),
      ...(dbTheme.colorSecondary ? { secondary: dbTheme.colorSecondary } : {}),
      ...(dbTheme.colorAccent ? { accent: dbTheme.colorAccent } : {}),
      ...(dbTheme.colorBackground ? { background: dbTheme.colorBackground } : {}),
      ...(dbTheme.colorText ? { text: dbTheme.colorText } : {}),
    },
    fonts: {
      ...preset.fonts,
      ...(dbTheme.displayFontFamily ? { display: dbTheme.displayFontFamily } : {}),
      ...(dbTheme.bodyFontFamily ? { body: dbTheme.bodyFontFamily } : {}),
      ...(dbTheme.displayFontUrl ? { displayUrl: dbTheme.displayFontUrl } : {}),
      ...(dbTheme.bodyFontUrl ? { bodyUrl: dbTheme.bodyFontUrl } : {}),
    },
  };
}
