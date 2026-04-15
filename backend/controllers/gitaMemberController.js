// controllers/gitaMemberController.js
const GitaMember = require('../models/GitaMember');
const Volunteer = require('../models/Volunteer');
const Notification = require('../models/Notification');

// POST /api/gita-members/apply - Public application (no login required)
const applyMembership = async (req, res) => {
  const { name, gmailId, geetaProfileLink, contactNumber, sameAsWhatsApp, whatsappNumber, currentCity, whyJoin } = req.body;

  if (!name || !gmailId) {
    return res.status(400).json({ message: 'Name and Gmail are required' });
  }

  // Check if already applied or is a volunteer
  const existingMember = await GitaMember.findOne({ gmailId: gmailId.toLowerCase() });
  if (existingMember) {
    return res.status(400).json({ message: 'An application with this Gmail already exists' });
  }
  const existingVol = await Volunteer.findOne({ gmailId: gmailId.toLowerCase() });
  if (existingVol) {
    return res.status(400).json({ message: 'This Gmail is already registered as a volunteer' });
  }

  const member = await GitaMember.create({
    name, gmailId: gmailId.toLowerCase(),
    geetaProfileLink, contactNumber,
    sameAsWhatsApp: sameAsWhatsApp !== false,
    whatsappNumber: sameAsWhatsApp !== false ? contactNumber : whatsappNumber,
    currentCity, whyJoin,
  });

  // Notify admin
  await Notification.create({
    recipient: 'admin',
    type: 'new_application',
    title: 'New Volunteer Application',
    message: `${name} has applied to join as a Gita Member volunteer.`,
    relatedId: member._id,
  });

  res.status(201).json({ message: 'Application submitted successfully! Admin will review your request.' });
};

// GET /api/gita-members - Get all gita members (admin)
const getGitaMembers = async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};
  const members = await GitaMember.find(filter).sort('-appliedAt');
  res.json(members);
};

// PUT /api/gita-members/:id/approve - Approve application (admin)
const approveMember = async (req, res) => {
  const member = await GitaMember.findByIdAndUpdate(
    req.params.id,
    { status: 'active', approvedAt: new Date() },
    { new: true }
  );
  if (!member) return res.status(404).json({ message: 'Member not found' });
  res.json({ message: `${member.name} approved as Gita Member`, member });
};

// PUT /api/gita-members/:id/reject - Reject application (admin)
const rejectMember = async (req, res) => {
  const member = await GitaMember.findByIdAndUpdate(
    req.params.id,
    { status: 'rejected' },
    { new: true }
  );
  if (!member) return res.status(404).json({ message: 'Member not found' });
  res.json({ message: `${member.name}'s application rejected`, member });
};

// PUT /api/gita-members/:id/promote - Promote Gita Member to Volunteer (admin)
const promoteToVolunteer = async (req, res) => {
  const member = await GitaMember.findById(req.params.id);
  if (!member) return res.status(404).json({ message: 'Member not found' });
  if (member.status !== 'active') {
    return res.status(400).json({ message: 'Only active Gita Members can be promoted' });
  }

  // Create volunteer from gita member data
  const volunteer = await Volunteer.create({
    name: member.name,
    gmailId: member.gmailId,
    googleId: member.googleId,
    geetaProfileLink: member.geetaProfileLink,
    contactNumber: member.contactNumber,
    sameAsWhatsApp: member.sameAsWhatsApp,
    whatsappNumber: member.whatsappNumber,
    currentCity: member.currentCity,
    profilePhoto: member.profilePhoto,
    dateOfInclusion: new Date(),
  });

  // Remove gita member record
  await GitaMember.findByIdAndUpdate(req.params.id, { status: 'removed' });

  res.json({ message: `${member.name} promoted to Volunteer successfully`, volunteer });
};

// DELETE /api/gita-members/:id - Remove member (admin)
const removeMember = async (req, res) => {
  await GitaMember.findByIdAndUpdate(req.params.id, { status: 'removed' });
  res.json({ message: 'Member removed' });
};

// GET /api/gita-members/pending-count - Count of pending applications (for badge)
const getPendingCount = async (req, res) => {
  const count = await GitaMember.countDocuments({ status: 'pending' });
  res.json({ count });
};

module.exports = {
  applyMembership, getGitaMembers, approveMember,
  rejectMember, promoteToVolunteer, removeMember, getPendingCount,
};