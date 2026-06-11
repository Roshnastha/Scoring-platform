import { useState } from 'react';
import { updateNotes } from '../api/candidates';
import { FileText, Pencil, Save, X } from 'lucide-react';

interface Props {
  candidateId: number;
  initialNotes: string;
  onSaved: (notes: string) => void;
}

export default function InternalNotesPanel({ candidateId, initialNotes, onSaved }: Props) {
  const [notes, setNotes]     = useState(initialNotes);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [saved, setSaved]     = useState(false);

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
    <div className="bg-white rounded-3xl p-8 md:p-10 shadow-soft" id="internal-notes-panel">
      <div className="flex items-center justify-between mb-6 border-b border-border-light pb-4">
        <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <FileText className="w-5 h-5 text-text-muted" />
          Internal Notes
          <span className="text-[10px] uppercase font-bold tracking-wider bg-gray-100 text-text-muted px-2 py-0.5 rounded-md ml-2">Admin Only</span>
        </h3>
      </div>

      {error && <div className="bg-status-rej-bg text-status-rej-fg px-4 py-3 rounded-2xl text-sm font-medium mb-4">{error}</div>}
      {saved && <div className="bg-[#EAEFEC] text-[#4F6B55] px-4 py-3 rounded-2xl text-sm font-medium mb-4">Notes saved successfully.</div>}

      {editing ? (
        <div className="flex flex-col gap-4">
          <textarea
            id="internal-notes-input"
            className="form-control resize-y min-h-[120px]"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Add confidential observations here…"
            autoFocus
          />
          <div className="flex gap-3">
            <button id="save-notes-btn" className="btn btn-primary inline-flex items-center gap-2" onClick={handleSave} disabled={loading}>
              <Save className="w-4 h-4" />
              {loading ? 'Saving…' : 'Save Notes'}
            </button>
            <button className="btn btn-ghost inline-flex items-center gap-2" onClick={() => { setEditing(false); setNotes(initialNotes); }}>
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          {notes ? (
            <div className="bg-[#F9F9F9] border border-border-light rounded-2xl p-6 shadow-inset-soft">
              <p className="text-[15px] leading-relaxed text-text-secondary whitespace-pre-wrap">{notes}</p>
            </div>
          ) : (
            <div className="bg-[#F9F9F9] border border-dashed border-border-dark rounded-2xl p-6 text-center shadow-inset-soft">
              <p className="text-sm font-medium text-text-muted">
                No internal notes have been added yet.
              </p>
            </div>
          )}
          <button
            id="edit-notes-btn"
            className="btn btn-secondary mt-6 inline-flex items-center gap-2"
            onClick={() => setEditing(true)}
          >
            <Pencil className="w-4 h-4" />
            {notes ? 'Edit Notes' : 'Add Notes'}
          </button>
        </div>
      )}
    </div>
  );
}
