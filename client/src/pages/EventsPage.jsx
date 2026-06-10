import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { REGIONS, LABOR_TYPES } from '../constants.js';

function statusBadge(status) {
  return <span className={`badge badge-${status}`}>{status}</span>;
}

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRegion, setFilterRegion] = useState('');
  const [filterLaborType, setFilterLaborType] = useState('');

  useEffect(() => {
    api.getEvents().then(setEvents).finally(() => setLoading(false));
  }, []);

  async function handleDelete(id) {
    if (!confirm('Delete this event?')) return;
    await api.deleteEvent(id);
    setEvents((ev) => ev.filter((e) => e.id !== id));
  }

  const filtered = events.filter((e) => {
    if (filterRegion && (e.region || 'San Diego') !== filterRegion) return false;
    if (filterLaborType && !e.requirements?.some((r) => r.laborType === filterLaborType)) return false;
    return true;
  });

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <div className="page-header">
        <h1>Events</h1>
        <Link to="/events/new" className="btn btn-primary">+ New Event</Link>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <select
          value={filterRegion}
          onChange={(e) => setFilterRegion(e.target.value)}
          style={{ padding: '0.4rem 0.75rem', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.875rem', minWidth: 160 }}
        >
          <option value="">All Regions</option>
          {REGIONS.map((r) => <option key={r}>{r}</option>)}
        </select>
        <select
          value={filterLaborType}
          onChange={(e) => setFilterLaborType(e.target.value)}
          style={{ padding: '0.4rem 0.75rem', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.875rem', minWidth: 180 }}
        >
          <option value="">All Labor Types</option>
          {LABOR_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        {(filterRegion || filterLaborType) && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => { setFilterRegion(''); setFilterLaborType(''); }}
          >
            ✕ Clear Filters
          </button>
        )}
        <span style={{ fontSize: '0.8rem', color: '#888', alignSelf: 'center' }}>
          {filtered.length} of {events.length} events
        </span>
      </div>

      {filtered.length === 0 && (
        <div className="card">
          <p style={{ color: '#888' }}>No events match the selected filters.</p>
        </div>
      )}

      {filtered.map((event) => {
        const accepted = event.assignments.filter((a) => a.status === 'accepted').length;
        return (
          <div className="card" key={event.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                <strong style={{ fontSize: '1rem' }}>{event.name}</strong>
                {statusBadge(event.status)}
                <span className={`badge ${(event.approval ?? 'pending') === 'approved' ? 'badge-staffed' : 'badge-dispatching'}`}>
                  {(event.approval ?? 'pending') === 'approved' ? '✅ Approved' : '⏳ Pending'}
                </span>
              </div>
                      <div style={{ fontSize: '0.85rem', color: '#666' }}>
                {event.venue} &mdash; {event.region || 'San Diego'} &mdash;{' '}
                {event.requirements?.map((r) => `${r.laborType} (${r.laborCount})`).join(', ')}
              </div>
              {event.requirements?.some((r) => r.flagged) && (
                <div style={{ fontSize: '0.78rem', color: '#dc2626', fontWeight: 600, marginTop: '0.2rem' }}>
                  ⚠️ Understaffed — {event.requirements.filter((r) => r.flagged).map((r) => r.laborType).join(', ')}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link to={`/events/${event.id}`} className="btn btn-secondary btn-sm">View</Link>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(event.id)}>Delete</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
