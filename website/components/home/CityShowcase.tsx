'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { PaperCard, CityPhoto, StaggeredList } from '@/components/paper';
import CityStamp from '@/components/paper/CityStamp';
import { cardHover } from '@/lib/animations';

interface City {
  id: string;
  name: string;
  slug: string;
  tagline?: string;
  poiCount?: number;
  primaryColor?: string;
}

interface CityShowcaseProps {
  cities: City[];
}

export function CityShowcase({ cities }: CityShowcaseProps) {
  return (
    <section className="py-16 md:py-24">
      <div className="max-w-5xl mx-auto px-6">
        <h2
          className="text-3xl md:text-4xl font-bold mb-12 text-center"
          style={{
            fontFamily: 'var(--pm-font-display)',
            color: 'var(--pm-ink)',
          }}
        >
          Pick a city. Start exploring.
        </h2>

        <StaggeredList
          className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
          staggerDelay={0.08}
        >
          {cities.slice(0, 6).map((city, i) => (
            <Link key={city.id} href={`/explore/${city.slug}`}>
              <motion.div {...cardHover}>
                <PaperCard
                  variant="default"
                  seed={i + 10}
                  className="p-0 overflow-hidden cursor-pointer"
                >
                  <div
                    className="h-full"
                    style={{ borderLeft: `3px solid ${city.primaryColor ?? 'var(--pm-accent)'}` }}
                  >
                    {/* City photo */}
                    <CityPhoto
                      src={`/images/cities/${city.slug}.jpg`}
                      alt={`${city.name} city`}
                      width={400}
                      height={240}
                      className="w-full h-40 md:h-48"
                    />

                    {/* Card content */}
                    <div className="p-5 md:p-6 relative">
                      <h3
                        className="text-xl font-bold mb-1"
                        style={{
                          fontFamily: 'var(--pm-font-display)',
                          color: 'var(--pm-ink)',
                        }}
                      >
                        {city.name}
                      </h3>
                      {city.tagline && (
                        <p
                          className="text-sm mb-2"
                          style={{
                            fontFamily: 'var(--pm-font-body)',
                            color: 'var(--pm-muted)',
                          }}
                        >
                          {city.tagline}
                        </p>
                      )}
                      {city.poiCount != null && (
                        <p
                          className="text-sm"
                          style={{
                            fontFamily: 'var(--pm-font-body)',
                            color: 'var(--pm-muted)',
                          }}
                        >
                          {city.poiCount} spots
                        </p>
                      )}

                      {/* Small stamp in corner */}
                      <div className="absolute bottom-3 right-3 opacity-60">
                        <CityStamp
                          cityName={city.name}
                          size="sm"
                          year={2025}
                        />
                      </div>
                    </div>
                  </div>
                </PaperCard>
              </motion.div>
            </Link>
          ))}
        </StaggeredList>
      </div>
    </section>
  );
}
