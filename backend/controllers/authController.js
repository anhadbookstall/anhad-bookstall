// controllers/authController.js
// Handles:
//   - Admin: username/password login
//   - Volunteer: Google OAuth 2.0 login
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const Volunteer = require('../models/Volunteer');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper: Generate JWT token (expires in 7 days)
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// ---- Admin Login ----
// POST /api/auth/admin/login
// Body: { username, password }
const adminLogin = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password required' });
  }

  // Admin credentials are stored in environment variables (not in DB)
  if (
    username !== process.env.ADMIN_USERNAME ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return res.status(401).json({ message: 'Invalid admin credentials' });
  }

  const token = generateToken('admin', 'admin');
  res.json({
    token,
    user: { role: 'admin', username: process.env.ADMIN_USERNAME },
  });
};

// ---- Volunteer Google OAuth Login ----
// POST /api/auth/volunteer/google
// Body: { credential } - The ID token from Google Sign-In button
const volunteerGoogleLogin = async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ message: 'Google credential token required' });
  }

  // Verify the Google ID token
  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  const { sub: googleId, email, name, picture } = payload;

  // Check if volunteer exists in system (admin must have pre-registered them)
  const volunteer = await Volunteer.findOne({ gmailId: email.toLowerCase() });

  if (!volunteer) {
    return res.status(403).json({
      message: 'Your Gmail is not registered. Please contact admin.',
    });
  }

  if (volunteer.status === 'suspended') {
    return res.status(403).json({ message: 'Your account is suspended. Contact admin.' });
  }

  if (volunteer.status === 'removed') {
    return res.status(403).json({ message: 'Your account has been removed.' });
  }

  // Save Google ID for future logins
  if (!volunteer.googleId) {
    volunteer.googleId = googleId;
    // Set profile photo from Google if not already set
    if (!volunteer.profilePhoto?.url && picture) {
      volunteer.profilePhoto = { url: picture, publicId: null };
    }
    await volunteer.save();
  }

  const token = generateToken(volunteer._id, 'volunteer');

  res.json({
    token,
    user: {
      role: 'volunteer',
      id: volunteer._id,
      name: volunteer.name,
      email: volunteer.gmailId,
      profilePhoto: volunteer.profilePhoto,
    },
  });
};

// ---- Get Current User ----
// GET /api/auth/me - Returns current logged-in user data
const getMe = async (req, res) => {
  if (req.user.role === 'admin') {
    return res.json({ role: 'admin', username: process.env.ADMIN_USERNAME });
  }

  const volunteer = await Volunteer.findById(req.user.id)
    .populate('willingCities', 'name')
    .populate('booksReadByAP', 'title language');

  if (!volunteer) {
    return res.status(404).json({ message: 'Volunteer not found' });
  }

  res.json({ role: 'volunteer', ...volunteer.toObject() });
};

module.exports = { adminLogin, volunteerGoogleLogin, getMe };
