export const LAYOUT = {
  container: 'max-w-5xl mx-auto px-6',
  containerNarrow: 'max-w-2xl mx-auto px-6',
  containerWide: 'max-w-6xl mx-auto px-6',
} as const;

export const SPACING = {
  headerPadding: 'pt-20 pb-10',
  sectionPadding: 'py-16',
  contentBottom: 'pb-24',
} as const;

export const GRID = {
  cards: 'grid sm:grid-cols-2 lg:grid-cols-3 gap-6',
  twoColumn: 'grid sm:grid-cols-2 gap-6',
  categories: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4',
} as const;

export const CARD = {
  base: 'rounded-2xl overflow-hidden bg-[var(--c-surface)] border border-[var(--c-border)] transition-all duration-300',
  hover: 'hover:-translate-y-1 hover:border-[var(--c-border-strong)]',
  imageHeight: 'h-44',
  padding: 'p-4',
} as const;

export const TYPOGRAPHY = {
  h1: 'text-3xl md:text-4xl font-bold',
  h2: 'text-2xl md:text-3xl font-bold',
  h3: 'text-base font-semibold',
} as const;

export const ANIMATION = {
  fadeInUp: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } },
  entryTransition: { duration: 0.4 },
  staggerDelay: 0.06,
} as const;
