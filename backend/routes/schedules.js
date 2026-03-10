// routes/schedules.js
const express = require('express');
const router = express.Router();
const { getSchedules, addSchedule, updateSchedule, deleteSchedule } = require('../controllers/scheduleController');
const { protect, adminOnly, authenticated } = require('../middleware/auth');

router.get('/', protect, authenticated, getSchedules);
router.post('/', protect, adminOnly, addSchedule);
router.put('/:id', protect, adminOnly, updateSchedule);
router.delete('/:id', protect, adminOnly, deleteSchedule);

module.exports = router;
