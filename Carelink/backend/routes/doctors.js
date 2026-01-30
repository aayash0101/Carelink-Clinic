const express = require('express');
const router = express.Router();
const {
  getDoctors,
} = require('../controllers/doctorController');

// Public routes
router.get('/', getDoctors);

module.exports = router;

