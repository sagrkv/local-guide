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
      whileHover={hover ? { y: -4 } : undefined}
      transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
      className={`
        bg-[var(--gray-800)]
        border border-[var(--gray-700)]
        rounded-2xl
        p-8
        transition-shadow duration-300
        ${hover ? "cursor-pointer hover:shadow-xl hover:shadow-black/20" : ""}
        ${glow ? "hover:border-[var(--accent)]/30 hover:shadow-[0_0_30px_-10px_var(--accent)]" : ""}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}
