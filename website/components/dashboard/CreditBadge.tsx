"use client";

import { motion } from "framer-motion";

interface CreditBadgeProps {
  balance: number;
  className?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export default function CreditBadge({
  balance,
  className = "",
  size = "md",
  showLabel = true,
}: CreditBadgeProps) {
  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const isLowBalance = balance < 10;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        inline-flex items-center gap-1.5
        ${sizeClasses[size]}
        ${isLowBalance ? "bg-red-500/10 border-red-500/30" : "bg-accent/10 border-accent/30"}
        border rounded-lg
        ${className}
      `}
    >
      <CoinIcon className={`${iconSizes[size]} ${isLowBalance ? "text-red-400" : "text-accent"}`} />
      <span className={`font-semibold ${isLowBalance ? "text-red-400" : "text-accent"}`}>
        {balance.toLocaleString()}
      </span>
      {showLabel && (
        <span className="text-gray-400 font-normal">credits</span>
      )}
    </motion.div>
  );
}

function CoinIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
