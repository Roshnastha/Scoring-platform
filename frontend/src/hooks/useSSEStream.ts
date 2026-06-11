import { useEffect, useRef, useState } from 'react';
import type { Score } from '../types';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1';

interface SSEPayload {
  event?: string;
  scores?: Score[];
}

interface UseSSEStreamOptions {
  candidateId: number | undefined;
  /** Called whenever a fresh scores snapshot arrives from the server. */
  onScores: (scores: Score[]) => void;
}

/**
 * Opens an EventSource SSE connection to GET /candidates/{id}/stream.
 * Returns `isLive` — true while the connection is active.
 *
 * EventSource cannot set the Authorization header, so the JWT is passed
 * as a `?token=` query parameter (backed by `get_current_user_sse` on the server).
 *
 * The connection is automatically torn down when the component unmounts
 * or when `candidateId` changes.
 */
export function useSSEStream({ candidateId, onScores }: UseSSEStreamOptions): boolean {
  const [isLive, setIsLive] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!candidateId) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    const url = `${API_BASE}/candidates/${candidateId}/stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    esRef.current = es;

    // Only set state inside callbacks — never synchronously in the effect body
    es.onopen = () => setIsLive(true);

    es.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data as string) as SSEPayload;
        if (data.event === 'done') {
          es.close();
          setIsLive(false);
          return;
        }
        if (data.scores) {
          onScores(data.scores);
        }
      } catch {
        /* ignore malformed frames */
      }
    };

    es.onerror = () => {
      es.close();
      setIsLive(false);
    };

    return () => {
      es.close();
      setIsLive(false);
    };
    // onScores is intentionally excluded — callers should memoize it with useCallback if needed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidateId]);

  return isLive;
}
