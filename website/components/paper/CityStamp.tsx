/**
 * CityStamp -- passport-stamp identity mark per city. Uses wobbleEllipse for
 * hand-drawn borders and an ink-bleed filter. Color: --pm-primary at 70%.
 */

import { wobbleEllipse } from "./wobble";

interface CityStampProps {
  cityName: string;
  motifPath?: string;
  year?: number;
  rotation?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES: Record<"sm" | "md" | "lg", number> = { sm: 60, md: 80, lg: 120 };

const DEFAULT_STAR =
  "M0,-8 L2.3,-2.5 L8,-2.5 L3.5,1.5 L5.3,7.5 L0,3.5 L-5.3,7.5 L-3.5,1.5 L-8,-2.5 L-2.3,-2.5 Z";

function nameSeed(name: string): number {
  return name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
}

export default function CityStamp({
  cityName,
  motifPath,
  year = 2025,
  rotation,
  size = "md",
  className = "",
}: CityStampProps) {
  const px = SIZES[size];
  const seed = nameSeed(cityName);

  const rot = rotation ?? 2 + ((cityName.charCodeAt(0) + cityName.charCodeAt(cityName.length - 1)) % 4);
  const cx = 50;
  const cy = 50;
  const textR = 33;
  const displayName = cityName.toUpperCase();
  const filterId = `ink-${seed}`;
  const arcTopId = `arc-top-${seed}`;
  const arcBotId = `arc-bot-${seed}`;

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={`${cityName} city stamp`}
      style={{ transform: `rotate(${rot}deg)` }}
    >
      <defs>
        <filter id={filterId} x="-5%" y="-5%" width="110%" height="110%">
          <feGaussianBlur stdDeviation="0.3" />
        </filter>
        <path
          id={arcTopId}
          d={`M${cx - textR},${cy} A${textR},${textR} 0 0,1 ${cx + textR},${cy}`}
        />
        <path
          id={arcBotId}
          d={`M${cx + textR},${cy} A${textR},${textR} 0 0,1 ${cx - textR},${cy}`}
        />
      </defs>

      <g filter={`url(#${filterId})`} style={{ color: "var(--pm-primary, #1E3A5F)" }}>
        {/* Outer wobbly circle */}
        <path
          d={wobbleEllipse(cx, cy, 42, 42, seed, 1.2)}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          opacity="0.7"
        />

        {/* Inner wobbly circle */}
        <path
          d={wobbleEllipse(cx, cy, 38, 38, seed + 17, 0.9)}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.7"
        />

        {/* Decorative stars flanking the text arcs */}
        <text x={cx - textR + 4} y={cy - 1} fill="currentColor" fontSize="5" opacity="0.7" textAnchor="middle">*</text>
        <text x={cx + textR - 4} y={cy - 1} fill="currentColor" fontSize="5" opacity="0.7" textAnchor="middle">*</text>

        {/* City name curved along top */}
        <text fill="currentColor" fontSize="9" fontWeight="700" fontFamily="var(--pm-font-display, 'Space Grotesk', sans-serif)" letterSpacing="0.12em" opacity="0.7">
          <textPath href={`#${arcTopId}`} startOffset="50%" textAnchor="middle">{displayName}</textPath>
        </text>

        {/* "PAPER MAPS" curved along bottom */}
        <text fill="currentColor" fontSize="7" fontWeight="600" fontFamily="var(--pm-font-display, 'Space Grotesk', sans-serif)" letterSpacing="0.1em" opacity="0.7">
          <textPath href={`#${arcBotId}`} startOffset="50%" textAnchor="middle">PAPER MAPS</textPath>
        </text>

        {/* Motif centered in stamp */}
        <g transform={`translate(${cx}, ${cy - 2})`}>
          <path d={motifPath ?? DEFAULT_STAR} fill="currentColor" opacity="0.7" />
        </g>

        {/* Year */}
        <text x={cx} y={cy + 14} textAnchor="middle" fill="currentColor" fontSize="7" fontWeight="600" fontFamily="var(--pm-font-display, 'Space Grotesk', sans-serif)" letterSpacing="0.15em" opacity="0.7">
          {year}
        </text>
      </g>
    </svg>
  );
}
