const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    seatNumbers: {
      type: [String],
      required: true,
      validate: [
        (val) => val.length > 0,
        'Please specify at least one seat number',
      ],
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index to automatically clear expired reservations or query expired items quickly
reservationSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('Reservation', reservationSchema);
