// Cultural theming system — barrel exports
// ============================================================================

// Provider & hook
export { CulturalProvider, useCulturalTheme } from './CulturalProvider';

// Theme library (types, presets, utilities)
export {
  type CulturalPalette,
  type CulturalFonts,
  type CulturalPatternSet,
  type CulturalMotifs,
  type CulturalTheme,
  type CulturalLogo,
  type CulturalMapConfig,
  type CulturalHero,
  type CityThemeOverrides,
  type FontEntry,
  fontLibrary,
  mysorePreset,
  goaPreset,
  jaipurPreset,
  defaultPreset,
  getThemePreset,
  themeToCSSVariables,
  getGoogleFontsUrl,
  getGoogleFontsLinks,
  listPresetIds,
  registerPreset,
  mergeThemeWithOverrides,
} from '@/lib/cultural-theme';

// Pattern packs
export {
  PaisleyPattern,
  LotusPattern,
  PalaceArchBorder,
  ElephantMotif,
  GoldLeafTexture,
  RangoliCorner,
} from './patterns/MysorePatterns';

export {
  DiamondGrid,
  DotMatrix,
  WavePattern,
} from './patterns/DefaultPatterns';

// Compositional components
export { SectionDivider } from './SectionDivider';
export { DecorativeCard } from './DecorativeCard';
export { BackgroundPattern } from './BackgroundPattern';
export { FloatingMotifs } from './FloatingMotifs';
export { HeroOverlay } from './HeroOverlay';
export { GoldAccent } from './GoldAccent';
export { CityMark } from './CityMark';
