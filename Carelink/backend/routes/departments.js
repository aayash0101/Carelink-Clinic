const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/categoryController');
const auth = require('../middleware/auth');

const {
  getPublicDepartments,
  createDepartment,
} = ctrl;

router.get('/', getPublicDepartments);
router.post('/', auth.protect, auth.authorize('admin'), createDepartment);

module.exports = router;
