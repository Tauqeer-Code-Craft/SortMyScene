const mongoose = require('mongoose');
const Seat = require('../models/Seat');
const Reservation = require('../models/Reservation');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const { releaseExpiredReservations } = require('../utils/reservationHelper');

// Helper to generate a clean booking ID (e.g. BK-7F9A3B)
const generateBookingId = () => {
  return `BK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
};

// @desc    Reserve seats for 10 minutes
// @route   POST /api/reserve
// @access  Protected
const reserveSeats = async (req, res) => {
  const { eventId, seatNumbers } = req.body;
  const userId = req.user._id;

  if (!eventId || !seatNumbers || !Array.isArray(seatNumbers) || seatNumbers.length === 0) {
    return res.status(400).json({ message: 'Event ID and seat numbers are required' });
  }

  // First, release all expired reservations to ensure data is fresh
  await releaseExpiredReservations(eventId);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Release any existing reservations for this user and event to free up their previous choices
    const existingReservations = await Reservation.find({ userId, eventId }).session(session);
    if (existingReservations.length > 0) {
      for (const existing of existingReservations) {
        await Seat.updateMany(
          {
            eventId,
            seatNumber: { $in: existing.seatNumbers },
            status: 'reserved',
          },
          { status: 'available' }
        ).session(session);
      }
      await Reservation.deleteMany({ userId, eventId }).session(session);
    }

    // 2. Fetch the seats user wants to reserve
    const seats = await Seat.find({
      eventId,
      seatNumber: { $in: seatNumbers },
    }).session(session);

    // Verify all seats exist
    if (seats.length !== seatNumbers.length) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'One or more of the selected seats do not exist' });
    }

    // Verify all seats are available
    const unavailableSeats = seats.filter((seat) => seat.status !== 'available');
    if (unavailableSeats.length > 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: 'Some of the selected seats are no longer available',
        unavailableSeats: unavailableSeats.map((s) => s.seatNumber),
      });
    }

    // 3. Atomically update seat statuses to 'reserved'
    await Seat.updateMany(
      {
        eventId,
        seatNumber: { $in: seatNumbers },
      },
      { status: 'reserved' }
    ).session(session);

    // 4. Create reservation document (expires in 10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const reservation = new Reservation({
      userId,
      eventId,
      seatNumbers,
      expiresAt,
    });
    await reservation.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      message: 'Seats reserved successfully',
      reservationId: reservation._id,
      expiresAt,
      seatNumbers,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Reservation Error:', error);
    res.status(500).json({ message: `Error making reservation: ${error.message}` });
  }
};

// @desc    Confirm booking from a valid reservation
// @route   POST /api/bookings
// @access  Protected
const confirmBooking = async (req, res) => {
  const { reservationId } = req.body;
  const userId = req.user._id;

  if (!reservationId) {
    return res.status(400).json({ message: 'Reservation ID is required' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Find the reservation
    const reservation = await Reservation.findById(reservationId).session(session);

    if (!reservation) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Reservation not found or has already been booked' });
    }

    // 2. Verify reservation owner
    if (reservation.userId.toString() !== userId.toString()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ message: 'Not authorized to book this reservation' });
    }

    // 3. Verify reservation has not expired
    if (reservation.expiresAt < new Date()) {
      // If expired, release the seats and delete the reservation
      await Seat.updateMany(
        {
          eventId: reservation.eventId,
          seatNumber: { $in: reservation.seatNumbers },
          status: 'reserved',
        },
        { status: 'available' }
      ).session(session);

      await Reservation.findByIdAndDelete(reservationId).session(session);

      await session.commitTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Your reservation has expired. Please select seats again.' });
    }

    // 4. Update seats from 'reserved' to 'booked'
    await Seat.updateMany(
      {
        eventId: reservation.eventId,
        seatNumber: { $in: reservation.seatNumbers },
        status: 'reserved', // extra safety: only update if they were indeed reserved
      },
      { status: 'booked' }
    ).session(session);

    // 5. Create the Booking
    const bookingId = generateBookingId();
    const booking = new Booking({
      bookingId,
      userId,
      eventId: reservation.eventId,
      seatNumbers: reservation.seatNumbers,
      bookedAt: new Date(),
    });
    await booking.save({ session });

    // 6. Delete the Reservation
    await Reservation.findByIdAndDelete(reservationId).session(session);

    // Fetch event details for the return payload
    const event = await Event.findById(reservation.eventId).session(session);

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      message: 'Booking confirmed successfully',
      bookingId: booking.bookingId,
      seatNumbers: booking.seatNumbers,
      bookedAt: booking.bookedAt,
      event: {
        name: event.name,
        venue: event.venue,
        dateTime: event.dateTime,
        posterUrl: event.posterUrl,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Booking Confirmation Error:', error);
    res.status(500).json({ message: `Error confirming booking: ${error.message}` });
  }
};

// @desc    Get current user's bookings
// @route   GET /api/bookings/my
// @access  Protected
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id })
      .populate('eventId')
      .sort({ bookedAt: -1 });

    const formattedBookings = bookings.map((b) => {
      if (!b.eventId) {
        return {
          bookingId: b.bookingId,
          seatNumbers: b.seatNumbers,
          bookedAt: b.bookedAt,
          event: {
            name: 'Unknown Event',
            venue: 'Unknown Venue',
            dateTime: null,
            posterUrl: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=600&q=80',
          },
        };
      }
      return {
        bookingId: b.bookingId,
        seatNumbers: b.seatNumbers,
        bookedAt: b.bookedAt,
        event: {
          name: b.eventId.name,
          venue: b.eventId.venue,
          dateTime: b.eventId.dateTime,
          posterUrl: b.eventId.posterUrl,
        },
      };
    });

    res.json(formattedBookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: `Error retrieving bookings: ${error.message}` });
  }
};

module.exports = {
  reserveSeats,
  confirmBooking,
  getMyBookings,
};
