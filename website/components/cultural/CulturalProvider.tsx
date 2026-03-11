'use client';

import React, {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import {
  type CulturalTheme,
  getThemePreset,
  themeToCSSVariables,
  getGoogleFontsLinks,
} from '@/lib/cultural-theme';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const CulturalThemeContext = createContext<CulturalTheme | null>(null);

/** Access the current cultural theme. Throws if used outside a provider. */
export function useCulturalTheme(): CulturalTheme {
  const theme = useContext(CulturalThemeContext);
  if (!theme) {
    throw new Error(
      'useCulturalTheme must be used within a <CulturalProvider>.',
    );
  }
  return theme;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface CulturalProviderProps {
  /** A full CulturalTheme object OR a preset ID string (e.g. "mysore"). */
  theme: CulturalTheme | string;
  children: ReactNode;
  /** Optional extra className on the wrapper div. */
  className?: string;
}

export function CulturalProvider({
  theme: themeProp,
  children,
  className,
}: CulturalProviderProps) {
  const resolvedTheme: CulturalTheme = useMemo(
    () => (typeof themeProp === 'string' ? getThemePreset(themeProp) : themeProp),
    [themeProp],
  );

  const cssVars = useMemo(
    () => themeToCSSVariables(resolvedTheme),
    [resolvedTheme],
  );

  const fontLinks = useMemo(
    () => getGoogleFontsLinks(resolvedTheme),
    [resolvedTheme],
  );

  return (
    <CulturalThemeContext.Provider value={resolvedTheme}>
      {/* Load Google Fonts */}
      {fontLinks.map((href) => (
        <link key={href} rel="stylesheet" href={href} />
      ))}

      {/* Inject CSS variables on a wrapper div */}
      <div
        style={cssVars as React.CSSProperties}
        className={className}
      >
        {children}
      </div>
    </CulturalThemeContext.Provider>
  );
}

export default CulturalProvider;
