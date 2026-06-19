import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useReservationTimer } from '../hooks/useReservationTimer';
import * as api from '../services/api';

export const EventDetailsPage = ({ navigateTo, params }) => {
  const { eventId } = params || {};
  const { user } = useContext(AuthContext);

  const [event, setEvent] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [warningMessage, setWarningMessage] = useState('');
  const [shareSuccess, setShareSuccess] = useState(false);

  // Active reservation details
  const [activeReservation, setActiveReservation] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Hook for the reservation countdown
  const { formattedTime, isExpired } = useReservationTimer(
    activeReservation?.expiresAt,
    () => {
      // Expiry callback
      setError('Your 10-minute reservation has expired. The seats have been released.');
      setActiveReservation(null);
      setSelectedSeats([]);
      fetchSeatMap(true); // force quiet refresh
    }
  );

  // Handle sharing event link
  const handleShare = () => {
    const shareUrl = `${window.location.origin}?event=${eventId}`;
    navigator.clipboard.writeText(shareUrl);
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 3000);
  };

  // Fetch event details and seat map
  const fetchEventData = async () => {
    try {
      const eventData = await api.getEventById(eventId);
      setEvent(eventData);
    } catch (err) {
      console.error(err);
      setError('Failed to load event details.');
    }
  };

  const fetchSeatMap = async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const seatData = await api.getEventSeats(eventId);
      
      // If user has selected seats locally but not reserved them yet,
      // verify that they haven't been taken in the background
      if (selectedSeats.length > 0 && !activeReservation) {
        const takenSeats = [];
        const updatedSelected = selectedSeats.filter((seatNum) => {
          const matchedDbSeat = seatData.find((s) => s.seatNumber === seatNum);
          if (matchedDbSeat && matchedDbSeat.status !== 'available') {
            takenSeats.push(seatNum);
            return false;
          }
          return true;
        });

        if (takenSeats.length > 0) {
          setSelectedSeats(updatedSelected);
          setWarningMessage(
            `The following seat(s) became unavailable and were removed: ${takenSeats.join(', ')}`
          );
          setTimeout(() => setWarningMessage(''), 8000);
        }
      }

      setSeats(seatData);
    } catch (err) {
      console.error(err);
      if (!quiet) setError('Failed to retrieve seat availability map.');
    } finally {
      if (!quiet) setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (!eventId) {
      navigateTo('events');
      return;
    }

    const init = async () => {
      setLoading(true);
      await Promise.all([fetchEventData(), fetchSeatMap(true)]);
      setLoading(false);
    };

    init();
  }, [eventId]);

  // Live seat status polling every 15 seconds
  useEffect(() => {
    if (!eventId) return;

    const interval = setInterval(() => {
      fetchSeatMap(true);
    }, 15000);

    return () => clearInterval(interval);
  }, [eventId, selectedSeats, activeReservation]);

  const handleSeatClick = (seat) => {
    // Disable seat selection if event has ended
    const isEnded = event && new Date(event.dateTime) < new Date();
    if (isEnded) return;

    // If seats are currently reserved, lock selection
    if (activeReservation) return;

    if (seat.status !== 'available') return;

    const seatNum = seat.seatNumber;
    if (selectedSeats.includes(seatNum)) {
      setSelectedSeats(selectedSeats.filter((s) => s !== seatNum));
    } else {
      setSelectedSeats([...selectedSeats, seatNum]);
    }
  };

  const handleReserve = async () => {
    if (selectedSeats.length === 0) return;
    setError('');
    setWarningMessage('');
    setSubmitting(true);

    try {
      const res = await api.reserveSeats(eventId, selectedSeats);
      setActiveReservation({
        id: res.reservationId,
        expiresAt: res.expiresAt,
        seatNumbers: res.seatNumbers,
      });
      // Update seat map local status to reserved for these seats
      setSeats((prevSeats) =>
        prevSeats.map((s) =>
          selectedSeats.includes(s.seatNumber) ? { ...s, status: 'reserved' } : s
        )
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to hold seats. They might be taken.');
      fetchSeatMap(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!activeReservation) return;
    setError('');
    setSubmitting(true);

    try {
      const res = await api.confirmBooking(activeReservation.id);
      navigateTo('booking-confirmation', { bookingDetails: res });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to confirm booking.');
      // Clean up reservation state since it might have expired on server
      setActiveReservation(null);
      setSelectedSeats([]);
      fetchSeatMap();
    } finally {
      setSubmitting(false);
    }
  };

  // Compute analytics dynamically
  const analytics = {
    total: seats.length,
    available: seats.filter((s) => s.status === 'available').length,
    reserved: seats.filter((s) => s.status === 'reserved').length,
    booked: seats.filter((s) => s.status === 'booked').length,
  };

  if (loading && !event) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading event details...</p>
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="container">
      {/* Breadcrumb / Nav */}
      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <a
          id="back-to-events-btn"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigateTo('events');
          }}
          className="btn btn-sm"
        >
          &larr; Back to Events
        </a>
        <button
          id="share-event-btn"
          onClick={handleShare}
          className="btn btn-sm btn-outline"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          Share Event
        </button>
      </div>

      <div className="event-detail-layout">
        {/* Main Details and Seat Map */}
        <div>
          {/* Event Hero */}
          <div className="event-hero">
            <img
              src={event.posterUrl}
              alt={event.name}
              className="event-hero-poster"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1200&q=80';
              }}
            />
            <div className="event-hero-info">
              <h1 className="event-hero-title">{event.name}</h1>
              <p className="event-hero-desc">{event.description}</p>
              
              <div style={{ display: 'flex', gap: '24px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  {new Date(event.dateTime).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {event.venue}
                </span>
              </div>
            </div>
          </div>

          {/* Analytics Cards */}
          <div className="analytics-grid">
            <div className="analytics-card" id="analytics-total">
              <div className="analytics-value">{analytics.total}</div>
              <div className="analytics-label">Total Seats</div>
            </div>
            <div className="analytics-card" id="analytics-available" style={{ borderLeft: '3px solid var(--border-focus)' }}>
              <div className="analytics-value" style={{ color: 'var(--text-primary)' }}>{analytics.available}</div>
              <div className="analytics-label">Available</div>
            </div>
            <div className="analytics-card" id="analytics-reserved" style={{ borderLeft: '3px solid var(--warning)' }}>
              <div className="analytics-value" style={{ color: 'var(--warning)' }}>{analytics.reserved}</div>
              <div className="analytics-label">Reserved</div>
            </div>
            <div className="analytics-card" id="analytics-booked" style={{ borderLeft: '3px solid var(--error)' }}>
              <div className="analytics-value" style={{ color: 'var(--error)' }}>{analytics.booked}</div>
              <div className="analytics-label">Booked</div>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="alert alert-danger" id="details-error-alert">
              {error}
            </div>
          )}

          {event && new Date(event.dateTime) < new Date() && (
            <div className="alert alert-warning" id="event-ended-alert">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginTop: '2px' }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>This event has ended. Seating maps are view-only.</span>
            </div>
          )}

          {shareSuccess && (
            <div className="alert" style={{ backgroundColor: 'var(--success-light)', border: '1px solid var(--success)', color: 'var(--success)' }} id="share-success-alert">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Event booking link copied to clipboard!</span>
            </div>
          )}

          {!user && (
            <div className="alert alert-info" id="guest-view-alert">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginTop: '2px' }}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span><strong>Viewing as guest.</strong> You can explore and select seats. Sign in to place reservations.</span>
            </div>
          )}

          {warningMessage && (
            <div className="alert alert-warning" id="details-warning-alert">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginTop: '2px' }}>
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>{warningMessage}</span>
            </div>
          )}

          {/* Seat Map */}
          <div className="seat-map-container">
            <div className="screen-indicator"></div>
            <div className="screen-text">Stage / Screen</div>

            {seats.length === 0 ? (
              <p>Loading seating grid...</p>
            ) : (
              <div className="seat-grid">
                {seats.map((seat) => {
                  const isSelected = selectedSeats.includes(seat.seatNumber);
                  
                  // Determine seat status class
                  let statusClass = 'available';
                  if (isSelected) {
                    statusClass = 'selected';
                  } else {
                    statusClass = seat.status; // 'available', 'reserved', 'booked'
                  }

                  return (
                    <button
                      key={seat._id}
                      className={`seat ${statusClass}`}
                      onClick={() => handleSeatClick(seat)}
                      disabled={seat.status === 'booked' || (seat.status === 'reserved' && !isSelected)}
                      title={`Seat ${seat.seatNumber} (${seat.status})`}
                      id={`seat-${seat.seatNumber}`}
                    >
                      {seat.seatNumber}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Legend */}
            <div className="legend">
              <div className="legend-item">
                <span className="legend-color available"></span>
                <span>Available</span>
              </div>
              <div className="legend-item">
                <span className="legend-color selected"></span>
                <span>Selected</span>
              </div>
              <div className="legend-item">
                <span className="legend-color reserved"></span>
                <span>Reserved</span>
              </div>
              <div className="legend-item">
                <span className="legend-color booked"></span>
                <span>Booked</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Summary */}
        <div className="booking-panel">
          <h3 className="panel-title">Booking Summary</h3>

          {event && new Date(event.dateTime) < new Date() ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
                <strong>Booking Closed</strong><br />
                This event took place on {new Date(event.dateTime).toLocaleDateString('en-US', { dateStyle: 'long' })}.
              </p>
            </div>
          ) : selectedSeats.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center', margin: '24px 0' }}>
              Select seats from the grid to begin booking
            </p>
          ) : (
            <div>
              <div className="summary-row">
                <span>Selected Seats:</span>
                <span className="detail-value">{selectedSeats.length}</span>
              </div>
              
              <div className="selected-seats-badges">
                {selectedSeats.map((seat) => (
                  <span key={seat} className="seat-badge">
                    {seat}
                  </span>
                ))}
              </div>

              {activeReservation && (
                <div className="timer-container" id="reservation-timer">
                  <svg className="timer-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>
                    Seats held! Confirm booking in: <strong>{formattedTime}</strong>
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              {!user ? (
                <button
                  id="guest-signin-btn"
                  className="btn btn-primary btn-block"
                  onClick={() => navigateTo('login', { fromEventId: eventId })}
                >
                  Sign in to Reserve Seats
                </button>
              ) : !activeReservation ? (
                <button
                  id="reserve-seats-btn"
                  className="btn btn-primary btn-block"
                  onClick={handleReserve}
                  disabled={selectedSeats.length === 0 || submitting}
                >
                  {submitting ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <span className="spinner-sm"></span> Reserving...
                    </span>
                  ) : (
                    'Reserve Selected Seats'
                  )}
                </button>
              ) : (
                <button
                  id="confirm-booking-btn"
                  className="btn btn-primary btn-block"
                  style={{ backgroundColor: 'var(--success)', borderColor: 'var(--success)' }}
                  onClick={handleConfirmBooking}
                  disabled={submitting}
                >
                  {submitting ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <span className="spinner-sm"></span> Processing...
                    </span>
                  ) : (
                    'Confirm & Pay Ticket'
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
