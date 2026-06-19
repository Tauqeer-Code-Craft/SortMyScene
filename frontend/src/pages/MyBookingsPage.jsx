import React, { useState, useEffect } from 'react';
import * as api from '../services/api';

export const MyBookingsPage = ({ navigateTo }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const data = await api.getMyBookings();
        setBookings(data);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Failed to load your booking history.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Retrieving your bookings...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ marginTop: '24px' }}>
        <a
          id="bookings-back-to-events"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigateTo('events');
          }}
          className="btn btn-sm"
        >
          &larr; Back to Events
        </a>
      </div>

      <div className="header-section">
        <div>
          <h1 className="page-title">My Registered Events</h1>
          <p className="page-subtitle">View your booked tickets and active registrations</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" id="bookings-error-alert">
          {error}
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="alert alert-info" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p style={{ marginBottom: '16px' }}>You haven't booked any event tickets yet.</p>
          <button className="btn btn-primary" onClick={() => navigateTo('events')}>
            Browse Events
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', marginTop: '24px', marginBottom: '64px' }}>
          {bookings.map((booking) => (
            <div
              key={booking.bookingId}
              className="booking-history-card"
              style={{
                display: 'flex',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--background)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)',
              }}
              id={`booking-card-${booking.bookingId}`}
            >
              {/* Event Poster thumbnail */}
              <div style={{ width: '150px', minWidth: '150px', height: '150px', backgroundColor: 'var(--surface)' }}>
                <img
                  src={booking.event.posterUrl}
                  alt={booking.event.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=300&q=80';
                  }}
                />
              </div>

              {/* Booking metadata */}
              <div style={{ padding: '20px', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>{booking.event.name}</h3>
                    <span className="badge badge-warning" style={{ fontFamily: 'monospace', fontSize: '13px', border: '1px solid var(--warning)' }}>
                      ID: {booking.bookingId}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '16px', marginTop: '12px', flexWrap: 'wrap', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      {formatDate(booking.event.dateTime)}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      {booking.event.venue}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Booked on: <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{formatDate(booking.bookedAt)}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', marginRight: '8px' }}>Seats:</span>
                    <span style={{ fontWeight: '600', color: 'var(--accent)', fontSize: '15px' }}>{booking.seatNumbers.join(', ')}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
