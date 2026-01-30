"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";

interface CreditHistory {
  id: string;
  amount: number;
  type: "PURCHASE" | "USAGE" | "COUPON" | "REFUND";
  description: string;
  createdAt: string;
}

export default function CreditsPage() {
  const [balance, setBalance] = useState(100);
  const [history, setHistory] = useState<CreditHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const userData = await apiClient.getCurrentUser();
        setBalance(userData.user.creditBalance ?? 100);
        setHistory([
          {
            id: "1",
            amount: 100,
            type: "PURCHASE",
            description: "Initial credits",
            createdAt: new Date().toISOString(),
          },
        ]);
      } catch {
        toast.error("Failed to load credit information");
      } finally {
        setLoading(false);
      }
    };
    fetchCredits();
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
      setHistory((prevHistory) => [
        {
          id: crypto.randomUUID(),
          amount: result.creditsAdded,
          type: "COUPON" as const,
          description: `Redeemed coupon: ${trimmedCode}`,
          createdAt: new Date().toISOString(),
        },
        ...prevHistory,
      ]);
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : "Invalid or expired coupon code";
      toast.error("Failed to redeem coupon", { description: errorMessage });
    } finally {
      setRedeeming(false);
    }
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
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-white">
            <span className="text-gray-400 font-medium">Settings /</span> Credits
          </h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Manage your credit balance and transactions</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-4 border-b border-gray-800">
        <Link
          href="/dashboard/settings"
          className="px-3 py-2 text-[13px] font-medium text-gray-400 hover:text-white transition-colors"
        >
          Profile
        </Link>
        <Link
          href="/dashboard/settings/credits"
          className="px-3 py-2 text-[13px] font-medium text-accent border-b-2 border-accent -mb-px"
        >
          Credits
        </Link>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-4">
        {/* Main Content */}
        <div className="space-y-4">
          {/* Current Balance Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-accent/30 rounded-lg bg-gradient-to-br from-accent/10 to-accent/5 overflow-hidden"
          >
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-accent/80 uppercase tracking-wide">Current Balance</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-4xl font-bold text-white">{balance.toLocaleString()}</span>
                    <span className="text-sm text-gray-400">credits</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">≈ {balance} leads remaining</p>
                </div>
                <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center">
                  <CoinIcon className="w-7 h-7 text-accent" />
                </div>
              </div>
              {balance < 10 && (
                <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded-md flex items-center gap-2">
                  <WarningIcon className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-xs text-red-400">Low balance! Add credits to continue scraping.</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Main Card with Sections */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="border border-gray-800 rounded-lg bg-gray-900 divide-y divide-gray-800/50"
          >
            {/* Redeem Coupon Section */}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-md bg-purple-500/10 flex items-center justify-center">
                  <GiftIcon className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-sm font-medium text-white">Redeem Coupon</h2>
                  <p className="text-xs text-gray-500">Enter a code to add credits</p>
                </div>
              </div>
              <form onSubmit={handleRedeemCoupon} className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="WELCOME50"
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
                  className="h-9 px-4 bg-accent hover:bg-[#FF8C40] disabled:bg-gray-700 disabled:text-gray-500 text-background text-[13px] font-medium rounded-md transition-colors disabled:cursor-not-allowed flex items-center gap-2"
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

            {/* Purchase Credits Section */}
            <div className="p-4">
              <h2 className="text-sm font-medium text-white mb-3">Purchase Credits</h2>
              <div className="grid grid-cols-3 gap-3">
                <PricingCard credits={100} price={9.99} />
                <PricingCard credits={500} price={39.99} popular savings="Save 20%" />
                <PricingCard credits={1000} price={69.99} savings="Save 30%" />
              </div>
              <p className="text-[11px] text-gray-500 text-center mt-3">
                Payments processed securely. Credits never expire.
              </p>
            </div>

            {/* Transaction History Section */}
            <div className="p-4">
              <h2 className="text-sm font-medium text-white mb-3">Transaction History</h2>
              {history.length === 0 ? (
                <p className="text-[13px] text-gray-500 text-center py-4">No transactions yet</p>
              ) : (
                <div className="space-y-2">
                  {history.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-2 px-3 bg-gray-800/30 rounded-md">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-md flex items-center justify-center ${
                            item.type === "USAGE"
                              ? "bg-red-500/10"
                              : item.type === "COUPON"
                                ? "bg-purple-500/10"
                                : "bg-emerald-500/10"
                          }`}
                        >
                          {item.type === "USAGE" ? (
                            <MinusIcon className="w-3.5 h-3.5 text-red-400" />
                          ) : (
                            <PlusIcon className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-[13px] font-medium text-white">{item.description}</p>
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
                          item.type === "USAGE" ? "text-red-400" : "text-emerald-400"
                        }`}
                      >
                        {item.type === "USAGE" ? "-" : "+"}
                        {item.amount}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Credit Usage */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="border border-gray-800 rounded-lg bg-gray-900 p-4"
          >
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Credit Costs</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-1.5">
                <span className="text-[13px] text-gray-300">Lead scraped</span>
                <span className="text-[13px] font-medium text-white">1 credit</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-[13px] text-gray-300">Lighthouse analysis</span>
                <span className="text-[13px] font-medium text-white">1 credit</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-[13px] text-gray-300">Tech stack detection</span>
                <span className="text-[13px] font-medium text-white">1 credit</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-[13px] text-gray-300">Sales intelligence</span>
                <span className="text-[13px] font-medium text-white">1 credit</span>
              </div>
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="border border-gray-800 rounded-lg bg-gray-900 p-4"
          >
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">This Month</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-800/50 rounded-md">
                <p className="text-2xl font-bold text-white">0</p>
                <p className="text-[11px] text-gray-500">Credits Used</p>
              </div>
              <div className="p-3 bg-gray-800/50 rounded-md">
                <p className="text-2xl font-bold text-white">0</p>
                <p className="text-[11px] text-gray-500">Leads Scraped</p>
              </div>
            </div>
          </motion.div>

          {/* Help */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="border border-gray-800 rounded-lg bg-gray-900 p-4"
          >
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Need Help?</h3>
            <p className="text-[13px] text-gray-400 mb-3">
              Questions about credits or billing?
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-1.5 text-[13px] text-accent hover:text-[#FF8C40] transition-colors"
            >
              Contact Support
              <ArrowIcon className="w-3.5 h-3.5" />
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function PricingCard({
  credits,
  price,
  popular = false,
  savings,
}: {
  credits: number;
  price: number;
  popular?: boolean;
  savings?: string;
}) {
  return (
    <div
      className={`relative rounded-lg border p-3 transition-all hover:scale-[1.02] cursor-pointer ${
        popular
          ? "bg-accent/10 border-accent/50"
          : "bg-gray-800/30 border-gray-700 hover:border-gray-600"
      }`}
    >
      {popular && (
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-accent text-background text-[10px] font-semibold rounded-full">
          Popular
        </span>
      )}
      <div className="text-center">
        <p className="text-xl font-bold text-white">{credits.toLocaleString()}</p>
        <p className="text-[11px] text-gray-400">credits</p>
        <p className="text-lg font-semibold text-white mt-2">${price}</p>
        {savings && <p className="text-[10px] text-emerald-400">{savings}</p>}
        <button
          disabled
          className={`w-full mt-2 h-7 text-[11px] font-medium rounded-md transition-colors ${
            popular
              ? "bg-accent text-background"
              : "bg-gray-700 text-white"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          Coming Soon
        </button>
      </div>
    </div>
  );
}

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

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
