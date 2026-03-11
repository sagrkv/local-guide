/**
 * API Call Logger
 *
 * Tracks external API calls for cost monitoring and debugging.
 * Logs to console only (database logging will be added when needed).
 */

export type ApiProvider =
  | "GOOGLE_PLACES"
  | "ANTHROPIC";

export interface ApiCallLogEntry {
  provider: ApiProvider;
  endpoint: string;
  method: "GET" | "POST";
  statusCode: number;
  responseTimeMs: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, unknown>;
}

// Cost per API call (approximate)
const API_COSTS: Record<ApiProvider, number> = {
  GOOGLE_PLACES: 0.032, // Text Search $0.032 per call
  ANTHROPIC: 0.01, // ~$0.01 per call (estimate, varies by model)
};

/**
 * Log an API call
 */
export async function logApiCall(log: ApiCallLogEntry): Promise<void> {
  // Only count cost for successful calls
  const cost = log.success ? API_COSTS[log.provider] || 0 : 0;

  // Console log for immediate visibility
  const status = log.success ? "OK" : "FAIL";
  const costStr = cost > 0 ? ` ($${cost.toFixed(4)})` : "";
  console.log(
    `[API ${status}] ${log.provider} ${log.method} ${log.endpoint} - ${log.statusCode} (${log.responseTimeMs}ms)${costStr}`,
  );

  if (!log.success && log.error) {
    console.error(`[API ERROR] ${log.provider}: ${log.error}`);
  }
}

/**
 * Wrapper to measure and log API calls
 */
export async function withApiLogging<T>(
  provider: ApiProvider,
  endpoint: string,
  method: "GET" | "POST",
  apiCall: () => Promise<{ response: Response; data: T }>,
): Promise<T> {
  const startTime = Date.now();

  try {
    const { response, data } = await apiCall();
    const responseTimeMs = Date.now() - startTime;

    await logApiCall({
      provider,
      endpoint,
      method,
      statusCode: response.status,
      responseTimeMs,
      success: response.ok,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    });

    return data;
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;

    await logApiCall({
      provider,
      endpoint,
      method,
      statusCode: 0,
      responseTimeMs,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    throw error;
  }
}
