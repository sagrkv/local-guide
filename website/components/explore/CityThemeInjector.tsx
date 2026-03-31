"use client";

import { useEffect } from "react";
import {
  getSimpleTheme,
  getSimpleThemeFontLinks,
  injectSimpleTheme,
  mapDbThemeToSimple,
  type CityThemeOverrides,
} from "@/lib/cultural-theme";

interface CityThemeInjectorProps {
  citySlug: string;
  dbTheme?: CityThemeOverrides | null;
}

/**
 * Invisible client component that applies per-city --pm-* CSS variables
 * to document.documentElement and loads the city's Google Fonts.
 *
 * On unmount (navigating away from a city page), all injected variables
 * are removed so the :root defaults in globals.css take over again.
 */
export function CityThemeInjector({ citySlug, dbTheme }: CityThemeInjectorProps) {
  useEffect(() => {
    const theme = dbTheme
      ? mapDbThemeToSimple(dbTheme, citySlug)
      : getSimpleTheme(citySlug);

    const vars = injectSimpleTheme(theme);
    const root = document.documentElement;

    // Apply every --pm-* variable to :root
    Object.entries(vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // Inject Google Font <link> elements for this city's fonts
    const fontLinks = getSimpleThemeFontLinks(theme);
    const linkElements: HTMLLinkElement[] = [];

    fontLinks.forEach((href) => {
      // Skip if this font stylesheet is already loaded
      if (document.querySelector(`link[href="${href}"]`)) return;

      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.dataset.cityTheme = citySlug;
      document.head.appendChild(link);
      linkElements.push(link);
    });

    // Cleanup: remove variables and font links when leaving the city page
    return () => {
      Object.keys(vars).forEach((key) => {
        root.style.removeProperty(key);
      });

      linkElements.forEach((link) => {
        link.remove();
      });
    };
  }, [citySlug, dbTheme]);

  return null;
}
