"use client";

import React, { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api-client";

interface ApiLog {
  id: string;
  provider: string;
  endpoint: string;
  statusCode: number;
  responseTimeMs: number;
  success: boolean;
  error: string | null;
  estimatedCost: number | null;
  createdAt: string;
  scrapeJobId: string | null;
  metadata: string | null;
}

interface ParsedMetadata {
  businessName?: string;
  city?: string;
  zone?: string;
  query?: string;
  promptLength?: number;
  responseLength?: number;
  foundEmail?: string | null;
  foundPhone?: string | null;
  foundOwner?: string | null;
  radiusMeters?: number;
}

interface ApiStats {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  totalCost: number;
  byProvider: Record<string, { calls: number; cost: number; errors: number }>;
}

const providerColors: Record<string, string> = {
  GOOGLE_PLACES: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  PERPLEXITY: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  GOOGLE_MAPS: "bg-green-500/20 text-green-400 border-green-500/30",
  LIGHTHOUSE: "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

function parseMetadata(metadata: string | null): ParsedMetadata | null {
  if (!metadata) return null;
  try {
    return JSON.parse(metadata);
  } catch {
    return null;
  }
}

export default function ApiLogsPage() {
  const [stats, setStats] = useState<ApiStats | null>(null);
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [statsData, logsData] = await Promise.all([
        apiClient.getApiLogsStats(
          selectedProvider ? { provider: selectedProvider } : undefined,
        ),
        apiClient.getRecentApiLogs(200),
      ]);
      setStats(statsData);
      setLogs(
        selectedProvider
          ? logsData.logs.filter((l) => l.provider === selectedProvider)
          : logsData.logs,
      );
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load API logs");
    } finally {
      setLoading(false);
    }
  }, [selectedProvider]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">API Call Logs</h1>
          <p className="text-zinc-400 mt-1">
            Monitor external API calls and costs
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-zinc-400">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-zinc-600 bg-zinc-800 text-indigo-500 focus:ring-indigo-500"
            />
            Auto-refresh
          </label>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="text-sm text-zinc-400">Total Calls</div>
            <div className="text-2xl font-bold text-white mt-1">
              {stats.totalCalls.toLocaleString()}
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="text-sm text-zinc-400">Success Rate</div>
            <div className="text-2xl font-bold text-green-400 mt-1">
              {stats.totalCalls > 0
                ? ((stats.successfulCalls / stats.totalCalls) * 100).toFixed(1)
                : 0}
              %
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="text-sm text-zinc-400">Failed Calls</div>
            <div className="text-2xl font-bold text-red-400 mt-1">
              {stats.failedCalls}
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="text-sm text-zinc-400">Estimated Cost</div>
            <div className="text-2xl font-bold text-amber-400 mt-1">
              ${stats.totalCost.toFixed(2)}
            </div>
          </div>
        </div>
      )}

      {/* Provider Breakdown */}
      {stats && Object.keys(stats.byProvider).length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-white mb-4">By Provider</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Object.entries(stats.byProvider).map(([provider, data]) => (
              <button
                key={provider}
                onClick={() =>
                  setSelectedProvider(
                    selectedProvider === provider ? null : provider,
                  )
                }
                className={`p-4 rounded-lg border transition-all ${
                  selectedProvider === provider ? "ring-2 ring-indigo-500" : ""
                } ${providerColors[provider] || "bg-zinc-800 text-zinc-300 border-zinc-700"}`}
              >
                <div className="font-medium">{provider}</div>
                <div className="text-sm opacity-80 mt-2">
                  {data.calls} calls • ${data.cost.toFixed(3)}
                </div>
                {data.errors > 0 && (
                  <div className="text-sm text-red-400 mt-1">
                    {data.errors} errors
                  </div>
                )}
              </button>
            ))}
          </div>
          {selectedProvider && (
            <button
              onClick={() => setSelectedProvider(null)}
              className="mt-3 text-sm text-indigo-400 hover:text-indigo-300"
            >
              Clear filter
            </button>
          )}
        </div>
      )}

      {/* Recent Logs Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-white">
            Recent API Calls
            {selectedProvider && (
              <span className="ml-2 text-sm font-normal text-zinc-400">
                (filtered by {selectedProvider})
              </span>
            )}
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            Click on a row to see details
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
                  Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
                  Provider
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
                  Details
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
                  Response
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
                  Cost
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-zinc-500"
                  >
                    No API calls logged yet. Run a scrape job to see logs here.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const metadata = parseMetadata(log.metadata);
                  const isExpanded = expandedLog === log.id;

                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        onClick={() =>
                          setExpandedLog(isExpanded ? null : log.id)
                        }
                        className="hover:bg-zinc-800/50 cursor-pointer"
                      >
                        <td className="px-4 py-3 text-sm text-zinc-400">
                          <div>{formatTime(log.createdAt)}</div>
                          <div className="text-xs text-zinc-500">
                            {formatDate(log.createdAt)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded border ${
                              providerColors[log.provider] ||
                              "bg-zinc-800 text-zinc-300 border-zinc-700"
                            }`}
                          >
                            {log.provider}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {/* Show business name or zone for quick context */}
                          {metadata?.businessName ? (
                            <div className="text-zinc-200 font-medium">
                              {metadata.businessName}
                            </div>
                          ) : metadata?.zone ? (
                            <div className="text-zinc-200">
                              Zone: {metadata.zone}
                            </div>
                          ) : (
                            <div className="text-zinc-400 truncate max-w-xs">
                              {log.endpoint}
                            </div>
                          )}
                          {metadata?.city && (
                            <div className="text-xs text-zinc-500">
                              {metadata.city}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {log.success ? (
                            <span className="inline-flex items-center gap-1 text-sm text-green-400">
                              <span className="w-2 h-2 bg-green-400 rounded-full" />
                              {log.statusCode}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-sm text-red-400">
                              <span className="w-2 h-2 bg-red-400 rounded-full" />
                              {log.statusCode || "Error"}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-400">
                          {log.responseTimeMs}ms
                        </td>
                        <td className="px-4 py-3 text-sm text-amber-400">
                          {log.estimatedCost
                            ? `$${log.estimatedCost.toFixed(4)}`
                            : "-"}
                        </td>
                      </tr>
                      {/* Expanded Details Row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="px-4 py-4 bg-zinc-800/30">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Request Info */}
                              <div>
                                <h4 className="text-sm font-medium text-zinc-300 mb-2">
                                  Request
                                </h4>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-zinc-500">
                                      Endpoint:
                                    </span>
                                    <span className="text-zinc-300">
                                      {log.endpoint}
                                    </span>
                                  </div>
                                  {metadata?.query && (
                                    <div className="flex justify-between">
                                      <span className="text-zinc-500">
                                        Query:
                                      </span>
                                      <span className="text-zinc-300">
                                        {metadata.query}
                                      </span>
                                    </div>
                                  )}
                                  {metadata?.zone && (
                                    <div className="flex justify-between">
                                      <span className="text-zinc-500">
                                        Zone:
                                      </span>
                                      <span className="text-zinc-300">
                                        {metadata.zone}
                                      </span>
                                    </div>
                                  )}
                                  {metadata?.businessName && (
                                    <div className="flex justify-between">
                                      <span className="text-zinc-500">
                                        Business:
                                      </span>
                                      <span className="text-zinc-300">
                                        {metadata.businessName}
                                      </span>
                                    </div>
                                  )}
                                  {metadata?.city && (
                                    <div className="flex justify-between">
                                      <span className="text-zinc-500">
                                        City:
                                      </span>
                                      <span className="text-zinc-300">
                                        {metadata.city}
                                      </span>
                                    </div>
                                  )}
                                  {metadata?.promptLength && (
                                    <div className="flex justify-between">
                                      <span className="text-zinc-500">
                                        Prompt Length:
                                      </span>
                                      <span className="text-zinc-300">
                                        {metadata.promptLength} chars
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Response Info */}
                              <div>
                                <h4 className="text-sm font-medium text-zinc-300 mb-2">
                                  Response
                                </h4>
                                <div className="space-y-1 text-sm">
                                  {log.error ? (
                                    <div className="text-red-400 bg-red-500/10 p-2 rounded">
                                      {log.error}
                                    </div>
                                  ) : (
                                    <>
                                      {metadata?.responseLength !==
                                        undefined && (
                                        <div className="flex justify-between">
                                          <span className="text-zinc-500">
                                            Response Length:
                                          </span>
                                          <span className="text-zinc-300">
                                            {metadata.responseLength} chars
                                          </span>
                                        </div>
                                      )}
                                      {/* Perplexity found data */}
                                      {log.provider === "PERPLEXITY" && (
                                        <div className="mt-2 p-2 bg-purple-500/10 rounded border border-purple-500/20">
                                          <div className="text-xs text-purple-300 font-medium mb-1">
                                            Found Data:
                                          </div>
                                          <div className="space-y-1">
                                            <div className="flex justify-between">
                                              <span className="text-zinc-500">
                                                Email:
                                              </span>
                                              <span
                                                className={
                                                  metadata?.foundEmail
                                                    ? "text-green-400"
                                                    : "text-zinc-500"
                                                }
                                              >
                                                {metadata?.foundEmail ||
                                                  "Not found"}
                                              </span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-zinc-500">
                                                Phone:
                                              </span>
                                              <span
                                                className={
                                                  metadata?.foundPhone
                                                    ? "text-green-400"
                                                    : "text-zinc-500"
                                                }
                                              >
                                                {metadata?.foundPhone ||
                                                  "Not found"}
                                              </span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-zinc-500">
                                                Owner:
                                              </span>
                                              <span
                                                className={
                                                  metadata?.foundOwner
                                                    ? "text-green-400"
                                                    : "text-zinc-500"
                                                }
                                              >
                                                {metadata?.foundOwner ||
                                                  "Not found"}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
