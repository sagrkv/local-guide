// ============================================================================
// SVG Wobble Utilities — Seeded random for stable hand-drawn paths
// ============================================================================

/**
 * Create a seeded pseudo-random number generator.
 * Uses a simple mulberry32 algorithm so SVG wobble is deterministic
 * across re-renders — borders never re-randomize.
 */
function seededRandom(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hash a set of numbers into a single seed. */
function hashCoords(...values: number[]): number {
  let hash = 0;
  for (const v of values) {
    hash = ((hash << 5) - hash + Math.round(v * 1000)) | 0;
  }
  return Math.abs(hash);
}

// ---------------------------------------------------------------------------
// Wobble a point by a small random offset
// ---------------------------------------------------------------------------

function wobblePoint(
  x: number,
  y: number,
  rng: () => number,
  amount: number,
): [number, number] {
  const dx = (rng() - 0.5) * 2 * amount;
  const dy = (rng() - 0.5) * 2 * amount;
  return [x + dx, y + dy];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate a wobbly SVG path `d` attribute for a rectangle.
 * Each corner is offset slightly so the rectangle looks hand-drawn.
 *
 * @param x      Left edge
 * @param y      Top edge
 * @param w      Width
 * @param h      Height
 * @param seed   Optional seed for deterministic wobble
 * @param wobble Max pixel offset per point (default 1.5)
 */
export function wobbleRect(
  x: number,
  y: number,
  w: number,
  h: number,
  seed = 0,
  wobble = 1.5,
): string {
  const rng = seededRandom(hashCoords(x, y, w, h, seed));

  // Four corners with wobble
  const [x1, y1] = wobblePoint(x, y, rng, wobble);
  const [x2, y2] = wobblePoint(x + w, y, rng, wobble);
  const [x3, y3] = wobblePoint(x + w, y + h, rng, wobble);
  const [x4, y4] = wobblePoint(x, y + h, rng, wobble);

  // Mid-points on each edge to add slight bowing
  const [mx1, my1] = wobblePoint(x + w / 2, y, rng, wobble * 0.5);
  const [mx2, my2] = wobblePoint(x + w, y + h / 2, rng, wobble * 0.5);
  const [mx3, my3] = wobblePoint(x + w / 2, y + h, rng, wobble * 0.5);
  const [mx4, my4] = wobblePoint(x, y + h / 2, rng, wobble * 0.5);

  return [
    `M ${x1.toFixed(1)} ${y1.toFixed(1)}`,
    `Q ${mx1.toFixed(1)} ${my1.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`,
    `Q ${mx2.toFixed(1)} ${my2.toFixed(1)} ${x3.toFixed(1)} ${y3.toFixed(1)}`,
    `Q ${mx3.toFixed(1)} ${my3.toFixed(1)} ${x4.toFixed(1)} ${y4.toFixed(1)}`,
    `Q ${mx4.toFixed(1)} ${my4.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`,
    'Z',
  ].join(' ');
}

/**
 * Generate a wobbly SVG path `d` attribute for a line.
 *
 * @param x1     Start X
 * @param y1     Start Y
 * @param x2     End X
 * @param y2     End Y
 * @param seed   Optional seed for deterministic wobble
 * @param wobble Max pixel offset per control point (default 1.5)
 */
export function wobbleLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  seed = 0,
  wobble = 1.5,
): string {
  const rng = seededRandom(hashCoords(x1, y1, x2, y2, seed));

  // Start and end with slight offset
  const [sx, sy] = wobblePoint(x1, y1, rng, wobble * 0.3);
  const [ex, ey] = wobblePoint(x2, y2, rng, wobble * 0.3);

  // Two control points along the line for natural curve
  const t1 = 0.33;
  const t2 = 0.66;
  const [cx1, cy1] = wobblePoint(
    x1 + (x2 - x1) * t1,
    y1 + (y2 - y1) * t1,
    rng,
    wobble,
  );
  const [cx2, cy2] = wobblePoint(
    x1 + (x2 - x1) * t2,
    y1 + (y2 - y1) * t2,
    rng,
    wobble,
  );

  return [
    `M ${sx.toFixed(1)} ${sy.toFixed(1)}`,
    `C ${cx1.toFixed(1)} ${cy1.toFixed(1)},`,
    `  ${cx2.toFixed(1)} ${cy2.toFixed(1)},`,
    `  ${ex.toFixed(1)} ${ey.toFixed(1)}`,
  ].join(' ');
}

/**
 * Generate a wobbly SVG path `d` attribute for an ellipse.
 * Approximates with 4 cubic bezier curves, each slightly offset.
 *
 * @param cx     Center X
 * @param cy     Center Y
 * @param rx     Radius X
 * @param ry     Radius Y
 * @param seed   Optional seed for deterministic wobble
 * @param wobble Max pixel offset per control point (default 1.5)
 */
export function wobbleEllipse(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  seed = 0,
  wobble = 1.5,
): string {
  const rng = seededRandom(hashCoords(cx, cy, rx, ry, seed));

  // Kappa: magic constant for circular bezier approximation
  const k = 0.5522848;
  const kx = rx * k;
  const ky = ry * k;

  function wp(x: number, y: number): [number, number] {
    return wobblePoint(x, y, rng, wobble);
  }

  // Cardinal points
  const [topX, topY] = wp(cx, cy - ry);
  const [rightX, rightY] = wp(cx + rx, cy);
  const [bottomX, bottomY] = wp(cx, cy + ry);
  const [leftX, leftY] = wp(cx - rx, cy);

  // Control points for each arc segment (with wobble)
  const [c1x, c1y] = wp(cx + kx, cy - ry);
  const [c2x, c2y] = wp(cx + rx, cy - ky);
  const [c3x, c3y] = wp(cx + rx, cy + ky);
  const [c4x, c4y] = wp(cx + kx, cy + ry);
  const [c5x, c5y] = wp(cx - kx, cy + ry);
  const [c6x, c6y] = wp(cx - rx, cy + ky);
  const [c7x, c7y] = wp(cx - rx, cy - ky);
  const [c8x, c8y] = wp(cx - kx, cy - ry);

  const f = (n: number) => n.toFixed(1);

  return [
    `M ${f(topX)} ${f(topY)}`,
    `C ${f(c1x)} ${f(c1y)}, ${f(c2x)} ${f(c2y)}, ${f(rightX)} ${f(rightY)}`,
    `C ${f(c3x)} ${f(c3y)}, ${f(c4x)} ${f(c4y)}, ${f(bottomX)} ${f(bottomY)}`,
    `C ${f(c5x)} ${f(c5y)}, ${f(c6x)} ${f(c6y)}, ${f(leftX)} ${f(leftY)}`,
    `C ${f(c7x)} ${f(c7y)}, ${f(c8x)} ${f(c8y)}, ${f(topX)} ${f(topY)}`,
    'Z',
  ].join(' ');
}
