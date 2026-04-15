// routes/gitaMembers.js
const express = require('express');
const router = express.Router();
const {
  applyMembership, getGitaMembers, approveMember,
  rejectMember, promoteToVolunteer, removeMember, getPendingCount,
} = require('../controllers/gitaMemberController');
const { protect, adminOnly } = require('../middleware/auth');

// Public route - no auth required
router.post('/apply', applyMembership);

// Admin routes
router.get('/', protect, adminOnly, getGitaMembers);
router.get('/pending-count', protect, adminOnly, getPendingCount);
router.put('/:id/approve', protect, adminOnly, approveMember);
router.put('/:id/reject', protect, adminOnly, rejectMember);
router.put('/:id/promote', protect, adminOnly, promoteToVolunteer);
router.delete('/:id', protect, adminOnly, removeMember);

module.exports = router;