"use client";

import { motion } from "framer-motion";

interface TechIconProps {
  className?: string;
  size?: number;
  animated?: boolean;
}

// Code brackets icon
export function CodeIcon({ className = "", size = 48, animated = true }: TechIconProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      initial={animated ? { opacity: 0, scale: 0.8 } : undefined}
      animate={animated ? { opacity: 1, scale: 1 } : undefined}
      transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
    >
      <motion.path
        d="M16 12L6 24L16 36"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      />
      <motion.path
        d="M32 12L42 24L32 36"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      />
      <motion.path
        d="M28 8L20 40"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
        initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      />
    </motion.svg>
  );
}

// Database icon
export function DatabaseIcon({ className = "", size = 48, animated = true }: TechIconProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      initial={animated ? { opacity: 0, scale: 0.8 } : undefined}
      animate={animated ? { opacity: 1, scale: 1 } : undefined}
      transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
    >
      <motion.ellipse
        cx="24"
        cy="12"
        rx="14"
        ry="6"
        stroke="var(--accent)"
        strokeWidth="2"
        initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5 }}
      />
      <motion.path
        d="M10 12V36C10 39.314 16.268 42 24 42C31.732 42 38 39.314 38 36V12"
        stroke="var(--accent)"
        strokeWidth="2"
        initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      />
      <motion.path
        d="M10 24C10 27.314 16.268 30 24 30C31.732 30 38 27.314 38 24"
        stroke="var(--accent)"
        strokeWidth="2"
        initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      />
    </motion.svg>
  );
}

// Browser/window icon
export function BrowserIcon({ className = "", size = 48, animated = true }: TechIconProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      initial={animated ? { opacity: 0, scale: 0.8 } : undefined}
      animate={animated ? { opacity: 1, scale: 1 } : undefined}
      transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
    >
      <motion.rect
        x="6"
        y="8"
        width="36"
        height="32"
        rx="3"
        stroke="var(--accent)"
        strokeWidth="2"
        initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6 }}
      />
      <motion.line
        x1="6"
        y1="16"
        x2="42"
        y2="16"
        stroke="var(--accent)"
        strokeWidth="2"
        initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      />
      <motion.circle
        cx="12"
        cy="12"
        r="1.5"
        fill="var(--accent)"
        initial={animated ? { scale: 0 } : { scale: 1 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5 }}
      />
      <motion.circle
        cx="17"
        cy="12"
        r="1.5"
        fill="var(--accent)"
        initial={animated ? { scale: 0 } : { scale: 1 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.6 }}
      />
      <motion.circle
        cx="22"
        cy="12"
        r="1.5"
        fill="var(--accent)"
        initial={animated ? { scale: 0 } : { scale: 1 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.7 }}
      />
    </motion.svg>
  );
}

// Gear/settings icon
export function GearIcon({ className = "", size = 48, animated = true }: TechIconProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      initial={animated ? { opacity: 0, scale: 0.8 } : undefined}
      animate={animated ? { opacity: 1, scale: 1 } : undefined}
      transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
    >
      <motion.path
        d="M24 30C27.3137 30 30 27.3137 30 24C30 20.6863 27.3137 18 24 18C20.6863 18 18 20.6863 18 24C18 27.3137 20.6863 30 24 30Z"
        stroke="var(--accent)"
        strokeWidth="2"
        initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4 }}
      />
      <motion.path
        d="M38.4 24C38.4 24 40 20 38 16L34 18C33 16.5 31.5 15 30 14L32 10C28 8 24 8 24 8C24 8 20 8 16 10L18 14C16.5 15 15 16.5 14 18L10 16C8 20 9.6 24 9.6 24C9.6 24 8 28 10 32L14 30C15 31.5 16.5 33 18 34L16 38C20 40 24 40 24 40C24 40 28 40 32 38L30 34C31.5 33 33 31.5 34 30L38 32C40 28 38.4 24 38.4 24Z"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
        animate={
          animated
            ? { pathLength: 1, rotate: [0, 360] }
            : { pathLength: 1 }
        }
        transition={{
          pathLength: { duration: 0.8, delay: 0.2 },
          rotate: { duration: 20, repeat: Infinity, ease: "linear" },
        }}
        style={{ transformOrigin: "center" }}
      />
    </motion.svg>
  );
}

