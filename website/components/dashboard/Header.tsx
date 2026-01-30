"use client";

import Link from "next/link";
import CreditBadge from "./CreditBadge";

interface HeaderProps {
  onMenuClick: () => void;
  creditBalance: number;
  title?: string;
  subtitle?: string;
}

export default function Header({
  onMenuClick,
  creditBalance,
  title,
  subtitle,
}: HeaderProps) {
  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 z-50">
      <button
        onClick={onMenuClick}
        className="p-2 text-gray-400 hover:text-white transition-colors"
        aria-label="Toggle menu"
      >
        <MenuIcon className="w-6 h-6" />
      </button>

      <div className="flex-1 text-center">
        {title ? (
          <div>
            <h1 className="text-sm font-semibold text-white">{title}</h1>
            {subtitle && (
              <p className="text-xs text-gray-400">{subtitle}</p>
            )}
          </div>
        ) : (
          <Link href="/dashboard" className="inline-block">
            <span className="font-semibold">
              <span className="text-accent">[</span>
              Leedo
              <span className="text-accent">]</span>
            </span>
          </Link>
        )}
      </div>

      <Link href="/dashboard/settings/credits">
        <CreditBadge balance={creditBalance} size="sm" showLabel={false} />
      </Link>
    </header>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  );
}
