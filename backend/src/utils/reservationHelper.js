const Reservation = require('../models/Reservation');
const Seat = require('../models/Seat');

/**
 * Automatically releases seats from expired reservations and deletes the reservation logs.
 * Can be run globally or filtered by eventId.
 */
const releaseExpiredReservations = async (eventId = null) => {
  try {
    const query = { expiresAt: { $lte: new Date() } };
    if (eventId) {
      query.eventId = eventId;
    }

    // Find all expired reservations
    const expiredReservations = await Reservation.find(query);

    if (expiredReservations.length === 0) {
      return;
    }

    console.log(`Found ${expiredReservations.length} expired reservations to clean up...`);

    // Revert seats to 'available' for each expired reservation
    for (const res of expiredReservations) {
      const result = await Seat.updateMany(
        {
          eventId: res.eventId,
          seatNumber: { $in: res.seatNumbers },
          status: 'reserved',
        },
        { status: 'available' }
      );
      console.log(
        `Released ${result.modifiedCount} seats for event ${res.eventId} from expired reservation.`
      );
    }

    // Delete the expired reservations
    const deleteResult = await Reservation.deleteMany({
      _id: { $in: expiredReservations.map((r) => r._id) },
    });
    console.log(`Deleted ${deleteResult.deletedCount} expired reservation records.`);
  } catch (error) {
    console.error('Error releasing expired reservations:', error);
  }
};

module.exports = {
  releaseExpiredReservations,
};
