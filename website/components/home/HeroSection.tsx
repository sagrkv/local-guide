'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { PaperTexture, PaperButton, TornEdge } from '@/components/paper';
import CityStamp from '@/components/paper/CityStamp';
import { wobbleLine } from '@/components/paper/wobble';
const stagger = {
  animate: { transition: { staggerChildren: 0.12 } },
};

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const } },
};

export function HeroSection() {
  const underlinePath = useMemo(() => wobbleLine(0, 4, 280, 4, 42, 2), []);

  return (
    <section>
      <PaperTexture className="relative pb-0">
        <div className="max-w-5xl mx-auto px-6 pt-16 pb-20 md:pt-24 md:pb-28 text-center">
          <motion.div {...stagger} initial="initial" animate="animate">
            {/* Stamp */}
            <motion.div
              className="flex justify-center mb-8"
              initial={{ scale: 0, rotate: -15 }}
              animate={{
                scale: 1,
                rotate: 0,
                transition: { type: 'spring' as const, stiffness: 500, damping: 25 },
              }}
            >
              <CityStamp cityName="Paper Maps" year={2025} size="lg" />
            </motion.div>

            {/* Headline */}
            <motion.h1
              {...fadeIn}
              className="text-5xl md:text-7xl font-bold tracking-tight mb-2"
              style={{
                fontFamily: 'var(--pm-font-display)',
                color: 'var(--pm-ink)',
              }}
            >
              The anti-Google Maps.
            </motion.h1>

            {/* Hand-drawn underline */}
            <motion.div {...fadeIn} className="flex justify-center mb-8">
              <svg
                width="280"
                height="8"
                viewBox="0 0 280 8"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d={underlinePath}
                  stroke="var(--pm-accent)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </motion.div>

            {/* Subtitle */}
            <motion.p
              {...fadeIn}
              className="text-lg md:text-xl max-w-2xl mx-auto mb-10"
              style={{
                fontFamily: 'var(--pm-font-body)',
                color: 'var(--pm-ink)',
                lineHeight: 1.6,
              }}
            >
              Beautifully curated city guides. Hand-picked by locals who actually know.
            </motion.p>

            {/* Buttons */}
            <motion.div
              {...fadeIn}
              className="flex flex-wrap justify-center gap-4 mb-10"
            >
              <Link href="/explore">
                <PaperButton variant="primary" seed={1}>
                  Explore a City &rarr;
                </PaperButton>
              </Link>
              <PaperButton
                variant="ghost"
                seed={2}
                onClick={() =>
                  document
                    .getElementById('how-it-works')
                    ?.scrollIntoView({ behavior: 'smooth' })
                }
              >
                How it works &darr;
              </PaperButton>
            </motion.div>

            {/* Philosophy line */}
            <motion.p
              {...fadeIn}
              className="text-sm"
              style={{
                fontFamily: 'var(--pm-font-body)',
                color: 'var(--pm-muted)',
              }}
            >
              No algorithms. No ads. No star ratings. Free, forever.
            </motion.p>
          </motion.div>
        </div>
      </PaperTexture>
      <TornEdge color="var(--pm-paper)" seed={7} />
    </section>
  );
}
