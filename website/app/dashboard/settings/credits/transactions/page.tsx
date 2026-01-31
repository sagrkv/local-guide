"use client";

import { useEffect, useState, useCallback } from "react";
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

const ITEMS_PER_PAGE = 20;

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [filterType, setFilterType] = useState<string>("all");

  const fetchTransactions = useCallback(async (reset = false) => {
    const currentOffset = reset ? 0 : offset;

    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const params: { limit: number; offset: number; type?: string } = {
        limit: ITEMS_PER_PAGE,
        offset: currentOffset,
      };
      if (filterType !== "all") {
        params.type = filterType;
      }

      const data = await apiClient.getCreditHistory(params);

      if (reset) {
        setTransactions(data.transactions);
        setOffset(ITEMS_PER_PAGE);
      } else {
        setTransactions(prev => [...prev, ...data.transactions]);
        setOffset(prev => prev + ITEMS_PER_PAGE);
      }
      setTotal(data.total);
    } catch {
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [offset, filterType]);

  useEffect(() => {
    fetchTransactions(true);
  }, [filterType]); // eslint-disable-line react-hooks/exhaustive-deps

  const formatTransactionType = (type: string) => {
    const types: Record<string, string> = {
      PURCHASE: "Purchase",
      COUPON: "Coupon",
      SCRAPE_CHARGE: "Scraping",
      LEAD_CHARGE: "Lead",
      ANALYSIS_CHARGE: "Analysis",
      REFUND: "Refund",
      ADMIN_ADJUSTMENT: "Adjustment",
    };
    return types[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      PURCHASE: "bg-emerald-500/10 text-emerald-400",
      COUPON: "bg-purple-500/10 text-purple-400",
      SCRAPE_CHARGE: "bg-blue-500/10 text-blue-400",
      LEAD_CHARGE: "bg-blue-500/10 text-blue-400",
      ANALYSIS_CHARGE: "bg-cyan-500/10 text-cyan-400",
      REFUND: "bg-amber-500/10 text-amber-400",
      ADMIN_ADJUSTMENT: "bg-gray-500/10 text-gray-400",
    };
    return colors[type] || "bg-gray-500/10 text-gray-400";
  };

  const hasMore = transactions.length < total;

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
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/settings/credits"
            className="w-8 h-8 rounded-md border border-gray-700 bg-gray-800/50 hover:bg-gray-700 flex items-center justify-center transition-colors"
          >
            <BackIcon className="w-4 h-4 text-gray-400" />
          </Link>
          <h1 className="text-xl font-semibold text-gray-100">Transaction History</h1>
        </div>

        {/* Filter */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="h-9 px-3 bg-gray-800/50 border border-gray-700 rounded-md text-[13px] text-white focus:outline-none focus:border-accent/50 cursor-pointer"
        >
          <option value="all">All Types</option>
          <option value="LEAD_CHARGE">Leads</option>
          <option value="SCRAPE_CHARGE">Scraping</option>
          <option value="ANALYSIS_CHARGE">Analysis</option>
          <option value="COUPON">Coupon</option>
          <option value="PURCHASE">Purchase</option>
          <option value="REFUND">Refund</option>
          <option value="ADMIN_ADJUSTMENT">Adjustment</option>
        </select>
      </div>

      {/* Transactions Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="border border-gray-800 rounded-lg bg-gray-900"
      >
        {/* Summary Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <span className="text-xs text-gray-500">
            Showing {transactions.length} of {total} transactions
          </span>
          {filterType !== "all" && (
            <button
              onClick={() => setFilterType("all")}
              className="text-xs text-accent hover:text-[#FF8C40] transition-colors"
            >
              Clear filter
            </button>
          )}
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-800 flex items-center justify-center">
              <HistoryIcon className="w-6 h-6 text-gray-500" />
            </div>
            <p className="text-[13px] text-gray-500">No transactions found</p>
          </div>
        ) : (
          <>
            {/* Transaction List */}
            <div className="divide-y divide-gray-800/50">
              {transactions.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-800/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${
                        item.amount < 0 ? "bg-red-500/10" : "bg-emerald-500/10"
                      }`}
                    >
                      {item.amount < 0 ? (
                        <MinusIcon className="w-4 h-4 text-red-400" />
                      ) : (
                        <PlusIcon className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-white truncate">
                        {item.description || formatTransactionType(item.type)}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getTypeColor(item.type)}`}>
                          {formatTransactionType(item.type)}
                        </span>
                        <span className="text-[11px] text-gray-500">
                          {new Date(item.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-semibold ml-4 ${
                      item.amount < 0 ? "text-red-400" : "text-emerald-400"
                    }`}
                  >
                    {item.amount < 0 ? "" : "+"}{item.amount}
                  </span>
                </div>
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="p-4 border-t border-gray-800">
                <button
                  onClick={() => fetchTransactions(false)}
                  disabled={loadingMore}
                  className="w-full h-9 rounded-md border border-gray-700 bg-gray-800/50 text-[13px] text-gray-300 hover:bg-gray-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {loadingMore ? (
                    <>
                      <LoadingSpinner className="w-4 h-4" />
                      Loading...
                    </>
                  ) : (
                    "Load More"
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}

// Icons
function BackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
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

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
