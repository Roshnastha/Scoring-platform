/**
 * Shared UI utility helpers.
 */

/** Returns up to 2 initials from a full name. */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/** Tailwind color classes for each candidate status dot. */
export const STATUS_DOT_COLORS: Record<string, string> = {
  new: 'bg-blue-400',
  reviewed: 'bg-yellow-400',
  hired: 'bg-green-400',
  rejected: 'bg-red-400',
  archived: 'bg-gray-400',
};

/** Narrows an unknown catch value to a human-readable error string. */
export function getErrorMessage(err: unknown, fallback = 'An unexpected error occurred.'): string {
  if (
    err &&
    typeof err === 'object' &&
    'response' in err &&
    err.response &&
    typeof err.response === 'object' &&
    'data' in err.response &&
    err.response.data &&
    typeof err.response.data === 'object' &&
    'detail' in err.response.data
  ) {
    return String((err.response.data as { detail: string }).detail);
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
