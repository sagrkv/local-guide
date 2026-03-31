'use client';

import { PaperCard, StaggeredList } from '@/components/paper';

const PRINCIPLES = [
  {
    title: 'Human Curation',
    body: "Every spot is chosen by a person who's been there. Not ranked by an algorithm. Not sorted by star ratings. Chosen by taste.",
  },
  {
    title: 'No Ads, No Sponsored Pins',
    body: 'You see what the curator loves. Not what someone paid for. Trust is the product.',
  },
  {
    title: 'AI Assists, Humans Decide',
    body: 'We use AI to discover candidates and draft descriptions. But a human approves every single thing you see.',
  },
  {
    title: 'Each City Has Its Own Soul',
    body: "Mysore isn't Goa. Our maps reflect that \u2014 different colors, different feel, different recommendations.",
  },
];

export function Philosophy() {
  return (
    <section className="py-16 md:py-24">
      <div className="max-w-3xl mx-auto px-6">
        <h2
          className="text-3xl md:text-4xl font-bold mb-12 text-center"
          style={{
            fontFamily: 'var(--pm-font-display)',
            color: 'var(--pm-ink)',
          }}
        >
          What makes this different
        </h2>

        <StaggeredList className="flex flex-col gap-6" staggerDelay={0.1}>
          {PRINCIPLES.map((item, i) => (
            <div
              key={item.title}
              style={{ transform: `rotate(${i % 2 === 0 ? -0.5 : 0.5}deg)` }}
            >
              <PaperCard variant="default" seed={i + 20} className="p-6 md:p-8">
                <h3
                  className="text-xl font-bold mb-3"
                  style={{
                    fontFamily: 'var(--pm-font-display)',
                    color: 'var(--pm-ink)',
                  }}
                >
                  <span style={{ color: 'var(--pm-accent)' }}>&#x270E; </span>
                  {item.title}
                </h3>
                <p
                  className="text-base leading-relaxed"
                  style={{
                    fontFamily: 'var(--pm-font-body)',
                    color: 'var(--pm-ink)',
                  }}
                >
                  {item.body}
                </p>
              </PaperCard>
            </div>
          ))}
        </StaggeredList>
      </div>
    </section>
  );
}
