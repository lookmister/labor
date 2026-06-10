import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { LABOR_TYPES, PRIORITY_LEVELS, REGIONS } from '../constants.js';

const EMPTY = { name: '', phone: '', email: '', rate: '', jobType: LABOR_TYPES[0], priority: 'D', region: 'San Diego' };

export default function LaborersPage() {
  const [laborers, setLaborers] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getLaborers().then(setLaborers).finally(() => setLoading(false));
  }, []);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (editing) {
      const updated = await api.updateLaborer(editing, { ...form, active: true });
      setLaborers((l) => l.map((x) => (x.id === editing ? updated : x)));
      setEditing(null);
    } else {
      const created = await api.createLaborer(form);
      setLaborers((l) => [...l, created].sort((a, b) => a.priority.localeCompare(b.priority) || a.name.localeCompare(b.name)));
    }
    setForm(EMPTY);
  }

  function startEdit(laborer) {
    setEditing(laborer.id);
    setForm({
      name: laborer.name,
      phone: laborer.phone,
      email: laborer.email || '',
      rate: laborer.rate,
      jobType: laborer.jobType,
      priority: laborer.priority || 'D',
      region: laborer.region || 'San Diego',
    });
  }

  async function handleDelete(id) {
    if (!confirm('Deactivate this laborer?')) return;
    await api.deleteLaborer(id);
    setLaborers((l) => l.filter((x) => x.id !== id));
  }

  return (
    <div>
      <div className="page-header">
        <h1>Laborers</h1>
      </div>

      <div className="card">
        <h2 style={{ fontSize: '1rem', marginBottom: '1rem' }}>{editing ? 'Edit Laborer' : 'Add Laborer'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Name *</label>
              <input required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Greg Smith" />
            </div>
            <div className="form-group">
              <label>Phone *</label>
              <input required value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+15551234567" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Rate ($/hr) *</label>
              <input required type="number" min="0" step="0.01" value={form.rate} onChange={(e) => set('rate', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Job Type *</label>
              <select value={form.jobType} onChange={(e) => set('jobType', e.target.value)}>
                {LABOR_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Region *</label>
              <select value={form.region} onChange={(e) => set('region', e.target.value)}>
                {REGIONS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group" style={{ maxWidth: '200px' }}>
            <label>Priority (A = highest)</label>
            <select value={form.priority} onChange={(e) => set('priority', e.target.value)}>
              {PRIORITY_LEVELS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn btn-primary">{editing ? 'Save' : 'Add Laborer'}</button>
            {editing && <button type="button" className="btn btn-secondary" onClick={() => { setEditing(null); setForm(EMPTY); }}>Cancel</button>}
          </div>
        </form>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? <p style={{ padding: '1rem' }}>Loading...</p> : (
          <table>
            <thead>
              <tr>
                <th>Priority</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Job Type</th>
                <th>Region</th>
                <th>Rate</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {laborers.length === 0 && (
                <tr><td colSpan={7} style={{ color: '#888', textAlign: 'center' }}>No laborers yet.</td></tr>
              )}
              {laborers.map((l) => (
                <tr key={l.id}>
                  <td>
                    <span style={{
                      display: 'inline-block', width: 28, height: 28, borderRadius: '50%',
                      background: '#1a1a2e', color: '#fff', textAlign: 'center',
                      lineHeight: '28px', fontWeight: 700, fontSize: '0.8rem'
                    }}>{l.priority || 'D'}</span>
                  </td>
                  <td>{l.name}</td>
                  <td>{l.phone}</td>
                  <td>{l.jobType}</td>
                  <td>{l.region || '—'}</td>
                  <td>${l.rate}/hr</td>
                  <td style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => startEdit(l)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(l.id)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
