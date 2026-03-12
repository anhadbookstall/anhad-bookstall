// routes/volunteers.js
const express = require('express');
const router = express.Router();
const {
  getVolunteers, getVolunteer, addVolunteer, updateVolunteer,
  updateVolunteerPhoto, suspendVolunteer, revokeSupension, removeVolunteer,
} = require('../controllers/volunteerController');
const { protect, adminOnly, authenticated } = require('../middleware/auth');
const { uploadVolunteerPhoto } = require('../config/cloudinary');

router.get('/', protect, authenticated, getVolunteers);
router.get('/:id', protect, authenticated, getVolunteer);
router.post('/', protect, adminOnly, addVolunteer);
router.put('/:id', protect, authenticated, updateVolunteer);
router.put('/:id/photo', protect, authenticated, uploadVolunteerPhoto.single('photo'), updateVolunteerPhoto);
router.put('/:id/suspend', protect, adminOnly, suspendVolunteer);
router.put('/:id/revoke', protect, adminOnly, revokeSupension);
router.delete('/:id', protect, adminOnly, removeVolunteer);

module.exports = router;
