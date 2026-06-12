import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createCandidate } from '../api/candidates';
import { ArrowLeft, UserPlus, Loader2 } from 'lucide-react';
import { getErrorMessage } from '../utils';

export default function CreateCandidatePage() {
  const navigate = useNavigate();
  const [name,        setName]        = useState('');
  const [email,       setEmail]       = useState('');
  const [role_applied, setRole]       = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [error,       setError]       = useState('');
  const [loading,     setLoading]     = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const skills = skillsInput.split(',').map((s) => s.trim()).filter(Boolean);
      const c = await createCandidate({ name, email, role_applied, skills });
      navigate(`/candidates/${c.id}`);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to create candidate.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-xl">
      <Link
        to="/candidates"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to candidates
      </Link>

      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6 pb-5 border-b border-border">
          <div className="w-9 h-9 rounded-lg bg-accent-subtle flex items-center justify-center">
            <UserPlus className="w-4 h-4 text-accent" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-text-primary">Add New Candidate</h1>
            <p className="text-xs text-text-muted">Fill in the candidate's details below</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary" htmlFor="c-name">Full Name</label>
            <input
              id="c-name"
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Alice Johnson"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary" htmlFor="c-email">Email</label>
            <input
              id="c-email"
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="alice@example.com"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary" htmlFor="c-role">Role Applied</label>
            <input
              id="c-role"
              className="form-control"
              value={role_applied}
              onChange={(e) => setRole(e.target.value)}
              required
              placeholder="Backend Engineer"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary" htmlFor="c-skills">
              Skills
              <span className="text-text-muted font-normal ml-1">(comma-separated)</span>
            </label>
            <input
              id="c-skills"
              className="form-control"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder="Python, FastAPI, PostgreSQL"
            />
          </div>

          <button
            id="create-candidate-btn"
            type="submit"
            className="btn btn-primary w-full mt-2 py-2.5"
            disabled={loading}
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
              : <><UserPlus className="w-4 h-4" /> Create Candidate</>
            }
          </button>
        </form>
      </div>
    </div>
  );
}
