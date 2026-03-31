'use client';

import { useState, useEffect } from 'react';
import { PaperTexture, InkDivider } from '@/components/paper';
import { HeroSection } from '@/components/home/HeroSection';
import { CityShowcase } from '@/components/home/CityShowcase';
import { Philosophy } from '@/components/home/Philosophy';
import { HowItWorks } from '@/components/home/HowItWorks';
import { POITaste } from '@/components/home/POITaste';
import { FreeForever } from '@/components/home/FreeForever';

// ============================================
// TYPES
// ============================================
interface City {
  id: string;
  name: string;
  slug: string;
  tagline?: string;
  poiCount?: number;
  primaryColor?: string;
}

// ============================================
// STATIC FALLBACK DATA
// ============================================
const FALLBACK_CITIES: City[] = [
  {
    id: '1',
    name: 'Mysore',
    slug: 'mysore',
    tagline: 'City of Palaces',
    poiCount: 45,
    primaryColor: '#8B6914',
  },
  {
    id: '2',
    name: 'Bangalore',
    slug: 'bangalore',
    tagline: 'Garden City',
    poiCount: 62,
    primaryColor: '#2D6A4F',
  },
  {
    id: '3',
    name: 'Hampi',
    slug: 'hampi',
    tagline: 'Ruins & Boulders',
    poiCount: 38,
    primaryColor: '#B85C38',
  },
  {
    id: '4',
    name: 'Coorg',
    slug: 'coorg',
    tagline: 'Scotland of India',
    poiCount: 28,
    primaryColor: '#2D5F2D',
  },
  {
    id: '5',
    name: 'Goa',
    slug: 'goa',
    tagline: 'Sun, Sand & Soul',
    poiCount: 55,
    primaryColor: '#1E6091',
  },
  {
    id: '6',
    name: 'Pondicherry',
    slug: 'pondicherry',
    tagline: 'French Quarter Charm',
    poiCount: 32,
    primaryColor: '#C2703E',
  },
];

// ============================================
// PAGE COMPONENT
// ============================================
export default function HomePage() {
  const [cities, setCities] = useState<City[]>(FALLBACK_CITIES);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const res = await fetch('/api/v1/cities?status=PUBLISHED', {
          signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setCities(
            data.map((c: Record<string, unknown>) => ({
              id: String(c.id || ''),
              name: String(c.name || ''),
              slug: String(c.slug || ''),
              tagline: c.tagline ? String(c.tagline) : undefined,
              poiCount:
                typeof c.poiCount === 'number' ? c.poiCount : undefined,
              primaryColor: c.primaryColor
                ? String(c.primaryColor)
                : undefined,
            })),
          );
        }
      } catch {
        // Silently fall back to static data
      }
    };
    fetchCities();
  }, []);

  return (
    <PaperTexture className="min-h-screen">
      <HeroSection />
      <InkDivider variant="wavy" seed={1} className="my-0" />
      <CityShowcase cities={cities} />
      <InkDivider variant="dashed" seed={2} className="my-0" />
      <Philosophy />
      <InkDivider variant="straight" seed={3} className="my-0" />
      <HowItWorks />
      <InkDivider variant="wavy" seed={4} className="my-0" />
      <POITaste />
      <InkDivider variant="dashed" seed={5} className="my-0" />
      <FreeForever />
    </PaperTexture>
  );
}
