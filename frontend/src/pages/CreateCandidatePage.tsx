import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { createCandidate } from '../api/candidates';
import { ArrowLeft, UserPlus, Loader2 } from 'lucide-react';
import { getErrorMessage } from '../utils';

export default function CreateCandidatePage() {
  const navigate  = useNavigate();
  const [name, setName]               = useState('');
  const [email, setEmail]             = useState('');
  const [role_applied, setRole]       = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const skills = skillsInput.split(',').map(s => s.trim()).filter(Boolean);
      const c = await createCandidate({ name, email, role_applied, skills });
      navigate(`/candidates/${c.id}`);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to create candidate.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 md:p-12 animate-[fade-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]">
      <Link to="/candidates" className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors mb-8">
        <ArrowLeft className="w-4 h-4" /> Back to candidates
      </Link>

      <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-float">
        <div className="flex items-center gap-4 mb-8 border-b border-border-light pb-6">
          <div className="w-10 h-10 rounded-full bg-accent-primary flex items-center justify-center text-white shadow-inner-soft">
            <UserPlus className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">Add New Candidate</h2>
        </div>

        {error && <div className="bg-status-rej-bg text-status-rej-fg px-4 py-3 rounded-2xl text-sm font-medium mb-6">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary ml-1" htmlFor="c-name">Full Name</label>
            <input id="c-name" className="form-control" value={name}
              onChange={e => setName(e.target.value)} required placeholder="Alice Johnson" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary ml-1" htmlFor="c-email">Email</label>
            <input id="c-email" type="email" className="form-control" value={email}
              onChange={e => setEmail(e.target.value)} required placeholder="alice@example.com" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary ml-1" htmlFor="c-role">Role Applied</label>
            <input id="c-role" className="form-control" value={role_applied}
              onChange={e => setRole(e.target.value)} required placeholder="Backend Engineer" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary ml-1" htmlFor="c-skills">Skills (comma-separated)</label>
            <input id="c-skills" className="form-control" value={skillsInput}
              onChange={e => setSkillsInput(e.target.value)} placeholder="Python, FastAPI, PostgreSQL" />
          </div>

          <button id="create-candidate-btn" type="submit" className="btn btn-primary w-full mt-6 py-3.5 text-[15px] inline-flex items-center justify-center gap-2" disabled={loading}>
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
