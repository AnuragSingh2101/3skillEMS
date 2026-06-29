const express = require('express');
const router = express.Router();
const { getEvents, getEvent, createEvent, updateEvent, deleteEvent } = require('../controllers/eventController');
const { protect, authorize } = require('../middleware/authMiddleware');

router
  .route('/')
  .get(getEvents)
  .post(protect, authorize('organizer'), createEvent);

router
  .route('/:id')
  .get(getEvent)
  .put(protect, authorize('organizer'), updateEvent)
  .delete(protect, authorize('organizer'), deleteEvent);

module.exports = router;
