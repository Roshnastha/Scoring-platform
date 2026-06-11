import {useState, useEffect, useCallback} from "react";
import {useParams, Link, useNavigate} from "react-router-dom";
import {
  getCandidate,
  deleteCandidate,
  updateStatus,
  type Candidate,
} from "../api/candidates";
import type {Score} from "../types";
import {getInitials} from "../utils";
import {useSSEStream} from "../hooks/useSSEStream";
import {ArrowLeft, Archive, Radio, BarChart2} from "lucide-react";
import ScoreForm from "../components/ScoreForm";
import AISummaryPanel from "../components/AISummaryPanel";
import InternalNotesPanel from "../components/InternalNotesPanel";

export default function CandidateDetailPage() {
  const {id} = useParams<{id: string}>();
  const navigate = useNavigate();
  const role = localStorage.getItem("role") || "reviewer";

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const handleScoresUpdate = useCallback((scores: Score[]) => {
    setCandidate((prev) => (prev ? {...prev, scores} : prev));
  }, []);

  const isLive = useSSEStream({
    candidateId: Number(id),
    onScores: handleScoresUpdate,
  });

  const load = useCallback(
    async (isInitial = true) => {
      if (!id) return;
      if (isInitial) setLoading(true);
      try {
        const data = await getCandidate(Number(id));
        setCandidate(data);
      } catch {
        setError("Candidate not found or you lack access.");
      } finally {
        if (isInitial) setLoading(false);
      }
    },
    [id],
  );

  useEffect(() => {
    void load(true);
  }, [load]);

  async function handleSummaryGenerated(summary: string) {
    setCandidate((prev) => (prev ? {...prev, ai_summary: summary} : prev));
  }

  async function handleScoreSubmitted() {
    await load(false); // refresh to show new score without showing spinner
  }

  async function handleNotesUpdated(notes: string) {
    setCandidate((prev) => (prev ? {...prev, internal_notes: notes} : prev));
  }

  async function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value;
    if (!candidate) return;
    setUpdatingStatus(true);
    try {
      const updated = await updateStatus(candidate.id, newStatus);
      setCandidate(updated);
    } catch {
      alert("Failed to update status.");
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleDelete() {
    if (!candidate) return;
    if (
      !window.confirm(
        `Archive ${candidate.name}? This is a soft delete — they won't appear in search results.`,
      )
    )
      return;
    setDeleting(true);
    try {
      await deleteCandidate(candidate.id);
      navigate("/candidates");
    } catch {
      alert("Failed to archive candidate.");
      setDeleting(false);
    }
  }

  if (loading)
    return (
      <div className="max-w-[1200px] mx-auto p-6 md:p-12 flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-border-light border-t-text-muted rounded-full animate-spin"></div>
      </div>
    );
  if (error || !candidate)
    return (
      <div className="max-w-[1200px] mx-auto p-6 md:p-12">
        <div className="bg-status-rej-bg text-status-rej-fg px-6 py-4 rounded-2xl text-sm font-medium mb-6 shadow-soft">
          {error || "Candidate not found."}
        </div>
        <Link
          to="/candidates"
          className="btn btn-secondary inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to list
        </Link>
      </div>
    );

  const avgScore = candidate.scores.length
    ? (
        candidate.scores.reduce((s, sc) => s + sc.score, 0) /
        candidate.scores.length
      ).toFixed(1)
    : null;

  return (
    <div className="max-w-[1200px] mx-auto p-6 md:p-12 animate-[fade-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]">
      <Link
        to="/candidates"
        className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors mb-8"
        id="back-link"
      >
        <ArrowLeft className="w-4 h-4" /> Back to candidates
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[2.5fr_1fr] gap-8 items-start">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col bg-white rounded-3xl shadow-soft overflow-hidden">
            <div className="flex flex-col md:flex-row w-full">
              <div className="w-full md:w-48 h-48 bg-bg-base flex items-center justify-center font-bold text-6xl text-text-muted shrink-0 rounded-sm">
                {getInitials(candidate.name)}
              </div>
              <div className="p-8 md:p-10 flex-1">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-3xl font-bold leading-tight mb-1 text-text-primary">
                      {candidate.name}
                    </h2>
                    <p className="text-text-secondary font-medium">
                      {candidate.email}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {role === "admin" ? (
                      <select
                        className={`text-xs font-semibold uppercase px-3 py-1.5 rounded-full outline-none cursor-pointer border border-border-light shadow-sm transition-colors ${updatingStatus ? "opacity-50" : "hover:bg-gray-50"}`}
                        value={candidate.status}
                        onChange={handleStatusChange}
                        disabled={updatingStatus}
                      >
                        <option value="new">New</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="hired">Hired</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    ) : (
                      <span
                        className={`text-xs font-semibold uppercase px-3 py-1 rounded-full bg-border-light text-text-secondary`}
                      >
                        {candidate.status}
                      </span>
                    )}
                    {avgScore && (
                      <span className="text-sm font-medium text-text-muted mt-2">
                        Avg:{" "}
                        <strong className="text-text-primary text-lg ml-1">
                          {avgScore}/5
                        </strong>
                      </span>
                    )}
                  </div>
                </div>

                <div className="inline-block bg-bg-base px-4 py-2 rounded-xl text-sm font-semibold text-text-primary mb-6">
                  {candidate.role_applied}
                </div>

                {candidate.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {candidate.skills.map((s) => (
                      <span
                        key={s}
                        className="text-xs font-medium bg-[#F5F5F5] text-text-secondary px-3 py-1.5 rounded-full"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {role === "admin" && (
              <div className="p-6 md:px-10 border-t border-border-light flex justify-end bg-gray-50/50">
                <button
                  id="delete-candidate-btn"
                  className="btn bg-gray-200 text-text-secondary hover:bg-gray-300 hover:text-red-700 inline-flex items-center gap-2"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  <Archive className="w-4 h-4" />
                  {deleting ? "Archiving…" : "Archive Candidate"}
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl p-8 md:p-10 shadow-soft relative overflow-hidden">
            <h3 className="text-xl font-bold text-text-primary mb-6">
              AI Summary
            </h3>
            <AISummaryPanel
              candidateId={candidate.id}
              existingSummary={candidate.ai_summary}
              onGenerated={handleSummaryGenerated}
            />
          </div>

          {role === "admin" && (
            <InternalNotesPanel
              candidateId={candidate.id}
              initialNotes={candidate.internal_notes || ""}
              onSaved={handleNotesUpdated}
            />
          )}

          <div className="bg-white rounded-3xl p-8 md:p-10 shadow-soft">
            <div className="flex items-center justify-between mb-8 border-b border-border-light pb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-text-primary">Scores</h3>
                {isLive && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                    <Radio className="w-3 h-3 animate-pulse" />
                    Live
                  </span>
                )}
              </div>
              {role === "reviewer" && (
                <span className="text-sm font-medium text-text-muted">
                  Showing your scores only
                </span>
              )}
            </div>

            {candidate.scores.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-bg-base rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart2 className="w-8 h-8 text-text-muted" />
                </div>
                <div className="text-lg font-bold mb-2 text-text-primary">
                  No scores yet
                </div>
                <div className="text-sm text-text-secondary">
                  Use the form to submit the first score.
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {candidate.scores.map((sc, i) => (
                  <div
                    key={sc.id}
                    className={`flex flex-col md:flex-row gap-6 md:items-start ${i !== candidate.scores.length - 1 ? "border-b border-border-light pb-6" : ""}`}
                    id={`score-${sc.id}`}
                  >
                    <div className="w-44 shrink-0">
                      <div className="font-bold text-text-primary">
                        {sc.category}
                      </div>
                      <div className="text-xs font-medium text-text-muted mt-1">
                        Reviewer #{sc.reviewer_id}
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <div className="flex-1 h-3 bg-bg-base rounded-full overflow-hidden shadow-inset-soft">
                          <div
                            className="h-full bg-text-primary rounded-full transition-all duration-700"
                            style={{width: `${sc.score * 20}%`}}
                          />
                        </div>
                        <span className="font-bold w-8 text-right text-text-primary">
                          {sc.score}/5
                        </span>
                      </div>
                      {sc.note && (
                        <div className="text-sm mt-3 bg-[#F9F9F9] p-4 rounded-2xl text-text-secondary leading-relaxed border border-border-light">
                          {sc.note}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <div className="bg-white rounded-3xl p-8 shadow-soft">
            <h3 className="text-xl font-bold text-text-primary mb-6">
              Submit Score
            </h3>
            <ScoreForm
              candidateId={candidate.id}
              onSubmitted={handleScoreSubmitted}
            />
          </div>

          <div className="bg-white rounded-3xl shadow-soft overflow-hidden">
            <div className="px-6 py-5 bg-gray-50/50 border-b border-border-light">
              <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider">
                Details
              </h3>
            </div>
            <div className="flex flex-col p-2">
              <div className="flex justify-between p-4 text-sm hover:bg-gray-50 rounded-xl transition-colors">
                <span className="text-text-secondary font-medium">
                  Candidate ID
                </span>
                <span className="font-bold text-text-primary">
                  #{candidate.id}
                </span>
              </div>
              <div className="flex justify-between p-4 text-sm hover:bg-gray-50 rounded-xl transition-colors">
                <span className="text-text-secondary font-medium">
                  Applied for
                </span>
                <span className="font-bold text-text-primary">
                  {candidate.role_applied}
                </span>
              </div>
              <div className="flex justify-between p-4 text-sm hover:bg-gray-50 rounded-xl transition-colors">
                <span className="text-text-secondary font-medium">Created</span>
                <span className="font-bold text-text-primary">
                  {new Date(candidate.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between p-4 text-sm hover:bg-gray-50 rounded-xl transition-colors">
                <span className="text-text-secondary font-medium">
                  Total scores
                </span>
                <span className="font-bold text-text-primary">
                  {candidate.scores.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
