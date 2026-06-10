import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api.js';

const STATUS_COLOR = { pending: '#d97706', accepted: '#059669', rejected: '#dc2626', expired: '#9ca3af' };

export default function EventDetailPage() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [dispatching, setDispatching] = useState(false);
  const [approving, setApproving] = useState(false);

  useEffect(() => { api.getEvent(id).then(setEvent); }, [id]);

  async function handleDispatch() {
    setDispatching(true);
    try {
      const updated = await api.dispatchEvent(id);
      setEvent(updated);
    } catch (err) {
      alert('Error dispatching: ' + err.message);
    } finally {
      setDispatching(false);
    }
  }

  async function handleApprove() {
    setApproving(true);
    try { setEvent(await api.approveEvent(id)); }
    finally { setApproving(false); }
  }

  if (!event) return <p>Loading...</p>;

  const isApproved = (event.approval ?? 'pending') === 'approved';
  const canDispatch = isApproved && event.status !== 'staffed';

  return (
    <div>
      <div className="page-header">
        <h1>{event.name}</h1>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {canDispatch && (
            <button className="btn btn-primary" onClick={handleDispatch} disabled={dispatching}>
              {dispatching ? 'Dispatching...' : '📤 Dispatch SMS'}
            </button>
          )}
          <button className="btn" style={{ background: isApproved ? '#d1fae5' : '#fef3c7', color: isApproved ? '#059669' : '#d97706' }}
            onClick={handleApprove} disabled={approving}>
            {isApproved ? '✅ Approved' : '⏳ Pending Approval'}
          </button>
          <a href="https://expooutfitters.com" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
            🎪 Custom Booth?
          </a>
          <Link to="/" className="btn btn-secondary">← Back</Link>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div><strong>Venue:</strong> {event.venue}</div>
          <div><strong>Status:</strong> <span className={`badge badge-${event.status}`}>{event.status}</span></div>
          {event.exhibitor && <div><strong>Exhibitor:</strong> {event.exhibitor}</div>}
          {event.booth && <div><strong>Booth:</strong> {event.booth}</div>}
          <div><strong>Region:</strong> {event.region}</div>
        </div>

        {/* Staff Requirements with per-role dates */}
        <div>
          <strong style={{ display: 'block', marginBottom: '0.75rem' }}>Staff Requirements:</strong>
          {event.requirements?.map((req) => {
            const accepted = event.assignments.filter(
              (a) => a.requirementId === req.id && a.status === 'accepted'
            ).length;
            const installDates = req.installDates ? JSON.parse(req.installDates) : [];
            const dismantleDates = req.dismantleDates ? JSON.parse(req.dismantleDates) : [];
            const filled = accepted >= req.laborCount;
            return (
              <div key={req.id} style={{
                border: `1px solid ${filled ? '#a7f3d0' : '#fde68a'}`,
                borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '0.75rem',
                background: filled ? '#f0fdf4' : '#fffbeb',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{
                    fontWeight: 700, fontSize: '0.95rem',
                    color: filled ? '#059669' : '#d97706',
                  }}>
                    {req.laborType}
                  </span>
                  <span style={{
                    background: filled ? '#d1fae5' : '#fef3c7',
                    color: filled ? '#059669' : '#d97706',
                    padding: '0.15rem 0.6rem', borderRadius: 999, fontSize: '0.78rem', fontWeight: 600,
                  }}>
                    {accepted}/{req.laborCount} filled
                  </span>
                  {req.flagged && !filled && (
                    <span style={{
                      background: '#fee2e2', color: '#dc2626',
                      padding: '0.15rem 0.6rem', borderRadius: 999, fontSize: '0.78rem', fontWeight: 600,
                      display: 'flex', alignItems: 'center', gap: '0.25rem',
                    }}>
                      ⚠️ Not enough staff — add more laborers
                    </span>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.82rem', color: '#555' }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>📥 Install:</span>
                    {installDates.length === 0
                      ? <span style={{ color: '#aaa' }}> TBD</span>
                      : <ul style={{ margin: '0.2rem 0 0 1rem', padding: 0 }}>
                          {installDates.map((d, i) => <li key={i}>{d.date} @ {d.time}</li>)}
                        </ul>
                    }
                  </div>
                  <div>
                    <span style={{ fontWeight: 600 }}>📤 Dismantle:</span>
                    {dismantleDates.length === 0
                      ? <span style={{ color: '#aaa' }}> TBD</span>
                      : <ul style={{ margin: '0.2rem 0 0 1rem', padding: 0 }}>
                          {dismantleDates.map((d, i) => <li key={i}>{d.date} @ {d.time}</li>)}
                        </ul>
                    }
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dispatch Log grouped by requirement */}
      {event.requirements?.map((req) => {
        const reqAssignments = event.assignments.filter((a) => a.requirementId === req.id);
        return (
          <div className="card" key={req.id}>
            <h2 style={{ fontSize: '1rem', marginBottom: '1rem' }}>
              {req.laborType} — {reqAssignments.filter(a => a.status === 'accepted').length}/{req.laborCount} filled
            </h2>
            {reqAssignments.length === 0 && (
              <p style={{ color: '#888', fontSize: '0.875rem' }}>No dispatches yet.</p>
            )}
            {reqAssignments.map((a) => (
              <div className="assignment-item" key={a.id}>
                <div>
                  <strong>{a.laborer.name}</strong>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>{a.laborer.phone}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ color: STATUS_COLOR[a.status], fontWeight: 600, fontSize: '0.875rem' }}>
                    {a.status.toUpperCase()}
                  </span>
                  <div style={{ fontSize: '0.75rem', color: '#999' }}>
                    Sent: {new Date(a.sentAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
