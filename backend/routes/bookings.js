const express = require('express');
const router = express.Router();
const { createBooking, getMyBookings, getBookingDetails, checkInAttendee } = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', authorize('attendee'), createBooking);
router.get('/my', authorize('attendee'), getMyBookings);
router.get('/:id', getBookingDetails);
router.post('/:id/checkin', authorize('organizer'), checkInAttendee);

module.exports = router;
