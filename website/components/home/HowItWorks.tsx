'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { wobbleLine } from '@/components/paper/wobble';
import { fadeInUp } from '@/lib/animations';

const STEPS = [
  { num: '\u2460', text: 'We pick the spots' },
  { num: '\u2461', text: 'You open the map' },
  { num: '\u2462', text: "That's it" },
];

export function HowItWorks() {
  const connectors = useMemo(
    () => [
      wobbleLine(0, 3, 100, 3, 71, 1.5),
      wobbleLine(0, 3, 100, 3, 72, 1.5),
    ],
    [],
  );

  return (
    <section id="how-it-works" className="py-16 md:py-20">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <motion.h2
          {...fadeInUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold mb-10"
          style={{
            fontFamily: 'var(--pm-font-display)',
            color: 'var(--pm-ink)',
          }}
        >
          How it works
        </motion.h2>

        <div className="flex flex-col items-center gap-2">
          {STEPS.map((step, i) => (
            <div key={step.text} className="flex flex-col items-center">
              <motion.p
                {...fadeInUp}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                className="text-lg md:text-xl"
                style={{
                  fontFamily: 'var(--pm-font-body)',
                  color: 'var(--pm-ink)',
                }}
              >
                <span
                  className="text-3xl md:text-4xl font-bold mr-3 inline-block align-middle"
                  style={{
                    fontFamily: 'var(--pm-font-display)',
                    color: 'var(--pm-accent)',
                  }}
                >
                  {step.num}
                </span>
                {step.text}
              </motion.p>

              {/* Wobbly connector line between steps */}
              {i < STEPS.length - 1 && (
                <svg
                  width="100"
                  height="12"
                  viewBox="0 0 100 6"
                  fill="none"
                  className="my-2 opacity-30"
                  aria-hidden="true"
                >
                  <path
                    d={connectors[i]}
                    stroke="var(--pm-muted)"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeDasharray="4 4"
                  />
                </svg>
              )}
            </div>
          ))}
        </div>

        <motion.p
          {...fadeInUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="text-sm mt-8"
          style={{
            fontFamily: 'var(--pm-font-body)',
            color: 'var(--pm-muted)',
          }}
        >
          No sign-up. No login. No catch.
        </motion.p>
      </div>
    </section>
  );
}
