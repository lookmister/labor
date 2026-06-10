import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { LABOR_TYPES } from '../constants.js';

function emptyDate() {
  return { date: '', time: '' };
}

export default function NewEventPage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    venue: '',
    exhibitor: '',
    booth: '',
    laborType: LABOR_TYPES[0],
    laborCount: 1,
    installDates: [emptyDate()],
    dismantleDates: [emptyDate()],
  });

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function updateDateRow(section, index, key, value) {
    setForm((f) => {
      const rows = [...f[section]];
      rows[index] = { ...rows[index], [key]: value };
      return { ...f, [section]: rows };
    });
  }

  function addRow(section) {
    setForm((f) => ({ ...f, [section]: [...f[section], emptyDate()] }));
  }

  function removeRow(section, index) {
    setForm((f) => ({ ...f, [section]: f[section].filter((_, i) => i !== index) }));
  }

  async function handleSubmit(e, dispatch = false) {
    e.preventDefault();
    setSaving(true);
    try {
      const event = await api.createEvent({ ...form, dispatch });
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
                <button type="button" className="btn btn-danger btn-sm" onClick={() => removeRow(section, i)}>✕</button>
              )}
            </div>
          ))}
        </div>
        <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: '0.5rem', width: 'fit-content' }} onClick={() => addRow(section)}>
          + Add date
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>New Event</h1>
      </div>
      <div className="card">
        <form onSubmit={(e) => handleSubmit(e, false)}>
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

          <div className="form-row">
            <div className="form-group">
              <label>Labor Type *</label>
              <select value={form.laborType} onChange={(e) => set('laborType', e.target.value)}>
                {LABOR_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Number of Laborers *</label>
              <input type="number" min="1" required value={form.laborCount} onChange={(e) => set('laborCount', Number(e.target.value))} />
            </div>
          </div>

          <DateSection label="Install Dates & Times" section="installDates" />
          <DateSection label="Dismantle Dates & Times" section="dismantleDates" />

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Create Event'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/')}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
