import React, { useState, useEffect } from 'react';
import * as api from '../services/api';

export const EventsPage = ({ navigateTo }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await api.getEvents();
        setEvents(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load events. Please check your database connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.venue.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAvailability = !showOnlyAvailable || event.availableSeatsCount > 0;
    return matchesSearch && matchesAvailability;
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading events...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header-section">
        <div>
          <h1 className="page-title">Explore Events</h1>
          <p className="page-subtitle">Select an event and book your seats instantly</p>
        </div>
      </div>

      <div className="filter-bar" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', margin: '20px 0', padding: '16px', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
        <div style={{ flexGrow: 1, minWidth: '280px' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Search events by name or venue..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
          <input
            type="checkbox"
            checked={showOnlyAvailable}
            onChange={(e) => setShowOnlyAvailable(e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: 'var(--accent)', cursor: 'pointer' }}
          />
          Show only available events
        </label>
      </div>

      {error && (
        <div className="alert alert-danger" id="events-error-alert">
          {error}
        </div>
      )}

      {filteredEvents.length === 0 ? (
        <div className="alert alert-info">No events match your criteria. Make sure to seed the database or adjust your search!</div>
      ) : (
        <div className="events-grid">
          {filteredEvents.map((event) => {
            const isSoldOut = event.availableSeatsCount === 0;
            const isEnded = new Date(event.dateTime) < new Date();

            return (
              <div className="event-card" key={event._id} id={`event-card-${event._id}`}>
                <div className="event-poster-container">
                  <img
                    src={event.posterUrl}
                    alt={event.name}
                    className="event-poster"
                    onError={(e) => {
                      // Fallback image in case the poster doesn't exist
                      e.target.src = 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=600&q=80';
                    }}
                  />
                </div>
                <div className="event-body">
                  <h3 className="event-title">{event.name}</h3>
                  <p className="event-desc">{event.description}</p>
                  
                  <div className="event-meta">
                    <div className="event-meta-item">
                      <svg className="event-meta-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span>{formatDate(event.dateTime)}</span>
                    </div>

                    <div className="event-meta-item">
                      <svg className="event-meta-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <span>{event.venue}</span>
                    </div>

                    <div className="event-meta-item" style={{ justifyContent: 'space-between', marginTop: '8px' }}>
                      {isEnded ? (
                        <span className="event-seats-tag" style={{ backgroundColor: 'var(--surface-hover)', color: 'var(--text-light)' }}>
                          Ended
                        </span>
                      ) : (
                        <span className={`event-seats-tag ${isSoldOut ? 'soldout' : 'available'}`}>
                          {isSoldOut ? 'Sold Out' : `${event.availableSeatsCount} seats available`}
                        </span>
                      )}
                      
                      <button
                        className={`btn btn-sm ${isEnded ? 'btn-outline' : isSoldOut ? 'btn-outline' : 'btn-primary'}`}
                        disabled={isSoldOut && !isEnded}
                        onClick={() => navigateTo('event-details', { eventId: event._id })}
                      >
                        {isEnded ? 'View Seating' : isSoldOut ? 'Sold Out' : 'Book Tickets'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
