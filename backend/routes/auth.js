// routes/auth.js
const express = require('express');
const router = express.Router();
const { adminLogin, volunteerGoogleLogin, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/admin/login', adminLogin);
router.post('/volunteer/google', volunteerGoogleLogin);
router.get('/me', protect, getMe);

module.exports = router;
