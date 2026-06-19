import React from 'react';

export const BookingConfirmationPage = ({ navigateTo, params }) => {
  const { bookingDetails } = params || {};

  if (!bookingDetails) {
    navigateTo('events');
    return null;
  }

  const { bookingId, seatNumbers, bookedAt, event } = bookingDetails;

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  return (
    <div className="container">
      <div className="confirmation-container">
        <div className="success-icon-container">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1 className="confirmation-title">Booking Confirmed!</h1>
        <p className="confirmation-subtitle">
          Your ticket reservation has been securely completed. We've sent the details to your email.
        </p>

        <div className="booking-details-box">
          <h4 className="details-title">Transaction Receipt</h4>
          
          <div className="detail-item">
            <span className="detail-label">Booking ID</span>
            <span className="detail-value" id="confirm-booking-id" style={{ fontFamily: 'monospace', fontSize: '15px' }}>
              {bookingId}
            </span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Event</span>
            <span className="detail-value">{event.name}</span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Date & Time</span>
            <span className="detail-value">{formatDate(event.dateTime)}</span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Venue</span>
            <span className="detail-value">{event.venue}</span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Booked Seats</span>
            <span className="detail-value seats" style={{ color: 'var(--accent)' }}>
              {seatNumbers.join(', ')}
            </span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Transaction Time</span>
            <span className="detail-value">{formatDate(bookedAt)}</span>
          </div>
        </div>

        <button
          id="confirm-done-btn"
          className="btn btn-primary"
          onClick={() => navigateTo('events')}
        >
          Go Back to Events
        </button>
      </div>
    </div>
  );
};
