"use client";

import { motion } from "framer-motion";

interface TechLinesProps {
  className?: string;
  variant?: "horizontal" | "vertical" | "diagonal" | "connector";
  animated?: boolean;
}

export default function TechLines({
  className = "",
  variant = "horizontal",
  animated = true,
}: TechLinesProps) {
  if (variant === "horizontal") {
    return (
      <svg
        className={`absolute w-full h-12 pointer-events-none ${className}`}
        viewBox="0 0 800 50"
        preserveAspectRatio="none"
        fill="none"
      >
        {/* Main line */}
        <motion.line
          x1="0"
          y1="25"
          x2="800"
          y2="25"
          stroke="var(--accent)"
          strokeWidth="1"
          strokeOpacity="0.15"
          initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />

        {/* Nodes */}
        {[100, 300, 500, 700].map((x, i) => (
          <motion.g key={i}>
            <motion.circle
              cx={x}
              cy="25"
              r="4"
              fill="var(--accent)"
              opacity="0.2"
              initial={animated ? { scale: 0 } : { scale: 1 }}
              animate={{ scale: [1, 1.3, 1] }}
              transition={{
                delay: i * 0.2,
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
            <motion.circle
              cx={x}
              cy="25"
              r="2"
              fill="var(--accent)"
              initial={animated ? { scale: 0 } : { scale: 1 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.2, duration: 0.3 }}
            />
          </motion.g>
        ))}

        {/* Pulse traveling along line */}
        {animated && (
          <motion.circle
            r="3"
            fill="var(--accent)"
            initial={{ cx: 0, cy: 25, opacity: 0.6 }}
            animate={{ cx: 800, opacity: 0 }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        )}
      </svg>
    );
  }

  if (variant === "vertical") {
    return (
      <svg
        className={`absolute w-12 h-full pointer-events-none ${className}`}
        viewBox="0 0 50 400"
        preserveAspectRatio="none"
        fill="none"
      >
        <motion.line
          x1="25"
          y1="0"
          x2="25"
          y2="400"
          stroke="var(--accent)"
          strokeWidth="1"
          strokeOpacity="0.15"
          initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />

        {[50, 150, 250, 350].map((y, i) => (
          <motion.g key={i}>
            <motion.circle
              cx="25"
              cy={y}
              r="4"
              fill="var(--accent)"
              opacity="0.2"
              initial={animated ? { scale: 0 } : { scale: 1 }}
              animate={{ scale: [1, 1.3, 1] }}
              transition={{
                delay: i * 0.2,
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
            <motion.circle
              cx="25"
              cy={y}
              r="2"
              fill="var(--accent)"
              initial={animated ? { scale: 0 } : { scale: 1 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.2, duration: 0.3 }}
            />
          </motion.g>
        ))}
      </svg>
    );
  }

  if (variant === "diagonal") {
    return (
      <svg
        className={`absolute w-full h-full pointer-events-none ${className}`}
        viewBox="0 0 400 400"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        {/* Multiple diagonal lines */}
        {[0, 100, 200, 300].map((offset, i) => (
          <motion.line
            key={i}
            x1={offset}
            y1="0"
            x2={400}
            y2={400 - offset}
            stroke="var(--accent)"
            strokeWidth="1"
            strokeOpacity={0.05 + i * 0.02}
            initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: i * 0.15 }}
          />
        ))}
      </svg>
    );
  }

  // Connector variant - for connecting elements
  return (
    <svg
      className={`absolute w-full h-full pointer-events-none ${className}`}
      viewBox="0 0 200 100"
      preserveAspectRatio="none"
      fill="none"
    >
      <motion.path
        d="M 0 50 Q 50 50 100 20 T 200 50"
        stroke="var(--accent)"
        strokeWidth="1"
        strokeOpacity="0.2"
        fill="none"
        initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      />

      {/* Start node */}
      <motion.circle
        cx="0"
        cy="50"
        r="4"
        fill="var(--accent)"
        opacity="0.3"
        initial={animated ? { scale: 0 } : { scale: 1 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2 }}
      />

      {/* End node */}
      <motion.circle
        cx="200"
        cy="50"
        r="4"
        fill="var(--accent)"
        opacity="0.3"
        initial={animated ? { scale: 0 } : { scale: 1 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1.5 }}
      />
    </svg>
  );
}

// Animated connection line between two points
export function ConnectionLine({
  startX,
  startY,
  endX,
  endY,
  className = "",
}: {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  className?: string;
}) {
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;
  const controlOffset = Math.abs(endX - startX) * 0.3;

  return (
    <svg className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}>
      <motion.path
        d={`M ${startX} ${startY} Q ${midX} ${startY - controlOffset} ${midX} ${midY} T ${endX} ${endY}`}
        stroke="var(--accent)"
        strokeWidth="1"
        strokeOpacity="0.15"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      />
    </svg>
  );
}

// Data flow animation
export function DataFlowLines({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <TechLines variant="horizontal" className="top-1/4 opacity-50" />
      <TechLines variant="horizontal" className="top-1/2 opacity-30" />
      <TechLines variant="horizontal" className="top-3/4 opacity-50" />
      <TechLines variant="diagonal" className="opacity-30" />
    </div>
  );
}
