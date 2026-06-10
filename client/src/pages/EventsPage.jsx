import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

function statusBadge(status) {
  return <span className={`badge badge-${status}`}>{status}</span>;
}

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getEvents().then(setEvents).finally(() => setLoading(false));
  }, []);

  async function handleDelete(id) {
    if (!confirm('Delete this event?')) return;
    await api.deleteEvent(id);
    setEvents((ev) => ev.filter((e) => e.id !== id));
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <div className="page-header">
        <h1>Events</h1>
        <Link to="/events/new" className="btn btn-primary">+ New Event</Link>
      </div>

      {events.length === 0 && (
        <div className="card">
          <p style={{ color: '#888' }}>No events yet. Create your first event to get started.</p>
        </div>
      )}

      {events.map((event) => {
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
                {event.venue} &mdash; {event.laborType} &mdash; {accepted}/{event.laborCount} staffed
              </div>
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
