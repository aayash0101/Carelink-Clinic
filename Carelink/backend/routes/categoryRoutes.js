const express = require('express');
const router = express.Router();

const { getPublicCategories } = require('../controllers/categoryController');

router.get('/', getPublicCategories);

module.exports = router;
