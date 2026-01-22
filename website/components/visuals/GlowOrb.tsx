"use client";

import { motion } from "framer-motion";

interface GlowOrbProps {
  className?: string;
  color?: string;
  size?: "sm" | "md" | "lg" | "xl";
  animated?: boolean;
  intensity?: "low" | "medium" | "high";
}

const sizes = {
  sm: "w-32 h-32",
  md: "w-64 h-64",
  lg: "w-96 h-96",
  xl: "w-[500px] h-[500px]",
};

const intensities = {
  low: 0.05,
  medium: 0.1,
  high: 0.15,
};

export default function GlowOrb({
  className = "",
  color = "var(--accent)",
  size = "lg",
  animated = true,
  intensity = "medium",
}: GlowOrbProps) {
  return (
    <motion.div
      className={`absolute rounded-full blur-[100px] pointer-events-none ${sizes[size]} ${className}`}
      style={{
        background: color,
        opacity: intensities[intensity],
      }}
      initial={animated ? { scale: 0.8, opacity: 0 } : undefined}
      animate={
        animated
          ? {
              scale: [0.8, 1.1, 0.9, 1],
              opacity: [0, intensities[intensity], intensities[intensity]],
            }
          : undefined
      }
      transition={
        animated
          ? {
              duration: 8,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }
          : undefined
      }
    />
  );
}

// Multi-color glow orbs composition
export function GlowOrbCluster({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <GlowOrb
        className="top-1/4 -left-20"
        color="var(--accent)"
        size="xl"
        intensity="low"
      />
      <GlowOrb
        className="bottom-1/4 -right-20"
        color="#3B82F6"
        size="lg"
        intensity="low"
      />
      <GlowOrb
        className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        color="var(--accent)"
        size="md"
        intensity="medium"
      />
    </div>
  );
}
