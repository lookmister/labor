import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { LABOR_TYPES, REGIONS } from '../constants.js';

function emptyDate() { return { date: '', time: '' }; }
function emptyReq() {
  return {
    laborType: LABOR_TYPES[0],
    laborCount: 1,
    installDates: [emptyDate()],
    dismantleDates: [emptyDate()],
  };
}

export default function NewEventPage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', venue: '', exhibitor: '', booth: '',
    region: 'San Diego',
    requirements: [emptyReq()],
  });

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  function updateReq(index, key, value) {
    setForm((f) => {
      const reqs = [...f.requirements];
      reqs[index] = { ...reqs[index], [key]: value };
      return { ...f, requirements: reqs };
    });
  }

  function updateReqDate(reqIndex, section, dateIndex, key, value) {
    setForm((f) => {
      const reqs = [...f.requirements];
      const rows = [...reqs[reqIndex][section]];
      rows[dateIndex] = { ...rows[dateIndex], [key]: value };
      reqs[reqIndex] = { ...reqs[reqIndex], [section]: rows };
      return { ...f, requirements: reqs };
    });
  }

  function addReqDate(reqIndex, section) {
    setForm((f) => {
      const reqs = [...f.requirements];
      reqs[reqIndex] = { ...reqs[reqIndex], [section]: [...reqs[reqIndex][section], emptyDate()] };
      return { ...f, requirements: reqs };
    });
  }

  function removeReqDate(reqIndex, section, dateIndex) {
    setForm((f) => {
      const reqs = [...f.requirements];
      reqs[reqIndex] = { ...reqs[reqIndex], [section]: reqs[reqIndex][section].filter((_, i) => i !== dateIndex) };
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

          {/* Staff Requirements — each with their own install/dismantle dates */}
          <div className="form-group" style={{ marginBottom: '0.5rem' }}>
            <label>Staff Requirements</label>
          </div>

          {form.requirements.map((req, i) => (
            <div key={i} style={{
              border: '1px solid #e5e7eb', borderRadius: 8, padding: '1rem',
              marginBottom: '1rem', background: '#fafafa',
            }}>
              {/* Role row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px auto', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                <select
                  value={req.laborType}
                  onChange={(e) => updateReq(i, 'laborType', e.target.value)}
                  style={{ padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '0.9rem' }}
                >
                  {LABOR_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
                <input
                  type="number" min="1" value={req.laborCount}
                  onChange={(e) => updateReq(i, 'laborCount', Number(e.target.value))}
                  style={{ padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '0.9rem' }}
                  placeholder="# needed"
                />
                {form.requirements.length > 1 && (
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => removeReq(i)}>✕</button>
                )}
              </div>

              {/* Install dates for this role */}
              <div style={{ marginBottom: '0.5rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#555', marginBottom: '0.35rem' }}>
                  📥 Install Dates &amp; Times
                </div>
                {req.installDates.map((row, di) => (
                  <div key={di} style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.3rem', alignItems: 'center' }}>
                    <input type="date" value={row.date}
                      onChange={(e) => updateReqDate(i, 'installDates', di, 'date', e.target.value)}
                      style={{ padding: '0.35rem 0.5rem', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '0.85rem' }}
                    />
                    <input type="time" value={row.time}
                      onChange={(e) => updateReqDate(i, 'installDates', di, 'time', e.target.value)}
                      style={{ padding: '0.35rem 0.5rem', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '0.85rem' }}
                    />
                    {req.installDates.length > 1 && (
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => removeReqDate(i, 'installDates', di)}>✕</button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn btn-secondary btn-sm"
                  style={{ marginTop: '0.25rem', width: 'fit-content' }}
                  onClick={() => addReqDate(i, 'installDates')}>
                  + Add date
                </button>
              </div>

              {/* Dismantle dates for this role */}
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#555', marginBottom: '0.35rem' }}>
                  📤 Dismantle Dates &amp; Times
                </div>
                {req.dismantleDates.map((row, di) => (
                  <div key={di} style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.3rem', alignItems: 'center' }}>
                    <input type="date" value={row.date}
                      onChange={(e) => updateReqDate(i, 'dismantleDates', di, 'date', e.target.value)}
                      style={{ padding: '0.35rem 0.5rem', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '0.85rem' }}
                    />
                    <input type="time" value={row.time}
                      onChange={(e) => updateReqDate(i, 'dismantleDates', di, 'time', e.target.value)}
                      style={{ padding: '0.35rem 0.5rem', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '0.85rem' }}
                    />
                    {req.dismantleDates.length > 1 && (
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => removeReqDate(i, 'dismantleDates', di)}>✕</button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn btn-secondary btn-sm"
                  style={{ marginTop: '0.25rem', width: 'fit-content' }}
                  onClick={() => addReqDate(i, 'dismantleDates')}>
                  + Add date
                </button>
              </div>
            </div>
          ))}

          <button type="button" className="btn btn-secondary btn-sm"
            style={{ marginBottom: '1.25rem', width: 'fit-content' }} onClick={addReq}>
            + Add Staff Type
          </button>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Create Event'}</button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/')}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
