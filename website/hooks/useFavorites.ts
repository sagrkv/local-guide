"use client";

import { useState, useEffect, useCallback } from "react";

interface Favorite {
  poiId: string;
  citySlug: string;
  addedAt: string;
}

const STORAGE_KEY = "localguide_favorites";

export function useFavorites() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch {
      // localStorage may be unavailable
    }
  }, []);

  const toggle = useCallback((poiId: string, citySlug: string) => {
    setFavorites((prev) => {
      const exists = prev.find((f) => f.poiId === poiId);
      const next = exists
        ? prev.filter((f) => f.poiId !== poiId)
        : [...prev, { poiId, citySlug, addedAt: new Date().toISOString() }];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // silently fail if storage full
      }
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (poiId: string) => {
      return favorites.some((f) => f.poiId === poiId);
    },
    [favorites],
  );

  const getFavoritesForCity = useCallback(
    (citySlug: string) => {
      return favorites.filter((f) => f.citySlug === citySlug);
    },
    [favorites],
  );

  const clear = useCallback(() => {
    setFavorites([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // silently fail
    }
  }, []);

  return { favorites, toggle, isFavorite, getFavoritesForCity, clear };
}
