import axios, { AxiosError } from 'axios';

const DEFAULT_MAX = 720;

function trimMessage(s: string, max: number): string {
  const t = s.replace(/\s+/g, ' ').trim();
  if (t.length <= max) {
    return t;
  }
  return `${t.slice(0, max - 1)}…`;
}

function detailFromResponseData(data: unknown): string | null {
  if (data == null) {
    return null;
  }
  if (typeof data === 'string' && data.trim()) {
    return data.trim();
  }
  if (typeof data !== 'object') {
    return null;
  }
  const o = data as Record<string, unknown>;
  if ('detail' in o) {
    const d = o.detail;
    if (typeof d === 'string' && d.trim()) {
      return d.trim();
    }
    if (Array.isArray(d)) {
      const parts = d
        .map((item) => {
          if (typeof item === 'string') {
            return item;
          }
          if (item && typeof item === 'object' && 'msg' in item) {
            const msg = (item as { msg?: unknown }).msg;
            return typeof msg === 'string' ? msg : JSON.stringify(item);
          }
          return JSON.stringify(item);
        })
        .filter(Boolean);
      if (parts.length) {
        return parts.join('; ');
      }
    }
  }
  if ('message' in o && typeof o.message === 'string' && o.message.trim()) {
    return o.message.trim();
  }
  return null;
}

function contextualHint(detail: string, status?: number): string | null {
  if (status === 401 || status === 403) {
    return 'Try signing in again or check your account permissions.';
  }
  if (status === 404) {
    return 'The resource may have been deleted or the link is outdated.';
  }
  const lower = detail.toLowerCase();
  if (/connection error|connection refused|econnrefused|network is unreachable|name or service not known|getaddrinfo|enotfound|tls|ssl handshake|certificate/.test(lower)) {
    return 'The U-Probe server could not reach the model API. Check outbound network, firewall, optional proxy in Agent settings (server-side), and API base URL.';
  }
  if (/timeout|timed out|econnaborted|deadline exceeded/.test(lower)) {
    return 'The upstream service did not respond in time; try again later or increase server timeout if applicable.';
  }
  if (/invalid api key|incorrect api key|authentication|api key/.test(lower)) {
    return 'Verify the API key in Agent configuration.';
  }
  if (/429|rate limit|too many requests/.test(lower)) {
    return 'Provider rate limit reached; wait and retry or reduce usage.';
  }
  if (/litellm|all \d+ model\(s\) failed|model\(s\) failed|internalservererror/.test(lower)) {
    return 'The model provider failed on the server after retries. Confirm model name, provider status, API key, and that the server can reach the internet or proxy.';
  }
  if (status === 502 || status === 503 || status === 504) {
    return 'The API or upstream service is temporarily unavailable.';
  }
  return null;
}

/**
 * Turns axios/network errors and FastAPI `{ detail: ... }` bodies into a single user-facing string.
 */
export function formatApiError(error: unknown, maxLen: number = DEFAULT_MAX): string {
  if (axios.isAxiosError(error)) {
    const ax = error as AxiosError<{ detail?: unknown; message?: string }>;
    if (ax.code === 'ECONNABORTED' || /timeout/i.test(ax.message || '')) {
      return trimMessage(
        'Request timed out. The server or model API did not finish in time.',
        maxLen
      );
    }
    if (!ax.response) {
      if (ax.message === 'Network Error') {
        return trimMessage(
          'Cannot reach the API server. Ensure the backend is running and VITE_API_BASE_URL (or dev proxy) points to it.',
          maxLen
        );
      }
      return trimMessage(ax.message || 'Network request failed', maxLen);
    }
    const status = ax.response.status;
    const rawFull = detailFromResponseData(ax.response.data);
    const rawShort = rawFull ? trimMessage(rawFull, Math.min(380, Math.max(120, maxLen - 200))) : null;
    let base: string;
    if (rawShort) {
      base = `HTTP ${status}: ${rawShort}`;
    } else {
      base = `Request failed (HTTP ${status})`;
    }
    const hint = contextualHint(`${rawFull || ''} ${status}`, status);
    const combined = hint ? `${base} — ${hint}` : base;
    return trimMessage(combined, maxLen);
  }
  if (error instanceof Error) {
    return trimMessage(error.message || 'Unexpected error', maxLen);
  }
  return trimMessage('Unexpected error', maxLen);
}
