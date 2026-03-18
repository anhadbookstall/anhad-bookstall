// controllers/volunteerController.js
const Volunteer = require('../models/Volunteer');
const { deletePhoto } = require('../config/cloudinary');

// GET /api/volunteers - All volunteers (admin)
const getVolunteers = async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const volunteers = await Volunteer.find(filter)
    .populate('willingCities', 'name')
    .populate('booksReadByAP', 'title language')
    .sort('name');
  res.json(volunteers);
};

// GET /api/volunteers/:id - Single volunteer
const getVolunteer = async (req, res) => {
  const vol = await Volunteer.findById(req.params.id)
    .populate('willingCities', 'name pinCode')
    .populate('booksReadByAP', 'title language');
  if (!vol) return res.status(404).json({ message: 'Volunteer not found' });
  res.json(vol);
};

// POST /api/volunteers - Add volunteer (admin only)
const addVolunteer = async (req, res) => {
  const {
    name, dateOfInclusion, geetaProfileLink,
    contactNumber, sameAsWhatsApp, whatsappNumber,
    currentCity, gmailId,
  } = req.body;

  const vol = await Volunteer.create({
    name, dateOfInclusion, geetaProfileLink,
    contactNumber, sameAsWhatsApp,
    whatsappNumber: sameAsWhatsApp ? contactNumber : whatsappNumber,
    currentCity, gmailId: gmailId.toLowerCase(),
  });

  res.status(201).json(vol);
};

// PUT /api/volunteers/:id - Update volunteer profile
// Admin can update all fields; volunteer can only update their own profile fields
const updateVolunteer = async (req, res) => {
  const vol = await Volunteer.findById(req.params.id);
  if (!vol) return res.status(404).json({ message: 'Volunteer not found' });

  // Volunteers can only update their own profile
  if (req.user.role === 'volunteer' && req.user.id !== req.params.id) {
    return res.status(403).json({ message: 'Cannot update another volunteer\'s profile' });
  }

  // Volunteer-editable fields only
  const allowedVolunteerFields = ['profession', 'booksReadByAP', 'booksReadRecommendedByAP', 'willingCities', 'currentCity'];
  const updates = req.user.role === 'admin' ? req.body : {};

  if (req.user.role === 'volunteer') {
    allowedVolunteerFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });
  }

  Object.assign(vol, updates);
  await vol.save();
  res.json(vol);
};

// PUT /api/volunteers/:id/photo - Update profile photo
const updateVolunteerPhoto = async (req, res) => {
  const vol = await Volunteer.findById(req.params.id);
  if (!vol) return res.status(404).json({ message: 'Volunteer not found' });

  // Delete old photo from Cloudinary
  if (vol.profilePhoto?.publicId) {
    await deletePhoto(vol.profilePhoto.publicId);
  }

  vol.profilePhoto = {
    url: req.file.path,
    publicId: req.file.filename,
  };
  await vol.save();
  res.json({ profilePhoto: vol.profilePhoto });
};

// PUT /api/volunteers/:id/suspend - Suspend volunteer (admin)
const suspendVolunteer = async (req, res) => {
  const vol = await Volunteer.findByIdAndUpdate(
    req.params.id, { status: 'suspended' }, { new: true }
  );
  if (!vol) return res.status(404).json({ message: 'Volunteer not found' });
  res.json({ message: 'Volunteer suspended', volunteer: vol });
};

// PUT /api/volunteers/:id/revoke - Revoke suspension (admin)
const revokeSupension = async (req, res) => {
  const vol = await Volunteer.findByIdAndUpdate(
    req.params.id, { status: 'active' }, { new: true }
  );
  if (!vol) return res.status(404).json({ message: 'Volunteer not found' });
  res.json({ message: 'Suspension revoked', volunteer: vol });
};

// DELETE /api/volunteers/:id - Remove volunteer (admin)
const removeVolunteer = async (req, res) => {
  const vol = await Volunteer.findByIdAndUpdate(
    req.params.id, { status: 'removed' }, { new: true }
  );
  if (!vol) return res.status(404).json({ message: 'Volunteer not found' });
  res.json({ message: 'Volunteer removed' });
};


// PUT /api/volunteers/:id/toggle-lead - Toggle Bookstall Lead tag (admin)
const toggleBookstallLead = async (req, res) => {
  const vol = await Volunteer.findById(req.params.id);
  if (!vol) return res.status(404).json({ message: 'Volunteer not found' });
  vol.isBookstallLead = !vol.isBookstallLead;
  await vol.save();
  res.json({
    message: vol.isBookstallLead
      ? `${vol.name} is now a Bookstall Lead`
      : `Bookstall Lead tag removed from ${vol.name}`,
    volunteer: vol,
  });
};

module.exports = {
  getVolunteers, getVolunteer, addVolunteer, updateVolunteer,
  updateVolunteerPhoto, suspendVolunteer, revokeSupension, removeVolunteer, toggleBookstallLead,
};