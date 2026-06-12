import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getCandidate, deleteCandidate, updateStatus, type Candidate } from '../api/candidates';
import type { Score } from '../types';
import { getInitials } from '../utils';
import { useSSEStream } from '../hooks/useSSEStream';
import { ArrowLeft, Archive, Radio, BarChart2, Sparkles } from 'lucide-react';
import ScoreForm from '../components/ScoreForm';
import AISummaryPanel from '../components/AISummaryPanel';
import InternalNotesPanel from '../components/InternalNotesPanel';

const STATUS_BADGE: Record<string, string> = {
  new:      'badge-new',
  reviewed: 'badge-reviewed',
  hired:    'badge-hired',
  rejected: 'badge-rejected',
  archived: 'badge-archived',
};

const SCORE_BAR: Record<number, string> = {
  1: 'bg-red-400',
  2: 'bg-orange-400',
  3: 'bg-amber-400',
  4: 'bg-lime-500',
  5: 'bg-emerald-500',
};

const AVATAR_PALETTES = [
  'bg-violet-100 text-violet-700',
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-indigo-100 text-indigo-700',
  'bg-cyan-100 text-cyan-700',
];
function avatarPalette(name: string) {
  const sum = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_PALETTES[sum % AVATAR_PALETTES.length];
}

export default function CandidateDetailPage() {
  const { id }    = useParams<{ id: string }>();
  const navigate  = useNavigate();
  const role      = localStorage.getItem('role') || 'reviewer';

  const [candidate,      setCandidate]      = useState<Candidate | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState('');
  const [deleting,       setDeleting]       = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const handleScoresUpdate = useCallback((scores: Score[]) => {
    setCandidate((prev) => (prev ? { ...prev, scores } : prev));
  }, []);

  const isLive = useSSEStream({ candidateId: Number(id), onScores: handleScoresUpdate });

  const load = useCallback(async (isInitial = true) => {
    if (!id) return;
    if (isInitial) setLoading(true);
    try {
      const data = await getCandidate(Number(id));
      setCandidate(data);
    } catch {
      setError('Candidate not found or you lack access.');
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(true); }, [load]);

  async function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    if (!candidate) return;
    setUpdatingStatus(true);
    try {
      const updated = await updateStatus(candidate.id, e.target.value);
      setCandidate(updated);
    } catch {
      alert('Failed to update status.');
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleDelete() {
    if (!candidate) return;
    if (!window.confirm(`Archive ${candidate.name}? They won't appear in search results.`)) return;
    setDeleting(true);
    try {
      await deleteCandidate(candidate.id);
      navigate('/candidates');
    } catch {
      alert('Failed to archive candidate.');
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center pt-24">
        <div className="w-5 h-5 border-2 border-border-strong border-t-accent rounded-full animate-spin" />
      </div>
    );
  }
  if (error || !candidate) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
          {error || 'Candidate not found.'}
        </div>
        <Link to="/candidates" className="btn btn-secondary">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </div>
    );
  }

  const avgScore = candidate.scores.length
    ? (candidate.scores.reduce((s, sc) => s + sc.score, 0) / candidate.scores.length).toFixed(1)
    : null;

  return (
    <div className="p-8 max-w-[1100px]">
      {/* Back */}
      <Link
        to="/candidates"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-6"
        id="back-link"
      >
        <ArrowLeft className="w-4 h-4" /> Back to candidates
      </Link>

      {/* Candidate header */}
      <div className="card p-6 mb-6">
        <div className="flex items-start gap-5 flex-wrap">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold shrink-0 ${avatarPalette(candidate.name)}`}>
            {getInitials(candidate.name)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-xl font-bold text-text-primary">{candidate.name}</h1>
              <span className={`badge capitalize ${STATUS_BADGE[candidate.status] ?? 'badge-archived'}`}>
                {candidate.status}
              </span>
              {isLive && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <Radio className="w-3 h-3 animate-pulse" /> Live
                </span>
              )}
            </div>
            <p className="text-sm text-text-muted mb-2">{candidate.email}</p>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-medium text-text-secondary bg-bg-subtle px-2.5 py-1 rounded-lg border border-border">
                {candidate.role_applied}
              </span>
              {candidate.skills.map((s) => (
                <span key={s} className="text-xs text-text-muted bg-bg-subtle px-2 py-0.5 rounded border border-border">
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {avgScore && (
              <div className="text-center">
                <div className="text-2xl font-bold text-text-primary">{avgScore}</div>
                <div className="text-xs text-text-muted">avg / 5</div>
              </div>
            )}
            {role === 'admin' && (
              <select
                className={`form-control text-xs font-semibold cursor-pointer w-auto ${updatingStatus ? 'opacity-50' : ''}`}
                value={candidate.status}
                onChange={handleStatusChange}
                disabled={updatingStatus}
              >
                <option value="new">New</option>
                <option value="reviewed">Reviewed</option>
                <option value="hired">Hired</option>
                <option value="rejected">Rejected</option>
              </select>
            )}
            {role === 'admin' && (
              <button
                id="delete-candidate-btn"
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                <Archive className="w-4 h-4" />
                {deleting ? 'Archiving…' : 'Archive'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* Main column */}
        <div className="flex flex-col gap-6">
          {/* AI Summary */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-accent" />
              <h2 className="text-sm font-semibold text-text-primary">AI Summary</h2>
            </div>
            <AISummaryPanel
              candidateId={candidate.id}
              existingSummary={candidate.ai_summary}
              onGenerated={(s) => setCandidate((prev) => prev ? { ...prev, ai_summary: s } : prev)}
            />
          </div>

          {/* Internal Notes (admin only) */}
          {role === 'admin' && (
            <div className="card p-6">
              <InternalNotesPanel
                candidateId={candidate.id}
                initialNotes={candidate.internal_notes || ''}
                onSaved={(notes) => setCandidate((prev) => prev ? { ...prev, internal_notes: notes } : prev)}
              />
            </div>
          )}

          {/* Scores */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-text-muted" />
                <h2 className="text-sm font-semibold text-text-primary">
                  Scores
                  <span className="ml-2 text-text-muted font-normal">({candidate.scores.length})</span>
                </h2>
              </div>
              {role === 'reviewer' && (
                <span className="text-xs text-text-muted">Your scores only</span>
              )}
            </div>

            {candidate.scores.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <div className="w-9 h-9 rounded-lg bg-bg-subtle flex items-center justify-center mb-3">
                  <BarChart2 className="w-4 h-4 text-text-muted" />
                </div>
                <p className="text-sm font-medium text-text-primary">No scores yet</p>
                <p className="text-xs text-text-muted mt-1">Use the form to submit the first score.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {candidate.scores.map((sc: Score, i: number) => (
                  <div
                    key={sc.id}
                    className={`flex gap-4 items-start ${i !== candidate.scores.length - 1 ? 'pb-4 border-b border-border' : ''}`}
                    id={`score-${sc.id}`}
                  >
                    <div className="w-36 shrink-0">
                      <p className="text-sm font-semibold text-text-primary">{sc.category}</p>
                      <p className="text-xs text-text-muted mt-0.5">Reviewer #{sc.reviewer_id}</p>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex-1 h-2 bg-bg-subtle rounded-full overflow-hidden border border-border">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${SCORE_BAR[sc.score] ?? 'bg-accent'}`}
                            style={{ width: `${sc.score * 20}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-text-primary w-8 text-right shrink-0">
                          {sc.score}/5
                        </span>
                      </div>
                      {sc.note && (
                        <p className="text-sm text-text-secondary bg-bg-subtle border border-border rounded-lg px-3 py-2 leading-relaxed">
                          {sc.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          {/* Score form */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-4">Submit Score</h2>
            <ScoreForm candidateId={candidate.id} onSubmitted={() => load(false)} />
          </div>

          {/* Details */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-bg-subtle">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Details</h2>
            </div>
            <div className="divide-y divide-border">
              {[
                ['ID', `#${candidate.id}`],
                ['Role', candidate.role_applied],
                ['Created', new Date(candidate.created_at).toLocaleDateString()],
                ['Total scores', String(candidate.scores.length)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center px-4 py-3">
                  <span className="text-xs text-text-muted">{label}</span>
                  <span className="text-xs font-semibold text-text-primary">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
