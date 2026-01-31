"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Password change form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);

  // GDPR states
  const [exportingData, setExportingData] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await apiClient.getCurrentUser();
        setUser(data.user);
      } catch {
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setChangingPassword(true);

    try {
      await apiClient.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      toast.success("Password updated successfully");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleExportData = useCallback(async () => {
    setExportingData(true);

    try {
      const blob = await apiClient.exportUserData();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `user-data-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Your data export has been downloaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to export data");
    } finally {
      setExportingData(false);
    }
  }, []);

  const handleDeleteAccount = useCallback(async () => {
    if (deleteConfirmText !== "DELETE") {
      toast.error("Please type DELETE to confirm");
      return;
    }

    setDeletingAccount(true);

    try {
      const result = await apiClient.requestAccountDeletion(deleteReason || undefined);

      toast.success(result.message);
      setShowDeleteModal(false);
      setDeleteConfirmText("");
      setDeleteReason("");

      toast.info(
        `Your account will be permanently deleted on ${new Date(result.deletionScheduledFor).toLocaleDateString()}. You can cancel this within ${result.gracePeriodDays} days.`,
        { duration: 10000 }
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to request account deletion");
    } finally {
      setDeletingAccount(false);
    }
  }, [deleteConfirmText, deleteReason]);

  const closeDeleteModal = useCallback(() => {
    if (!deletingAccount) {
      setShowDeleteModal(false);
      setDeleteConfirmText("");
      setDeleteReason("");
    }
  }, [deletingAccount]);

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
            className="px-3 py-1.5 text-[13px] font-medium rounded bg-gray-700 text-white"
          >
            Profile
          </Link>
          <Link
            href="/dashboard/settings/credits"
            className="px-3 py-1.5 text-[13px] font-medium rounded text-gray-400 hover:text-white transition-colors"
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
        {/* Profile Section */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-200">Profile</h2>
            <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-blue-500/10 text-blue-400 capitalize">
              {user?.role?.toLowerCase() || "user"}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-semibold text-accent">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">Name</label>
                <div className="h-9 px-3 flex items-center rounded-md border border-gray-800 bg-gray-800/50 text-[13px] text-gray-200">
                  {user?.name || "N/A"}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">Email</label>
                <div className="h-9 px-3 flex items-center rounded-md border border-gray-800 bg-gray-800/50 text-[13px] text-gray-200 truncate">
                  {user?.email || "N/A"}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">Member Since</label>
                <div className="h-9 px-3 flex items-center rounded-md border border-gray-800 bg-gray-800/50 text-[13px] text-gray-200">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                      })
                    : "N/A"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Password Section */}
        <form onSubmit={handlePasswordChange} className="p-4 space-y-3">
          <h2 className="text-sm font-medium text-gray-200">Change Password</h2>

          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1 flex-1 min-w-[140px]">
              <label className="text-xs font-medium text-gray-500">Current</label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                }
                className="w-full h-9 px-3 rounded-md border border-gray-800 bg-gray-900 text-[13px] text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-700"
                placeholder="Current"
                required
              />
            </div>
            <div className="space-y-1 flex-1 min-w-[140px]">
              <label className="text-xs font-medium text-gray-500">New</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                }
                className="w-full h-9 px-3 rounded-md border border-gray-800 bg-gray-900 text-[13px] text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-700"
                placeholder="New password"
                minLength={8}
                required
              />
            </div>
            <div className="space-y-1 flex-1 min-w-[140px]">
              <label className="text-xs font-medium text-gray-500">Confirm</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                }
                className="w-full h-9 px-3 rounded-md border border-gray-800 bg-gray-900 text-[13px] text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-700"
                placeholder="Confirm"
                minLength={8}
                required
              />
            </div>
            <button
              type="submit"
              disabled={changingPassword}
              className="h-9 px-4 rounded-md bg-white text-gray-900 hover:bg-gray-100 disabled:bg-gray-700 disabled:text-gray-500 text-[13px] font-medium transition-colors disabled:cursor-not-allowed inline-flex items-center gap-1.5"
            >
              {changingPassword ? (
                <>
                  <LoadingSpinner className="h-3.5 w-3.5" />
                  Updating...
                </>
              ) : (
                "Update"
              )}
            </button>
          </div>
        </form>

        {/* Privacy & Data Section */}
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldIcon className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-medium text-gray-200">Privacy & Data</h2>
            </div>
            <button
              onClick={handleExportData}
              disabled={exportingData}
              className="h-9 px-3 rounded-md border border-gray-700 text-[13px] text-gray-300 hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
            >
              {exportingData ? (
                <>
                  <LoadingSpinner className="h-3.5 w-3.5" />
                  Exporting...
                </>
              ) : (
                <>
                  <DownloadIcon className="h-3.5 w-3.5" />
                  Export Data
                </>
              )}
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="p-4 bg-red-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <WarningIcon className="h-4 w-4 text-red-400" />
              <div>
                <div className="text-[13px] font-medium text-gray-300">Delete Account</div>
                <div className="text-xs text-gray-500">30-day grace period before permanent deletion</div>
              </div>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="h-9 px-3 rounded-md border border-red-500/30 text-[13px] text-red-400 hover:bg-red-500/10 transition-colors inline-flex items-center gap-1.5"
            >
              <TrashIcon className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        </div>
      </motion.div>

      {/* Delete Account Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[1000] flex items-center justify-center p-4"
            onClick={closeDeleteModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="border border-gray-800 rounded-lg bg-gray-900 max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-gray-800/50 bg-red-500/5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                    <WarningIcon className="h-4 w-4 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-100">Delete Account</h3>
                    <p className="text-xs text-gray-500">This action cannot be undone</p>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-4 space-y-3">
                <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20">
                  <p className="text-xs text-red-300 font-medium mb-1">This will delete:</p>
                  <ul className="text-xs text-red-200/70 space-y-0.5 ml-3 list-disc">
                    <li>Account and profile</li>
                    <li>All leads and prospects</li>
                    <li>Credit balance and history</li>
                    <li>Scraping jobs and results</li>
                  </ul>
                </div>

                <div className="flex items-start gap-2 p-2 rounded-md bg-blue-500/10 border border-blue-500/20">
                  <InfoIcon className="h-3.5 w-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-300">
                    <strong>30-day grace period</strong> to cancel before permanent deletion.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">Reason (optional)</label>
                  <textarea
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    className="w-full h-16 px-3 py-2 rounded-md border border-gray-800 bg-gray-900 text-[13px] text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-700 resize-none"
                    placeholder="Why are you leaving?"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">
                    Type <span className="text-red-400 font-mono">DELETE</span> to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                    className="w-full h-9 px-3 rounded-md border border-gray-800 bg-gray-900 text-[13px] text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-red-500/50 font-mono"
                    placeholder="DELETE"
                    autoComplete="off"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-gray-800/50 flex justify-end gap-2">
                <button
                  onClick={closeDeleteModal}
                  disabled={deletingAccount}
                  className="h-9 px-3 rounded-md text-[13px] text-gray-400 hover:text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deletingAccount || deleteConfirmText !== "DELETE"}
                  className="h-9 px-3 rounded-md bg-red-500 text-white hover:bg-red-600 text-[13px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                >
                  {deletingAccount ? (
                    <>
                      <LoadingSpinner className="h-3.5 w-3.5" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <TrashIcon className="h-3.5 w-3.5" />
                      Delete Account
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Icons
function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}
