"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";

interface CreditTransaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  reference: string | null;
  createdAt: string;
}

interface MonthlyStats {
  creditsUsed: number;
  leadsScraped: number;
  transactionCount: number;
}

export default function CreditsPage() {
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<CreditTransaction[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats>({
    creditsUsed: 0,
    leadsScraped: 0,
    transactionCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userData, historyData, statsData] = await Promise.all([
          apiClient.getCurrentUser(),
          apiClient.getCreditHistory({ limit: 10 }),
          apiClient.getMonthlyCreditsStats(),
        ]);
        setBalance(userData.user.creditBalance ?? 0);
        setHistory(historyData.transactions);
        setMonthlyStats(statsData);
      } catch {
        toast.error("Failed to load credit information");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleRedeemCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedCode = couponCode.trim();
    if (!trimmedCode) {
      toast.error("Please enter a coupon code");
      return;
    }
    setRedeeming(true);
    try {
      const result = await apiClient.redeemCoupon(trimmedCode);
      toast.success("Coupon redeemed successfully!", {
        description: `${result.creditsAdded} credits have been added to your account`,
      });
      setCouponCode("");
      setBalance(result.newBalance);
      // Refresh history
      const historyData = await apiClient.getCreditHistory({ limit: 10 });
      setHistory(historyData.transactions);
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : "Invalid or expired coupon code";
      toast.error("Failed to redeem coupon", { description: errorMessage });
    } finally {
      setRedeeming(false);
    }
  };

  const formatTransactionType = (type: string) => {
    const types: Record<string, string> = {
      PURCHASE: "Purchase",
      COUPON: "Coupon",
      SCRAPE_CHARGE: "Scraping",
      ANALYSIS_CHARGE: "Analysis",
      REFUND: "Refund",
      ADMIN_ADJUSTMENT: "Adjustment",
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-gray-100">Settings</h1>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 bg-gray-800/50 rounded-md p-0.5">
          <Link
            href="/dashboard/settings"
            className="px-3 py-1.5 text-[13px] font-medium rounded text-gray-400 hover:text-white transition-colors"
          >
            Profile
          </Link>
          <Link
            href="/dashboard/settings/credits"
            className="px-3 py-1.5 text-[13px] font-medium rounded bg-gray-700 text-white"
          >
            Credits
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="border border-gray-800 rounded-lg bg-gray-900 divide-y divide-gray-800/50"
      >
        {/* Balance Section */}
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                <CoinIcon className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Current Balance</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-white">{balance.toLocaleString()}</span>
                  <span className="text-sm text-gray-400">credits</span>
                </div>
              </div>
            </div>
            {balance < 10 && (
              <div className="px-2.5 py-1 bg-red-500/10 border border-red-500/20 rounded-md flex items-center gap-1.5">
                <WarningIcon className="w-3.5 h-3.5 text-red-400" />
                <span className="text-xs text-red-400">Low balance</span>
              </div>
            )}
          </div>
        </div>

        {/* This Month Stats */}
        <div className="p-4">
          <h2 className="text-sm font-medium text-gray-200 mb-3">This Month</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-gray-800/50 rounded-md">
              <p className="text-2xl font-bold text-white">{monthlyStats.creditsUsed}</p>
              <p className="text-xs text-gray-500">Credits Used</p>
            </div>
            <div className="p-3 bg-gray-800/50 rounded-md">
              <p className="text-2xl font-bold text-white">{monthlyStats.leadsScraped}</p>
              <p className="text-xs text-gray-500">Leads Scraped</p>
            </div>
            <div className="p-3 bg-gray-800/50 rounded-md hidden sm:block">
              <p className="text-2xl font-bold text-white">{monthlyStats.transactionCount}</p>
              <p className="text-xs text-gray-500">Transactions</p>
            </div>
          </div>
        </div>

        {/* Redeem Coupon Section */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <GiftIcon className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-medium text-gray-200">Redeem Coupon</h2>
          </div>
          <form onSubmit={handleRedeemCoupon} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Enter coupon code"
                disabled={redeeming}
                maxLength={50}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="characters"
                spellCheck="false"
                className="w-full h-9 px-3 bg-gray-800/50 border border-gray-700 rounded-md text-[13px] text-white placeholder-gray-500 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/25 uppercase tracking-wider font-mono disabled:opacity-50 transition-colors"
              />
              {couponCode.length > 0 && !redeeming && (
                <button
                  type="button"
                  onClick={() => setCouponCode("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-white transition-colors"
                >
                  <ClearIcon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={redeeming || !couponCode.trim()}
              className="h-9 px-4 bg-white text-gray-900 hover:bg-gray-100 disabled:bg-gray-700 disabled:text-gray-500 text-[13px] font-medium rounded-md transition-colors disabled:cursor-not-allowed flex items-center gap-2"
            >
              {redeeming ? (
                <LoadingSpinner className="w-4 h-4" />
              ) : (
                <TicketIcon className="w-4 h-4" />
              )}
              <span>{redeeming ? "Redeeming..." : "Redeem"}</span>
            </button>
          </form>
        </div>

        {/* Transaction History Section */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-200">Recent Transactions</h2>
            <Link
              href="/dashboard/settings/credits/transactions"
              className="text-xs text-accent hover:text-[#FF8C40] transition-colors"
            >
              View All
            </Link>
          </div>
          {history.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-gray-800 flex items-center justify-center">
                <HistoryIcon className="w-5 h-5 text-gray-500" />
              </div>
              <p className="text-[13px] text-gray-500">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 px-3 bg-gray-800/30 rounded-md">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-md flex items-center justify-center ${
                        item.amount < 0
                          ? "bg-red-500/10"
                          : item.type === "COUPON"
                            ? "bg-purple-500/10"
                            : "bg-emerald-500/10"
                      }`}
                    >
                      {item.amount < 0 ? (
                        <MinusIcon className="w-3.5 h-3.5 text-red-400" />
                      ) : (
                        <PlusIcon className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-white">
                        {item.description || formatTransactionType(item.type)}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {new Date(item.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[13px] font-semibold ${
                      item.amount < 0 ? "text-red-400" : "text-emerald-400"
                    }`}
                  >
                    {item.amount < 0 ? "" : "+"}{item.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Need Credits Section */}
        <div className="p-4 bg-accent/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                <MailIcon className="w-4 h-4 text-accent" />
              </div>
              <div>
                <p className="text-[13px] font-medium text-gray-200">Need more credits?</p>
                <p className="text-xs text-gray-500">Contact us to purchase credits</p>
              </div>
            </div>
            <a
              href="mailto:hello@boko.app?subject=Credit%20Purchase%20Request"
              className="h-9 px-4 rounded-md bg-accent/10 border border-accent/30 text-[13px] text-accent hover:bg-accent/20 transition-colors inline-flex items-center gap-1.5"
            >
              <MailIcon className="w-3.5 h-3.5" />
              Email Us
            </a>
          </div>
        </div>
      </motion.div>

      {/* Credit Costs Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-4 border border-gray-800 rounded-lg bg-gray-900 p-4"
      >
        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Credit Costs</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-gray-400">Lead scraped</span>
            <span className="text-[13px] font-medium text-white">1 credit</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-gray-400">Lighthouse analysis</span>
            <span className="text-[13px] font-medium text-white">1 credit</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-gray-400">Tech stack detection</span>
            <span className="text-[13px] font-medium text-white">1 credit</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-gray-400">Sales intelligence</span>
            <span className="text-[13px] font-medium text-white">1 credit</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Icons
function CoinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}

function GiftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
      />
    </svg>
  );
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function MinusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
    </svg>
  );
}

function ClearIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function TicketIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
      />
    </svg>
  );
}

function HistoryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}
