import { HttpErrorResponse } from '@angular/common/http';

type ProblemBody = {
  code?: unknown;
  detail?: unknown;
  title?: unknown;
  errors?: Record<string, unknown>;
};

const publicServerCodes = new Set([
  'exchange_rate_provider_unavailable',
  'exchange_rate_response_invalid',
]);

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof HttpErrorResponse)) {
    return error instanceof Error && error.message.startsWith('You are offline.')
      ? error.message
      : fallback;
  }
  if (error.status === 0) return 'No connection. Check your network and try again.';

  const body: ProblemBody = error.error && typeof error.error === 'object' ? error.error : {};
  if (error.status >= 500 && !publicServerCodes.has(String(body.code ?? ''))) {
    return 'Something went wrong on the server. Please try again.';
  }

  if (typeof body.detail === 'string' && body.detail.trim()) return body.detail.trim();
  for (const value of Object.values(body.errors ?? {})) {
    if (!Array.isArray(value)) continue;
    const fieldError = value.find(
      (item: unknown): item is string => typeof item === 'string' && !!item.trim(),
    );
    if (fieldError) return fieldError.trim();
  }
  if (typeof error.error === 'string' && error.error.trim()) return error.error.trim();
  if (typeof body.title === 'string' && body.title.trim()) return body.title.trim();
  return fallback;
}
