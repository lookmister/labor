import { Routes, Route, NavLink } from 'react-router-dom';
import EventsPage from './pages/EventsPage.jsx';
import NewEventPage from './pages/NewEventPage.jsx';
import EventDetailPage from './pages/EventDetailPage.jsx';
import LaborersPage from './pages/LaborersPage.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';
import './App.css';

export default function App() {
  return (
    <div className="app">
      <nav className="nav">
        <span className="nav-brand">LaborOps</span>
        <NavLink to="/" end>Events</NavLink>
        <NavLink to="/laborers">Laborers</NavLink>
      </nav>
      <main className="main">
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<EventsPage />} />
            <Route path="/events/new" element={<NewEventPage />} />
            <Route path="/events/:id" element={<EventDetailPage />} />
            <Route path="/laborers" element={<LaborersPage />} />
          </Routes>
        </ErrorBoundary>
      </main>
    </div>
  );
}
