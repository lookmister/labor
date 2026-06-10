import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { LABOR_TYPES, REGIONS } from '../constants.js';

function emptyDate() { return { date: '', time: '' }; }
function emptyReq() { return { laborType: LABOR_TYPES[0], laborCount: 1 }; }

export default function NewEventPage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', venue: '', exhibitor: '', booth: '',
    region: 'San Diego',
    installDates: [emptyDate()],
    dismantleDates: [emptyDate()],
    requirements: [emptyReq()],
  });

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  function updateDateRow(section, index, key, value) {
    setForm((f) => {
      const rows = [...f[section]];
      rows[index] = { ...rows[index], [key]: value };
      return { ...f, [section]: rows };
    });
  }

  function addDateRow(section) { setForm((f) => ({ ...f, [section]: [...f[section], emptyDate()] })); }
  function removeDateRow(section, index) { setForm((f) => ({ ...f, [section]: f[section].filter((_, i) => i !== index) })); }

  function updateReq(index, key, value) {
    setForm((f) => {
      const reqs = [...f.requirements];
      reqs[index] = { ...reqs[index], [key]: value };
      return { ...f, requirements: reqs };
    });
  }
  function addReq() { setForm((f) => ({ ...f, requirements: [...f.requirements, emptyReq()] })); }
  function removeReq(index) { setForm((f) => ({ ...f, requirements: f.requirements.filter((_, i) => i !== index) })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const event = await api.createEvent(form);
      navigate(`/events/${event.id}`);
    } catch (err) {
      alert('Error creating event: ' + err.message);
      setSaving(false);
    }
  }

  function DateSection({ label, section }) {
    return (
      <div className="form-group">
        <label>{label}</label>
        <div className="date-rows">
          {form[section].map((row, i) => (
            <div className="date-row" key={i}>
              <input type="date" value={row.date} onChange={(e) => updateDateRow(section, i, 'date', e.target.value)} />
              <input type="time" value={row.time} onChange={(e) => updateDateRow(section, i, 'time', e.target.value)} />
              {form[section].length > 1 && (
                <button type="button" className="btn btn-danger btn-sm" onClick={() => removeDateRow(section, i)}>✕</button>
              )}
            </div>
          ))}
        </div>
        <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: '0.5rem', width: 'fit-content' }} onClick={() => addDateRow(section)}>
          + Add date
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header"><h1>New Event</h1></div>
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Show Name *</label>
              <input required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Wal Summit" />
            </div>
            <div className="form-group">
              <label>Venue *</label>
              <input required value={form.venue} onChange={(e) => set('venue', e.target.value)} placeholder="e.g. Gaylord CC" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Exhibitor</label>
              <input value={form.exhibitor} onChange={(e) => set('exhibitor', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Booth</label>
              <input value={form.booth} onChange={(e) => set('booth', e.target.value)} />
            </div>
          </div>
          <div className="form-group" style={{ maxWidth: 280 }}>
            <label>Region *</label>
            <select value={form.region} onChange={(e) => set('region', e.target.value)}>
              {REGIONS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>

          {/* Labor Requirements */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Staff Requirements</label>
          </div>
          {form.requirements.map((req, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px auto', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
              <select value={req.laborType} onChange={(e) => updateReq(i, 'laborType', e.target.value)}
                style={{ padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '0.9rem' }}>
                {LABOR_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
              <input type="number" min="1" value={req.laborCount} onChange={(e) => updateReq(i, 'laborCount', Number(e.target.value))}
                style={{ padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '0.9rem' }}
                placeholder="# needed" />
              {form.requirements.length > 1 && (
                <button type="button" className="btn btn-danger btn-sm" onClick={() => removeReq(i)}>✕</button>
              )}
            </div>
          ))}
          <button type="button" className="btn btn-secondary btn-sm" style={{ marginBottom: '1rem', width: 'fit-content' }} onClick={addReq}>
            + Add Staff Type
          </button>

          <DateSection label="Install Dates & Times" section="installDates" />
          <DateSection label="Dismantle Dates & Times" section="dismantleDates" />

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Create Event'}</button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/')}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
