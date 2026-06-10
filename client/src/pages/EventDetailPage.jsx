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

  const installDates = JSON.parse(event.installDates);
  const dismantleDates = JSON.parse(event.dismantleDates);
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

        {/* Staff Requirements */}
        <div style={{ marginBottom: '1rem' }}>
          <strong>Staff Requirements:</strong>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            {event.requirements?.map((req) => {
              const accepted = event.assignments.filter(
                (a) => a.requirementId === req.id && a.status === 'accepted'
              ).length;
              return (
                <span key={req.id} style={{
                  background: accepted >= req.laborCount ? '#d1fae5' : '#fef3c7',
                  color: accepted >= req.laborCount ? '#059669' : '#d97706',
                  padding: '0.25rem 0.75rem', borderRadius: 999, fontSize: '0.8rem', fontWeight: 600
                }}>
                  {req.laborType}: {accepted}/{req.laborCount}
                </span>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <strong>Install:</strong>
            <ul style={{ marginTop: '0.25rem', paddingLeft: '1.25rem', fontSize: '0.875rem' }}>
              {installDates.map((d, i) => <li key={i}>{d.date} @ {d.time}</li>)}
            </ul>
          </div>
          <div>
            <strong>Dismantle:</strong>
            <ul style={{ marginTop: '0.25rem', paddingLeft: '1.25rem', fontSize: '0.875rem' }}>
              {dismantleDates.map((d, i) => <li key={i}>{d.date} @ {d.time}</li>)}
            </ul>
          </div>
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
