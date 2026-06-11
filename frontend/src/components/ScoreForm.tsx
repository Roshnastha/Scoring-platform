import { useState, type FormEvent } from 'react';
import { submitScore } from '../api/candidates';
import { getErrorMessage } from '../utils';

const CATEGORIES = ['Technical', 'Communication', 'Problem Solving', 'Culture Fit', 'Leadership'];

interface Props {
  candidateId: number;
  onSubmitted: () => void;
}

export default function ScoreForm({ candidateId, onSubmitted }: Props) {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [score, setScore]       = useState(0);
  const [note, setNote]         = useState('');
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState('');
  const [error, setError]       = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!score) { setError('Please select a score (1–5).'); return; }
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await submitScore(candidateId, { category, score, note: note || undefined });
      setSuccess('Score submitted successfully.');
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
    <form className="flex flex-col gap-6" onSubmit={handleSubmit} id="score-form">
      {success && <div className="bg-status-new-bg text-status-new-fg px-4 py-3 rounded-2xl text-sm font-medium">{success}</div>}
      {error   && <div className="bg-status-rej-bg text-status-rej-fg px-4 py-3 rounded-2xl text-sm font-medium">{error}</div>}

      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-text-secondary ml-1" htmlFor="score-category">Category</label>
        <select
          id="score-category"
          className="form-control appearance-none cursor-pointer"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-text-secondary ml-1">Score</label>
        <div className="flex gap-1.5 p-2 bg-[#F9F9F9] border border-border-light rounded-2xl shadow-inset-soft w-fit">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              className={`w-10 h-10 rounded-full text-sm font-bold flex items-center justify-center transition-all ${
                n <= score 
                  ? 'bg-text-primary text-white shadow-md transform -translate-y-0.5' 
                  : 'bg-white text-text-muted border border-border-light hover:bg-gray-50'
              }`}
              onClick={() => setScore(n)}
              aria-label={`Score ${n}`}
              id={`star-${n}`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-text-secondary ml-1" htmlFor="score-note">Note (optional)</label>
        <textarea
          id="score-note"
          className="form-control resize-y min-h-[100px]"
          placeholder="Add observations…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
        />
      </div>

      <button
        id="submit-score-btn"
        type="submit"
        className="btn btn-primary w-full mt-2"
        disabled={loading || score === 0}
      >
        {loading ? 'Submitting…' : 'Submit Score'}
      </button>
    </form>
  );
}
