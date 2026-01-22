"use client";

import { motion } from "framer-motion";

interface CircuitPatternProps {
  className?: string;
  opacity?: number;
  animated?: boolean;
}

export default function CircuitPattern({
  className = "",
  opacity = 0.1,
  animated = true,
}: CircuitPatternProps) {
  const paths = [
    // Horizontal lines with nodes
    "M 0 50 H 30 L 40 40 H 80 L 90 50 H 120",
    "M 200 30 H 250 L 260 40 H 300",
    "M 150 80 H 180 L 190 70 H 220 L 230 80 H 280",
    // Vertical connections
    "M 40 40 V 20",
    "M 90 50 V 80",
    "M 230 80 V 100",
    // More complex paths
    "M 300 60 H 350 L 360 50 H 400 L 410 60 H 450",
    "M 100 100 H 140 L 150 90 H 200",
    "M 350 90 V 70 H 380 V 50",
  ];

  const nodes = [
    { cx: 40, cy: 40 },
    { cx: 90, cy: 50 },
    { cx: 230, cy: 80 },
    { cx: 260, cy: 40 },
    { cx: 360, cy: 50 },
    { cx: 150, cy: 90 },
    { cx: 40, cy: 20 },
    { cx: 90, cy: 80 },
  ];

  return (
    <svg
      className={`absolute inset-0 w-full h-full ${className}`}
      style={{ opacity }}
      viewBox="0 0 500 120"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      <defs>
        <linearGradient id="circuitGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0" />
          <stop offset="50%" stopColor="var(--accent)" stopOpacity="1" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Circuit paths */}
      {paths.map((d, i) => (
        <motion.path
          key={i}
          d={d}
          stroke="var(--accent)"
          strokeWidth="1"
          strokeOpacity={0.3}
          initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
          animate={{ pathLength: 1 }}
          transition={{
            duration: 2,
            delay: i * 0.2,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Glowing nodes */}
      {nodes.map((node, i) => (
        <g key={i}>
          {/* Glow effect */}
          <motion.circle
            cx={node.cx}
            cy={node.cy}
            r="4"
            fill="var(--accent)"
            opacity={0.3}
            initial={animated ? { scale: 0 } : { scale: 1 }}
            animate={{ scale: [1, 1.5, 1] }}
            transition={{
              duration: 2,
              delay: i * 0.3,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
          {/* Core node */}
          <motion.circle
            cx={node.cx}
            cy={node.cy}
            r="2"
            fill="var(--accent)"
            initial={animated ? { scale: 0 } : { scale: 1 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.2, duration: 0.3 }}
          />
        </g>
      ))}

      {/* Animated pulse traveling along a path */}
      {animated && (
        <motion.circle
          r="3"
          fill="var(--accent)"
          initial={{ offsetDistance: "0%" }}
          animate={{ offsetDistance: "100%" }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            offsetPath: `path("${paths[0]}")`,
          }}
        />
      )}
    </svg>
  );
}
