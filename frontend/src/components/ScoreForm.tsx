import { useState, type FormEvent } from 'react';
import { submitScore } from '../api/candidates';
import { getErrorMessage } from '../utils';
import { CheckCircle2 } from 'lucide-react';

const CATEGORIES = ['Technical', 'Communication', 'Problem Solving', 'Culture Fit', 'Leadership'];

interface Props {
  candidateId: number;
  onSubmitted: () => void;
}

export default function ScoreForm({ candidateId, onSubmitted }: Props) {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [score,    setScore]    = useState(0);
  const [note,     setNote]     = useState('');
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState('');
  const [error,    setError]    = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!score) { setError('Please select a score (1–5).'); return; }
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await submitScore(candidateId, { category, score, note: note || undefined });
      setSuccess('Score submitted!');
      setScore(0);
      setNote('');
      onSubmitted();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to submit score.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} id="score-form">
      {success && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2.5 rounded-lg text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-text-secondary" htmlFor="score-category">
          Category
        </label>
        <select
          id="score-category"
          className="form-control cursor-pointer"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-text-secondary">Score</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              className={`flex-1 h-9 rounded-lg text-sm font-semibold transition-all border ${
                n <= score
                  ? 'bg-accent text-white border-accent'
                  : 'bg-white text-text-muted border-border hover:border-border-strong hover:text-text-secondary'
              }`}
              onClick={() => setScore(n)}
              aria-label={`Score ${n}`}
              id={`star-${n}`}
            >
              {n}
            </button>
          ))}
        </div>
        {score > 0 && (
          <p className="text-xs text-text-muted">
            {['', 'Poor', 'Below Average', 'Average', 'Good', 'Excellent'][score]}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-text-secondary" htmlFor="score-note">
          Note <span className="font-normal text-text-muted">(optional)</span>
        </label>
        <textarea
          id="score-note"
          className="form-control resize-none"
          placeholder="Add observations…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
        />
      </div>

      <button
        id="submit-score-btn"
        type="submit"
        className="btn btn-primary w-full"
        disabled={loading || score === 0}
      >
        {loading ? 'Submitting…' : 'Submit Score'}
      </button>
    </form>
  );
}
