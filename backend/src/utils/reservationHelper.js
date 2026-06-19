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

    if (eventId) {
      // Optimize for specific eventId: a single bulk update
      const allSeatNumbers = Array.from(new Set(expiredReservations.flatMap((r) => r.seatNumbers)));
      if (allSeatNumbers.length > 0) {
        const result = await Seat.updateMany(
          {
            eventId,
            seatNumber: { $in: allSeatNumbers },
            status: 'reserved',
          },
          { status: 'available' }
        );
        console.log(`Released ${result.modifiedCount} seats for event ${eventId} in bulk.`);
      }
    } else {
      // Global clean up: use bulkWrite to run updates in parallel in one DB roundtrip
      const bulkUpdates = expiredReservations.map((res) => ({
        updateMany: {
          filter: {
            eventId: res.eventId,
            seatNumber: { $in: res.seatNumbers },
            status: 'reserved',
          },
          update: { status: 'available' },
        },
      }));
      await Seat.bulkWrite(bulkUpdates);
      console.log(`Released seats for ${expiredReservations.length} reservations in bulk.`);
    }

    // Delete the expired reservations in one query
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
