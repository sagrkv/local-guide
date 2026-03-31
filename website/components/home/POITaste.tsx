'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { PaperCard, PaperButton, CityPhoto } from '@/components/paper';
import { fadeInUp } from '@/lib/animations';

export function POITaste() {
  return (
    <section className="py-16 md:py-24">
      <div className="max-w-3xl mx-auto px-6">
        <motion.h2
          {...fadeInUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold mb-10 text-center"
          style={{
            fontFamily: 'var(--pm-font-display)',
            color: 'var(--pm-ink)',
          }}
        >
          A taste of what&apos;s inside
        </motion.h2>

        <motion.div
          {...fadeInUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
        >
          <PaperCard variant="elevated" seed={30} className="p-0 overflow-hidden">
            {/* City photo */}
            <CityPhoto
              src="/images/cities/mysore.jpg"
              alt="Mysore city"
              width={800}
              height={400}
              className="w-full h-48 md:h-64"
            />

            <div className="p-6 md:p-8">
              {/* POI name */}
              <h3
                className="text-xl font-bold mb-2"
                style={{
                  fontFamily: 'var(--pm-font-display)',
                  color: 'var(--pm-ink)',
                }}
              >
                Mylari Hotel
              </h3>
              <p
                className="text-base mb-5"
                style={{
                  fontFamily: 'var(--pm-font-body)',
                  color: 'var(--pm-ink)',
                }}
              >
                The dosa institution since 1936.
              </p>

              {/* Local tip */}
              <div
                className="p-4 mb-5 rounded-sm"
                style={{
                  backgroundColor: 'var(--pm-surface)',
                  borderLeft: '3px solid var(--pm-accent)',
                }}
              >
                <p
                  className="text-xs font-bold uppercase tracking-wider mb-2"
                  style={{
                    fontFamily: 'var(--pm-font-display)',
                    color: 'var(--pm-accent)',
                  }}
                >
                  Local Tip
                </p>
                <p
                  className="text-sm italic leading-relaxed"
                  style={{
                    fontFamily: 'var(--pm-font-body)',
                    color: 'var(--pm-ink)',
                  }}
                >
                  The old man at the counter has been making these since before you were born. Sit at the
                  steel tables. Order the sada dosa. Trust us.
                </p>
              </div>

              {/* Attribution */}
              <p
                className="text-sm"
                style={{
                  fontFamily: 'var(--pm-font-body)',
                  color: 'var(--pm-muted)',
                }}
              >
                &mdash; Mysore, Paper Maps
              </p>
            </div>
          </PaperCard>
        </motion.div>

        {/* Nudge */}
        <div className="text-center mt-8">
          <p
            className="text-sm mb-4"
            style={{
              fontFamily: 'var(--pm-font-body)',
              color: 'var(--pm-muted)',
            }}
          >
            This is one of 45 spots on our Mysore map.
          </p>
          <Link href="/explore/mysore">
            <PaperButton variant="primary" seed={31}>
              Explore Mysore &rarr;
            </PaperButton>
          </Link>
        </div>
      </div>
    </section>
  );
}
