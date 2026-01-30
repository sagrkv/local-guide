"use client";

import { motion } from "framer-motion";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  onClick?: () => void;
}

export default function Card({
  children,
  className = "",
  hover = true,
  glow = false,
  onClick,
}: CardProps) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={hover ? { y: -2 } : undefined}
      transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
      className={`
        bg-[var(--gray-800)]
        border border-[var(--gray-700)]
        rounded-lg
        p-4
        transition-colors duration-200
        ${hover ? "cursor-pointer hover:border-[var(--gray-600)]" : ""}
        ${glow ? "hover:border-[var(--accent)]/30" : ""}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}
