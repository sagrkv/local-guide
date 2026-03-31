'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { PaperTexture, PaperButton } from '@/components/paper';
import { fadeInUp } from '@/lib/animations';

export function FreeForever() {
  return (
    <section>
      <PaperTexture showFold>
        <div className="max-w-3xl mx-auto px-6 py-20 md:py-24 text-center">
          <motion.h2
            {...fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold mb-6"
            style={{
              fontFamily: 'var(--pm-font-display)',
              color: 'var(--pm-ink)',
            }}
          >
            Free, forever.
          </motion.h2>

          <motion.p
            {...fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="text-base mb-4 leading-relaxed"
            style={{
              fontFamily: 'var(--pm-font-body)',
              color: 'var(--pm-ink)',
            }}
          >
            Paper Maps is free because beautiful city guides shouldn&apos;t be behind a paywall.
          </motion.p>

          <motion.p
            {...fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="text-base mb-10 leading-relaxed"
            style={{
              fontFamily: 'var(--pm-font-body)',
              color: 'var(--pm-ink)',
            }}
          >
            We&apos;re a small studio called summar studios. We make this because we love cities.
          </motion.p>

          <motion.div
            {...fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <Link href="/explore">
              <PaperButton variant="primary" seed={40}>
                Explore a City &rarr;
              </PaperButton>
            </Link>
          </motion.div>
        </div>
      </PaperTexture>
    </section>
  );
}
