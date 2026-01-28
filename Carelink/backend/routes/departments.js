const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/categoryController');
const auth = require('../middleware/auth');

const {
  getPublicDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = ctrl;

const { protect, authorize } = auth;

router.get('/', getPublicDepartments);


router.post('/', protect, authorize('admin'), createDepartment);
router.patch('/:id', protect, authorize('admin'), updateDepartment);
router.delete('/:id', protect, authorize('admin'), deleteDepartment);

module.exports = router;
