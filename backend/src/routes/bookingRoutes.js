const express = require('express');
const router = express.Router();
const { reserveSeats, confirmBooking, getMyBookings } = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

router.post('/reserve', protect, reserveSeats);
router.post('/bookings', protect, confirmBooking);
router.get('/bookings/my', protect, getMyBookings);

module.exports = router;
