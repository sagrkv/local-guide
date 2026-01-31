"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";

interface Redemption {
  id: string;
  redeemedAt: string;
  user: { id: string; name: string | null; email: string };
}

interface Coupon {
  id: string;
  code: string;
  creditAmount: number;
  maxUses: number | null;
  currentUses: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  createdBy: { id: string; name: string; email: string };
  redemptions?: Redemption[];
}

interface CouponStats {
  totalCoupons: number;
  activeCoupons: number;
  totalRedemptions: number;
  totalCreditsDistributed: number;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [stats, setStats] = useState<CouponStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [expandedCoupon, setExpandedCoupon] = useState<string | null>(null);
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    creditAmount: 100,
    maxUses: "",
    expiresAt: "",
  });

  const fetchData = useCallback(async () => {
    try {
      const [couponsData, statsData] = await Promise.all([
        apiClient.getAdminCoupons({ includeInactive }),
        apiClient.getAdminCouponStats(),
      ]);
      setCoupons(couponsData);
      setStats(statsData);
    } catch {
      toast.error("Failed to load coupons");
    } finally {
      setLoading(false);
    }
  }, [includeInactive]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.code || !newCoupon.creditAmount) {
      toast.error("Code and credit amount are required");
      return;
    }

    setCreating(true);
    try {
      await apiClient.createAdminCoupon({
        code: newCoupon.code.toUpperCase(),
        creditAmount: Number(newCoupon.creditAmount),
        maxUses: newCoupon.maxUses ? Number(newCoupon.maxUses) : null,
        expiresAt: newCoupon.expiresAt || null,
      });
      toast.success("Coupon created successfully");
      setShowCreateModal(false);
      setNewCoupon({ code: "", creditAmount: 100, maxUses: "", expiresAt: "" });
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create coupon");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      if (coupon.isActive) {
        await apiClient.deactivateAdminCoupon(coupon.id);
        toast.success("Coupon deactivated");
      } else {
        await apiClient.activateAdminCoupon(coupon.id);
        toast.success("Coupon activated");
      }
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update coupon");
    }
  };

  const handleDelete = async (coupon: Coupon) => {
    if (!confirm(`Delete coupon "${coupon.code}"? This cannot be undone.`)) return;

    try {
      await apiClient.deleteAdminCoupon(coupon.id);
      toast.success("Coupon deleted");
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete coupon");
    }
  };

  const generateRandomCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewCoupon({ ...newCoupon, code });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Coupons</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Create and manage coupon codes for credits
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-900 font-medium rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Create Coupon
        </button>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-zinc-800/50 backdrop-blur border border-zinc-700/50 rounded-xl p-4">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Total Coupons
            </span>
            <p className="text-2xl font-semibold text-white mt-1">{stats.totalCoupons}</p>
          </div>
          <div className="bg-zinc-800/50 backdrop-blur border border-zinc-700/50 rounded-xl p-4">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Active
            </span>
            <p className="text-2xl font-semibold text-emerald-400 mt-1">{stats.activeCoupons}</p>
          </div>
          <div className="bg-zinc-800/50 backdrop-blur border border-zinc-700/50 rounded-xl p-4">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Redemptions
            </span>
            <p className="text-2xl font-semibold text-blue-400 mt-1">{stats.totalRedemptions}</p>
          </div>
          <div className="bg-zinc-800/50 backdrop-blur border border-zinc-700/50 rounded-xl p-4">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Credits Given
            </span>
            <p className="text-2xl font-semibold text-amber-400 mt-1">{stats.totalCreditsDistributed.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-zinc-400">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
            className="w-4 h-4 rounded bg-zinc-800 border-zinc-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0"
          />
          Show inactive coupons
        </label>
      </div>

      {/* Coupons Table */}
      <div className="bg-zinc-800/30 backdrop-blur border border-zinc-700/50 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-zinc-700/30">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Code
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Credits
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Usage
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Expires
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-700/30">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent" />
                  </div>
                </td>
              </tr>
            ) : coupons.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-zinc-400">
                  No coupons found
                </td>
              </tr>
            ) : (
              coupons.map((coupon) => {
                const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
                const isMaxedOut = coupon.maxUses && coupon.currentUses >= coupon.maxUses;
                const isExpanded = expandedCoupon === coupon.id;
                const hasRedemptions = coupon.redemptions && coupon.redemptions.length > 0;
                return (
                  <>
                    <tr
                      key={coupon.id}
                      className={`hover:bg-zinc-700/10 ${hasRedemptions ? 'cursor-pointer' : ''}`}
                      onClick={() => hasRedemptions && setExpandedCoupon(isExpanded ? null : coupon.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {hasRedemptions && (
                            <svg
                              className={`w-4 h-4 text-zinc-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          )}
                          <code className="px-2 py-1 bg-zinc-700/50 rounded text-sm font-mono text-emerald-400">
                            {coupon.code}
                          </code>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-white font-medium">
                        {coupon.creditAmount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="text-white">{coupon.currentUses}</span>
                        <span className="text-zinc-500">
                          {coupon.maxUses ? ` / ${coupon.maxUses}` : " / unlimited"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-400">
                        {coupon.expiresAt ? (
                          <span className={isExpired ? "text-red-400" : ""}>
                            {formatDate(coupon.expiresAt)}
                          </span>
                        ) : (
                          <span className="text-zinc-600">Never</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {!coupon.isActive ? (
                          <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-zinc-500/10 text-zinc-400">
                            Inactive
                          </span>
                        ) : isExpired ? (
                          <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-400">
                            Expired
                          </span>
                        ) : isMaxedOut ? (
                          <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-400">
                            Maxed
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleActive(coupon)}
                            className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
                          >
                            {coupon.isActive ? "Deactivate" : "Activate"}
                          </button>
                          {coupon.currentUses === 0 && (
                            <button
                              onClick={() => handleDelete(coupon)}
                              className="px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded transition-colors"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {/* Expanded redemptions row */}
                    {isExpanded && hasRedemptions && (
                      <tr key={`${coupon.id}-redemptions`} className="bg-zinc-800/30">
                        <td colSpan={6} className="px-4 py-3">
                          <div className="ml-6 space-y-2">
                            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">
                              Redeemed by ({coupon.redemptions!.length})
                            </p>
                            <div className="grid gap-2">
                              {coupon.redemptions!.map((redemption) => (
                                <div
                                  key={redemption.id}
                                  className="flex items-center justify-between py-2 px-3 bg-zinc-700/30 rounded-lg"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-medium text-zinc-300">
                                      {(redemption.user.name || redemption.user.email)[0].toUpperCase()}
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-white">
                                        {redemption.user.name || 'Unnamed User'}
                                      </p>
                                      <p className="text-xs text-zinc-500">{redemption.user.email}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm text-emerald-400">+{coupon.creditAmount} credits</p>
                                    <p className="text-xs text-zinc-500">
                                      {new Date(redemption.redeemedAt).toLocaleDateString('en-IN', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700/50 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="px-6 py-5 border-b border-zinc-700/50">
              <h2 className="text-lg font-semibold text-white">Create Coupon</h2>
              <p className="text-sm text-zinc-500 mt-1">
                Generate a new coupon code for credits
              </p>
            </div>

            <form onSubmit={handleCreate}>
              <div className="p-6 space-y-4">
                {/* Code */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Coupon Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCoupon.code}
                      onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                      placeholder="e.g., WELCOME2025"
                      className="flex-1 px-4 py-2.5 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 font-mono"
                    />
                    <button
                      type="button"
                      onClick={generateRandomCode}
                      className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl transition-colors"
                    >
                      Generate
                    </button>
                  </div>
                </div>

                {/* Credit Amount */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Credit Amount
                  </label>
                  <input
                    type="number"
                    value={newCoupon.creditAmount}
                    onChange={(e) => setNewCoupon({ ...newCoupon, creditAmount: Number(e.target.value) })}
                    min={1}
                    className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                {/* Max Uses */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Max Redeems <span className="text-zinc-500 font-normal">(optional)</span>
                  </label>
                  <input
                    type="number"
                    value={newCoupon.maxUses}
                    onChange={(e) => setNewCoupon({ ...newCoupon, maxUses: e.target.value })}
                    min={1}
                    placeholder="Unlimited"
                    className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                {/* Expiry */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Expires <span className="text-zinc-500 font-normal">(optional)</span>
                  </label>
                  <input
                    type="date"
                    value={newCoupon.expiresAt}
                    onChange={(e) => setNewCoupon({ ...newCoupon, expiresAt: e.target.value })}
                    className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-zinc-700/50 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newCoupon.code}
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-zinc-900 font-medium rounded-xl transition-all disabled:cursor-not-allowed"
                >
                  {creating ? "Creating..." : "Create Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
