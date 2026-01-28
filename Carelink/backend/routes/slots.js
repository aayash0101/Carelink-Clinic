const express = require('express');
const router = express.Router();
const { getAvailableSlots } = require('../controllers/slotController');

// Public route
router.get('/', getAvailableSlots);

module.exports = router;

