// routes/cities.js
const express = require('express');
const router = express.Router();
const { getCities, addCity, deleteCity } = require('../controllers/cityController');
const { protect, adminOnly, authenticated } = require('../middleware/auth');

router.get('/', protect, authenticated, getCities);
router.post('/', protect, adminOnly, addCity);
router.delete('/:id', protect, adminOnly, deleteCity);

module.exports = router;
