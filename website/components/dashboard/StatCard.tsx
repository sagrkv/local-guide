"use client";

import { motion } from "framer-motion";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color?: "default" | "orange" | "blue" | "green" | "purple" | "red";
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export default function StatCard({
  label,
  value,
  icon,
  color = "default",
  trend,
  className = "",
}: StatCardProps) {
  const colorClasses = {
    default: "text-white",
    orange: "text-accent",
    blue: "text-blue-400",
    green: "text-emerald-400",
    purple: "text-purple-400",
    red: "text-red-400",
  };

  const iconBgClasses = {
    default: "bg-gray-700",
    orange: "bg-accent/10",
    blue: "bg-blue-500/10",
    green: "bg-emerald-500/10",
    purple: "bg-purple-500/10",
    red: "bg-red-500/10",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        bg-gray-800 rounded-lg p-4 border border-gray-700
        hover:border-gray-600 transition-colors duration-200
        ${className}
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-400 truncate">{label}</p>
          <p className={`text-2xl font-semibold mt-0.5 ${colorClasses[color]}`}>
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {trend && (
            <div className="flex items-center gap-1 mt-1">
              <span
                className={`text-xs font-medium ${
                  trend.isPositive ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {trend.isPositive ? "+" : "-"}{Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-gray-500">vs last month</span>
            </div>
          )}
        </div>
        <div
          className={`
            w-10 h-10 rounded-lg flex items-center justify-center
            ${iconBgClasses[color]}
            text-gray-400
          `}
        >
          {icon}
        </div>
      </div>
    </motion.div>
  );
}
