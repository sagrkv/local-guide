"use client";

import { useEffect, useState, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  creditBalance: number;
  createdAt: string;
  updatedAt: string;
  _count: {
    ownedLeads: number;
    scrapeJobs: number;
    creditTransactions: number;
  };
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface UserDetails extends User {
  recentTransactions: Array<{
    id: string;
    amount: number;
    type: string;
    description: string | null;
    reference: string | null;
    createdAt: string;
  }>;
  recentScrapeJobs: Array<{
    id: string;
    type: string;
    query: string;
    status: string;
    leadsCreated: number;
    createdAt: string;
  }>;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditReason, setCreditReason] = useState("");
  const [creditAction, setCreditAction] = useState<"add" | "deduct">("add");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.getAdminUsers({
        search: search || undefined,
        page,
        limit: 20,
      });
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleViewUser = async (userId: string) => {
    try {
      const user = await apiClient.getAdminUserDetails(userId);
      setSelectedUser(user);
      setShowModal(true);
    } catch (error) {
      toast.error("Failed to load user details");
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await apiClient.updateAdminUser(user.id, { isActive: !user.isActive });
      toast.success(
        user.isActive ? "User deactivated" : "User activated"
      );
      fetchUsers();
    } catch (error) {
      toast.error("Failed to update user status");
    }
  };

  const handleCreditsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    const amount = parseInt(creditAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!creditReason.trim()) {
      toast.error("Please provide a reason");
      return;
    }

    setIsSubmitting(true);
    try {
      if (creditAction === "add") {
        await apiClient.addUserCredits(selectedUser.id, amount, creditReason);
        toast.success(`Added ${amount} credits to ${selectedUser.name}`);
      } else {
        await apiClient.deductUserCredits(selectedUser.id, amount, creditReason);
        toast.success(`Deducted ${amount} credits from ${selectedUser.name}`);
      }
      setShowCreditsModal(false);
      setCreditAmount("");
      setCreditReason("");
      fetchUsers();
      // Refresh selected user details
      const updatedUser = await apiClient.getAdminUserDetails(selectedUser.id);
      setSelectedUser(updatedUser);
    } catch (error) {
      toast.error("Failed to update credits");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">User Management</h1>
          <p className="text-gray-400 text-sm">
            Manage users, credits, and permissions
          </p>
        </div>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-accent hover:bg-accent-light text-black font-medium rounded-lg transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Stats Cards */}
      {pagination && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
            <p className="text-xs font-medium text-gray-400">Total Users</p>
            <p className="text-xl font-semibold mt-0.5">{pagination.total}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
            <p className="text-xs font-medium text-gray-400">Active Users</p>
            <p className="text-xl font-semibold mt-0.5 text-green-400">
              {users.filter((u) => u.isActive).length}
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
            <p className="text-xs font-medium text-gray-400">Admins</p>
            <p className="text-xl font-semibold mt-0.5 text-purple-400">
              {users.filter((u) => u.role === "ADMIN").length}
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
            <p className="text-xs font-medium text-gray-400">Total Leads</p>
            <p className="text-xl font-semibold mt-0.5 text-blue-400">
              {users.reduce((sum, u) => sum + u._count.ownedLeads, 0)}
            </p>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent border-t-transparent" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-400">
            No users found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900/50">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Credits
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Leads
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Jobs
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center text-black text-sm font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-[13px] font-medium text-white">{user.name}</p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[11px] font-medium ${
                          user.role === "ADMIN"
                            ? "bg-purple-500/20 text-purple-400"
                            : "bg-blue-500/20 text-blue-400"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[13px] text-accent">
                        {user.creditBalance.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-gray-300">
                      {user._count.ownedLeads}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-gray-300">
                      {user._count.scrapeJobs}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleStatus(user)}
                        className={`px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
                          user.isActive
                            ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                            : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                        }`}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleViewUser(user.id)}
                        className="text-xs text-accent hover:text-accent-light transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700">
            <p className="text-sm text-gray-400">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
              {pagination.total} users
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-3 py-1 bg-gray-700 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === pagination.totalPages}
                className="px-3 py-1 bg-gray-700 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] p-4">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">User Details</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center text-black text-2xl font-bold">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{selectedUser.name}</h3>
                  <p className="text-gray-400">{selectedUser.email}</p>
                  <div className="flex gap-2 mt-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedUser.role === "ADMIN"
                          ? "bg-purple-500/20 text-purple-400"
                          : "bg-blue-500/20 text-blue-400"
                      }`}
                    >
                      {selectedUser.role}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedUser.isActive
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {selectedUser.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-900 rounded-lg p-4">
                  <p className="text-sm text-gray-400">Credits</p>
                  <p className="text-2xl font-bold text-accent">
                    {selectedUser.creditBalance.toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-900 rounded-lg p-4">
                  <p className="text-sm text-gray-400">Leads</p>
                  <p className="text-2xl font-bold">
                    {selectedUser._count.ownedLeads}
                  </p>
                </div>
                <div className="bg-gray-900 rounded-lg p-4">
                  <p className="text-sm text-gray-400">Scrape Jobs</p>
                  <p className="text-2xl font-bold">
                    {selectedUser._count.scrapeJobs}
                  </p>
                </div>
                <div className="bg-gray-900 rounded-lg p-4">
                  <p className="text-sm text-gray-400">Transactions</p>
                  <p className="text-2xl font-bold">
                    {selectedUser._count.creditTransactions}
                  </p>
                </div>
              </div>

              {/* Credit Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setCreditAction("add");
                    setShowCreditsModal(true);
                  }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
                >
                  Add Credits
                </button>
                <button
                  onClick={() => {
                    setCreditAction("deduct");
                    setShowCreditsModal(true);
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
                >
                  Deduct Credits
                </button>
              </div>

              {/* Recent Transactions */}
              <div>
                <h4 className="font-semibold mb-3">Recent Transactions</h4>
                {selectedUser.recentTransactions.length === 0 ? (
                  <p className="text-gray-400 text-sm">No transactions yet</p>
                ) : (
                  <div className="space-y-2">
                    {selectedUser.recentTransactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between bg-gray-900 rounded-lg px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {tx.description || tx.type}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatDateTime(tx.createdAt)}
                          </p>
                        </div>
                        <span
                          className={`font-mono font-bold ${
                            tx.amount > 0 ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {tx.amount > 0 ? "+" : ""}
                          {tx.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Scrape Jobs */}
              <div>
                <h4 className="font-semibold mb-3">Recent Scrape Jobs</h4>
                {selectedUser.recentScrapeJobs.length === 0 ? (
                  <p className="text-gray-400 text-sm">No scrape jobs yet</p>
                ) : (
                  <div className="space-y-2">
                    {selectedUser.recentScrapeJobs.map((job) => (
                      <div
                        key={job.id}
                        className="flex items-center justify-between bg-gray-900 rounded-lg px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-medium">{job.query}</p>
                          <p className="text-xs text-gray-400">
                            {job.type} - {formatDateTime(job.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              job.status === "COMPLETED"
                                ? "bg-green-500/20 text-green-400"
                                : job.status === "FAILED"
                                  ? "bg-red-500/20 text-red-400"
                                  : "bg-yellow-500/20 text-yellow-400"
                            }`}
                          >
                            {job.status}
                          </span>
                          <p className="text-xs text-gray-400 mt-1">
                            {job.leadsCreated} leads
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Credits Modal */}
      {showCreditsModal && selectedUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1100] p-4">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 max-w-md w-full">
            <div className="border-b border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                {creditAction === "add" ? "Add Credits" : "Deduct Credits"}
              </h2>
              <button
                onClick={() => setShowCreditsModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreditsSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  min="1"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Reason
                </label>
                <textarea
                  value={creditReason}
                  onChange={(e) => setCreditReason(e.target.value)}
                  placeholder="Enter reason for this adjustment"
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent resize-none"
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreditsModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${
                    creditAction === "add"
                      ? "bg-green-600 hover:bg-green-500"
                      : "bg-red-600 hover:bg-red-500"
                  }`}
                >
                  {isSubmitting
                    ? "Processing..."
                    : creditAction === "add"
                      ? "Add Credits"
                      : "Deduct Credits"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
