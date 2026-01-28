const express = require('express');
const router = express.Router();
const { 
    updateProfile, 
    updatePassword, 
    setup2FA, 
    enable2FA,
    disable2FA 
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.put('/profile', protect, updateProfile);
router.put('/password', protect, updatePassword);

// 2FA Routes
router.post('/2fa/setup', protect, setup2FA);
router.post('/2fa/enable', protect, enable2FA);
router.post('/2fa/disable', disable2FA);

module.exports = router;

