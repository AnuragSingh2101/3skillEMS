const express = require('express');
const router = express.Router();
const { getOrganizerAnalytics } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, authorize('organizer'), getOrganizerAnalytics);

module.exports = router;
