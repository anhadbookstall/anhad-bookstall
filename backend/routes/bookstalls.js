// routes/bookstalls.js
const express = require('express');
const router = express.Router();
const {
  getBookstalls, getActiveBookstall, getBookstall,
  startBookstall, closeBookstall, exitBookstall,
  rejoinBookstall, addReflection,
} = require('../controllers/bookstallController');
const { protect, volunteerOnly, authenticated } = require('../middleware/auth');

router.get('/', protect, authenticated, getBookstalls);
router.get('/active', protect, volunteerOnly, getActiveBookstall);
router.get('/:id', protect, authenticated, getBookstall);
router.post('/start', protect, volunteerOnly, startBookstall);
router.put('/:id/close', protect, volunteerOnly, closeBookstall);
router.put('/:id/exit', protect, volunteerOnly, exitBookstall);
router.put('/:id/rejoin', protect, volunteerOnly, rejoinBookstall);
router.post('/:id/reflection', protect, authenticated, addReflection);

module.exports = router;
