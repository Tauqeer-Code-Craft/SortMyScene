const Event = require('../models/Event');
const Seat = require('../models/Seat');
const { releaseExpiredReservations } = require('../utils/reservationHelper');

// @desc    Get all events with available seat counts
// @route   GET /api/events
// @access  Public
const getEvents = async (req, res) => {
  try {
    // Release any expired reservations before counting available seats
    await releaseExpiredReservations();

    const events = await Event.find({}).sort({ dateTime: 1 });

    // For each event, count available seats
    const eventsWithSeats = await Promise.all(
      events.map(async (event) => {
        const availableSeatsCount = await Seat.countDocuments({
          eventId: event._id,
          status: 'available',
        });
        return {
          ...event.toObject(),
          availableSeatsCount,
        };
      })
    );

    res.json(eventsWithSeats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving events' });
  }
};

// @desc    Get event details
// @route   GET /api/events/:id
// @access  Public
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.status(500).json({ message: 'Server error retrieving event details' });
  }
};

// @desc    Get seat map for event
// @route   GET /api/events/:id/seats
// @access  Public
const getEventSeats = async (req, res) => {
  try {
    const eventId = req.params.id;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Release expired reservations for this event specifically
    await releaseExpiredReservations(eventId);

    // Fetch all seats for the event
    const seats = await Seat.find({ eventId }).sort({ seatNumber: 1 });

    res.json(seats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving seat map' });
  }
};

module.exports = {
  getEvents,
  getEventById,
  getEventSeats,
};
