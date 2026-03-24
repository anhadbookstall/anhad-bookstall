const express = require('express');
const router = express.Router();
const { getCurrentTheme, getAllThemes, setTheme, deleteTheme } = require('../controllers/monthlyThemeController');
const { protect, adminOnly, authenticated } = require('../middleware/auth');

router.get('/current', protect, authenticated, getCurrentTheme);
router.get('/', protect, adminOnly, getAllThemes);
router.post('/', protect, adminOnly, setTheme);
router.delete('/:id', protect, adminOnly, deleteTheme);

module.exports = router;