const express = require('express');
const router = express.Router();
const {
  getDoctors,
  getDoctor
} = require('../controllers/doctorController');

// Public routes
router.get('/', getDoctors);
router.get('/:id', getDoctor);

module.exports = router;

