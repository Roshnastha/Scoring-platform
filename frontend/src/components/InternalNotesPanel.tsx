import { useState } from 'react';
import { updateNotes } from '../api/candidates';
import { Lock, Pencil, Save, X } from 'lucide-react';

interface Props {
  candidateId: number;
  initialNotes: string;
  onSaved: (notes: string) => void;
}

export default function InternalNotesPanel({ candidateId, initialNotes, onSaved }: Props) {
  const [notes,   setNotes]   = useState(initialNotes);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [saved,   setSaved]   = useState(false);

  async function handleSave() {
    setLoading(true);
    setError('');
    try {
      await updateNotes(candidateId, notes);
      onSaved(notes);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Failed to save notes.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div id="internal-notes-panel">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-text-muted" />
          <span className="text-sm font-semibold text-text-primary">Internal Notes</span>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded">
            Admin only
          </span>
        </div>
        {saved && <span className="text-xs text-emerald-600 font-medium">Saved ✓</span>}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm mb-3">
          {error}
        </div>
      )}

      {editing ? (
        <div className="flex flex-col gap-3">
          <textarea
            id="internal-notes-input"
            className="form-control resize-none"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Add confidential observations…"
            autoFocus
          />
          <div className="flex gap-2">
            <button id="save-notes-btn" className="btn btn-primary" onClick={handleSave} disabled={loading}>
              <Save className="w-3.5 h-3.5" />
              {loading ? 'Saving…' : 'Save'}
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => { setEditing(false); setNotes(initialNotes); }}
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          {notes ? (
            <div className="bg-bg-subtle border border-border rounded-lg p-4 mb-3">
              <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{notes}</p>
            </div>
          ) : (
            <div className="border border-dashed border-border rounded-lg p-4 mb-3">
              <p className="text-sm text-text-muted text-center">No internal notes added yet.</p>
            </div>
          )}
          <button
            id="edit-notes-btn"
            className="btn btn-ghost text-sm"
            onClick={() => setEditing(true)}
          >
            <Pencil className="w-3.5 h-3.5" />
            {notes ? 'Edit notes' : 'Add notes'}
          </button>
        </div>
      )}
    </div>
  );
}
