import { useState } from 'react';
import { generateSummary } from '../api/candidates';
import { Bot, RefreshCw, Loader2 } from 'lucide-react';

interface Props {
  candidateId: number;
  existingSummary: string | null;
  onGenerated: (summary: string) => void;
}

export default function AISummaryPanel({ candidateId, existingSummary, onGenerated }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
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

  return (
    <div>
      {loading ? (
        <div className="bg-[#F9F9F9] rounded-2xl p-6 border border-border-light shadow-inset-soft">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-text-primary animate-spin shrink-0" />
            <p className="text-sm font-medium text-text-secondary">
              Analyzing candidate data…
            </p>
          </div>
        </div>
      ) : summary ? (
        <div>
          <div className="bg-[#F9F9F9] rounded-2xl p-6 md:p-8 mb-6 border border-border-light shadow-inset-soft">
            <p className="text-[15px] leading-relaxed text-text-primary whitespace-pre-wrap">{summary}</p>
          </div>
          <button
            id="regenerate-summary-btn"
            className="btn btn-ghost text-xs inline-flex items-center gap-2"
            onClick={handleGenerate}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Regenerate Analysis
          </button>
        </div>
      ) : (
        <div className="bg-[#F9F9F9] rounded-2xl p-8 border border-border-light text-center shadow-inset-soft">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-border-light">
            <Bot className="w-6 h-6 text-text-muted" />
          </div>
          <p className="text-sm font-medium text-text-secondary mb-6 max-w-md mx-auto">
            No AI summary generated. The system can analyze the candidate's scores, notes, and profile to provide an objective summary.
          </p>
          {error && <div className="bg-status-rej-bg text-status-rej-fg px-4 py-3 rounded-2xl text-sm font-medium mb-4">{error}</div>}
          <button
            id="generate-summary-btn"
            className="btn btn-secondary inline-flex items-center gap-2"
            onClick={handleGenerate}
          >
            <Bot className="w-4 h-4" />
            Generate Summary
          </button>
        </div>
      )}
    </div>
  );
}
