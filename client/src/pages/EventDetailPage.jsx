import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api.js';

const STATUS_COLOR = { pending: '#d97706', accepted: '#059669', rejected: '#dc2626' };

export default function EventDetailPage() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [dispatching, setDispatching] = useState(false);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    api.getEvent(id).then(setEvent);
  }, [id]);

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
    try {
      const updated = await api.approveEvent(id);
      setEvent(updated);
    } finally {
      setApproving(false);
    }
  }

  if (!event) return <p>Loading...</p>;

  const installDates = JSON.parse(event.installDates);
  const dismantleDates = JSON.parse(event.dismantleDates);
  const accepted = event.assignments.filter((a) => a.status === 'accepted');
  const canDispatch = event.status === 'draft' || (event.status === 'dispatching' && accepted.length < event.laborCount);
  const isApproved = event.approval === 'approved';

  return (
    <div>
      <div className="page-header">
        <h1>{event.name}</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {canDispatch && (
            <button className="btn btn-primary" onClick={handleDispatch} disabled={dispatching}>
              {dispatching ? 'Dispatching...' : '📤 Dispatch SMS'}
            </button>
          )}
          <button
            className="btn"
            style={{ background: isApproved ? '#d1fae5' : '#fef3c7', color: isApproved ? '#059669' : '#d97706' }}
            onClick={handleApprove}
            disabled={approving}
          >
            {isApproved ? '✅ Approved' : '⏳ Pending Approval'}
          </button>
          <Link to="/" className="btn btn-secondary">← Back</Link>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div><strong>Venue:</strong> {event.venue}</div>
          <div><strong>Status:</strong> <span className={`badge badge-${event.status}`}>{event.status}</span></div>
          {event.exhibitor && <div><strong>Exhibitor:</strong> {event.exhibitor}</div>}
          {event.booth && <div><strong>Booth:</strong> {event.booth}</div>}
          <div><strong>Labor Type:</strong> {event.laborType}</div>
          <div><strong>Staffing:</strong> {accepted.length} / {event.laborCount} filled</div>
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

      {/* Additional Services */}
      <div className="card">
        <h2 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Additional Services</h2>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <a
            href="https://expooutfitters.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            🎪 Need a Custom Booth?
          </a>
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Dispatch Log</h2>
        {event.assignments.length === 0 && (
          <p style={{ color: '#888', fontSize: '0.875rem' }}>
            No dispatches yet. {event.status === 'draft' && 'Click "Dispatch SMS" to send texts to laborers.'}
          </p>
        )}
        {event.assignments.map((a) => (
          <div className="assignment-item" key={a.id}>
            <div>
              <strong>{a.laborer.name}</strong>
              <div style={{ fontSize: '0.8rem', color: '#666' }}>{a.laborer.phone} &mdash; {a.laborer.jobType}</div>
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
    </div>
  );
}