// Shield/security icon
export function ShieldIcon({ className = "", size = 48, animated = true }: TechIconProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      initial={animated ? { opacity: 0, scale: 0.8 } : undefined}
      animate={animated ? { opacity: 1, scale: 1 } : undefined}
      transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
    >
      <motion.path
        d="M24 4L6 12V22C6 33.05 13.68 43.23 24 46C34.32 43.23 42 33.05 42 22V12L24 4Z"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8 }}
      />
      <motion.path
        d="M18 24L22 28L30 20"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      />
    </motion.svg>
  );
}

// Server/cloud icon
export function ServerIcon({ className = "", size = 48, animated = true }: TechIconProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      initial={animated ? { opacity: 0, scale: 0.8 } : undefined}
      animate={animated ? { opacity: 1, scale: 1 } : undefined}
      transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
    >
      <motion.rect
        x="8"
        y="6"
        width="32"
        height="12"
        rx="2"
        stroke="var(--accent)"
        strokeWidth="2"
        initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4 }}
      />
      <motion.rect
        x="8"
        y="18"
        width="32"
        height="12"
        rx="2"
        stroke="var(--accent)"
        strokeWidth="2"
        initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      />
      <motion.rect
        x="8"
        y="30"
        width="32"
        height="12"
        rx="2"
        stroke="var(--accent)"
        strokeWidth="2"
        initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      />
      {/* Status lights */}
      <motion.circle
        cx="14"
        cy="12"
        r="2"
        fill="var(--accent)"
        initial={animated ? { scale: 0 } : { scale: 1 }}
        animate={{ scale: [1, 1.2, 1], opacity: [1, 0.6, 1] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
      />
      <motion.circle
        cx="14"
        cy="24"
        r="2"
        fill="var(--accent)"
        initial={animated ? { scale: 0 } : { scale: 1 }}
        animate={{ scale: [1, 1.2, 1], opacity: [1, 0.6, 1] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.7 }}
      />
      <motion.circle
        cx="14"
        cy="36"
        r="2"
        fill="var(--accent)"
        initial={animated ? { scale: 0 } : { scale: 1 }}
        animate={{ scale: [1, 1.2, 1], opacity: [1, 0.6, 1] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.9 }}
      />
    </motion.svg>
  );
}

// Mobile/responsive icon
export function MobileIcon({ className = "", size = 48, animated = true }: TechIconProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      initial={animated ? { opacity: 0, scale: 0.8 } : undefined}
      animate={animated ? { opacity: 1, scale: 1 } : undefined}
      transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
    >
      <motion.rect
        x="14"
        y="4"
        width="20"
        height="40"
        rx="3"
        stroke="var(--accent)"
        strokeWidth="2"
        initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6 }}
      />
      <motion.line
        x1="14"
        y1="10"
        x2="34"
        y2="10"
        stroke="var(--accent)"
        strokeWidth="2"
        initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      />
      <motion.line
        x1="14"
        y1="38"
        x2="34"
        y2="38"
        stroke="var(--accent)"
        strokeWidth="2"
        initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      />
      <motion.circle
        cx="24"
        cy="42"
        r="2"
        stroke="var(--accent)"
        strokeWidth="2"
        initial={animated ? { scale: 0 } : { scale: 1 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.6 }}
      />
    </motion.svg>
  );
}

// Layers/design icon
export function LayersIcon({ className = "", size = 48, animated = true }: TechIconProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      initial={animated ? { opacity: 0, scale: 0.8 } : undefined}
      animate={animated ? { opacity: 1, scale: 1 } : undefined}
      transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
    >
      <motion.path
        d="M24 4L4 14L24 24L44 14L24 4Z"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5 }}
      />
      <motion.path
        d="M4 24L24 34L44 24"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      />
      <motion.path
        d="M4 34L24 44L44 34"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      />
    </motion.svg>
  );
}
