import { useState } from 'react';
import { generateSummary } from '../api/candidates';
import { Sparkles, RefreshCw, Loader2 } from 'lucide-react';

interface Props {
  candidateId: number;
  existingSummary: string | null;
  onGenerated: (summary: string) => void;
}

export default function AISummaryPanel({ candidateId, existingSummary, onGenerated }: Props) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [summary, setSummary] = useState<string | null>(existingSummary);

  async function handleGenerate() {
    setLoading(true);
    setError('');
    try {
      const res = await generateSummary(candidateId);
      setSummary(res.summary);
      onGenerated(res.summary);
    } catch {
      setError('Failed to generate summary. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-accent-subtle border border-accent/20 rounded-lg p-4 flex items-center gap-3">
        <Loader2 className="w-4 h-4 text-accent animate-spin shrink-0" />
        <p className="text-sm text-accent font-medium">Analyzing candidate profile…</p>
      </div>
    );
  }

  if (summary) {
    return (
      <div>
        <div className="bg-bg-subtle border border-border rounded-lg p-4 mb-3">
          <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">{summary}</p>
        </div>
        {error && (
          <p className="text-sm text-red-600 mb-3">{error}</p>
        )}
        <button
          id="regenerate-summary-btn"
          className="btn btn-ghost text-xs"
          onClick={handleGenerate}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Regenerate
        </button>
      </div>
    );
  }

  return (
    <div className="border border-dashed border-border rounded-lg p-6 text-center">
      <div className="w-9 h-9 rounded-lg bg-bg-subtle flex items-center justify-center mx-auto mb-3">
        <Sparkles className="w-4 h-4 text-text-muted" />
      </div>
      <p className="text-sm text-text-secondary mb-4">
        No summary generated yet. AI will analyze scores, notes, and skills to provide an objective overview.
      </p>
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      <button
        id="generate-summary-btn"
        className="btn btn-secondary"
        onClick={handleGenerate}
      >
        <Sparkles className="w-4 h-4" />
        Generate Summary
      </button>
    </div>
  );
}
