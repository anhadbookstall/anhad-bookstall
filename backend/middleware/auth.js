// middleware/auth.js - JWT verification middleware
// Protects routes by verifying the JWT token in request headers
const jwt = require('jsonwebtoken');
const Volunteer = require('../models/Volunteer');

// Verifies JWT and attaches user info to req
const protect = async (req, res, next) => {
  let token;

  // Token is sent as: Authorization: Bearer <token>
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role: 'admin'|'volunteer' }
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token invalid or expired' });
  }
};

// Middleware: Admin only
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin only.' });
  }
};

// Middleware: Volunteer only (also checks not suspended)
const volunteerOnly = async (req, res, next) => {
  if (!req.user || req.user.role !== 'volunteer') {
    return res.status(403).json({ message: 'Access denied. Volunteer only.' });
  }
  const vol = await Volunteer.findById(req.user.id).select('status');
  if (!vol || vol.status !== 'active') {
    return res.status(403).json({ message: 'Your account is suspended or inactive.' });
  }
  next();
};

// Middleware: Admin or Volunteer
const authenticated = (req, res, next) => {
  if (req.user) {
    next();
  } else {
    res.status(401).json({ message: 'Authentication required.' });
  }
};

module.exports = { protect, adminOnly, volunteerOnly, authenticated };
