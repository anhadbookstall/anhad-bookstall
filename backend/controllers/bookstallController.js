// controllers/bookstallController.js
const Bookstall = require('../models/Bookstall');
const Volunteer = require('../models/Volunteer');

// GET /api/bookstalls - List all bookstalls (admin) or volunteer's bookstalls
const getBookstalls = async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.city) filter.city = req.query.city;

  const bookstalls = await Bookstall.find(filter)
    .populate('city', 'name')
    .populate('lead', 'name profilePhoto')
    .populate('attendance.volunteer', 'name profilePhoto')
    .sort('-startedAt')
    .limit(50);
  res.json(bookstalls);
};

// GET /api/bookstalls/active - Currently ongoing bookstall
const getActiveBookstall = async (req, res) => {
  const bookstall = await Bookstall.findOne({ status: 'ongoing' })
    .populate('city', 'name')
    .populate('lead', 'name profilePhoto')
    .populate('attendance.volunteer', 'name profilePhoto');
  res.json(bookstall || null);
};

// GET /api/bookstalls/:id - Single bookstall details
const getBookstall = async (req, res) => {
  const bs = await Bookstall.findById(req.params.id)
    .populate('city', 'name')
    .populate('lead', 'name profilePhoto')
    .populate('attendance.volunteer', 'name profilePhoto')
    .populate('reflections.volunteer', 'name');
  if (!bs) return res.status(404).json({ message: 'Bookstall not found' });
  res.json(bs);
};

// POST /api/bookstalls/start - Bookstall lead starts a bookstall
const startBookstall = async (req, res) => {
  const { cityId, location, presentVolunteerIds, coordinates, specialOccasion } = req.body;

  const volunteerId = req.user.id;

  // Verify requester is a Bookstall Lead
  const volunteer = await Volunteer.findById(volunteerId);
  if (!volunteer || !volunteer.isBookstallLead) {
    return res.status(403).json({ message: 'Only Bookstall Leads can start a bookstall' });
  }

  // Build attendance array (lead is always present)
  const attendance = [
    {
      volunteer: volunteerId,
      joinedAt: new Date(),
      isPresent: true,
      sessions: [{ joinedAt: new Date() }],
    },
  ];

  if (presentVolunteerIds && Array.isArray(presentVolunteerIds)) {
    for (const id of presentVolunteerIds) {
      // Skip if this ID is the lead - lead is already in attendance
      if (id.toString() === volunteerId.toString()) continue;
      attendance.push({
        volunteer: id,
        joinedAt: new Date(),
        isPresent: true,
        sessions: [{ joinedAt: new Date() }],
      });
    }
  }

  const bookstall = await Bookstall.create({
    city: cityId,
    location,
    lead: volunteerId,
    attendance,
    coordinates,
    specialOccasion,
    startedAt: new Date(),
  });

  await bookstall.populate([
    { path: 'city', select: 'name' },
    { path: 'lead', select: 'name profilePhoto' },
    { path: 'attendance.volunteer', select: 'name profilePhoto' },
  ]);

  res.status(201).json(bookstall);
};

// PUT /api/bookstalls/:id/close - Lead closes the bookstall
const closeBookstall = async (req, res) => {
  const bs = await Bookstall.findById(req.params.id);
  if (!bs) return res.status(404).json({ message: 'Bookstall not found' });
  if (bs.lead.toString() !== req.user.id) {
    return res.status(403).json({ message: 'Only the lead can close the bookstall' });
  }
  if (bs.status === 'closed') {
    return res.status(400).json({ message: 'Bookstall is already closed' });
  }

  bs.status = 'closed';
  bs.closedAt = new Date();

  // Close all open attendance sessions
  bs.attendance.forEach((att) => {
    if (att.isPresent) {
      const lastSession = att.sessions[att.sessions.length - 1];
      if (lastSession && !lastSession.exitedAt) {
        lastSession.exitedAt = new Date();
      }
      att.isPresent = false;
    }
  });

  await bs.save();
  res.json({ message: 'Bookstall closed successfully', bookstall: bs });
};

// PUT /api/bookstalls/:id/exit - Volunteer exits the bookstall
const exitBookstall = async (req, res) => {
  const bs = await Bookstall.findById(req.params.id);
  if (!bs) return res.status(404).json({ message: 'Bookstall not found' });
  if (bs.status !== 'ongoing') return res.status(400).json({ message: 'Bookstall is not ongoing' });
  if (bs.lead.toString() === req.user.id) {
    return res.status(400).json({ message: 'Lead cannot exit. Please close the bookstall instead.' });
  }

  const att = bs.attendance.find((a) => a.volunteer.toString() === req.user.id);
  if (!att) return res.status(400).json({ message: 'You are not attending this bookstall' });

  att.isPresent = false;
  const lastSession = att.sessions[att.sessions.length - 1];
  if (lastSession && !lastSession.exitedAt) {
    lastSession.exitedAt = new Date();
  }

  await bs.save();
  res.json({ message: 'Exited bookstall' });
};

// PUT /api/bookstalls/:id/rejoin - Volunteer rejoins after exit
const rejoinBookstall = async (req, res) => {
  const bs = await Bookstall.findById(req.params.id);
  if (!bs) return res.status(404).json({ message: 'Bookstall not found' });
  if (bs.status !== 'ongoing') return res.status(400).json({ message: 'Bookstall is not ongoing' });

  const att = bs.attendance.find((a) => a.volunteer.toString() === req.user.id);
  if (!att) return res.status(400).json({ message: 'You were not part of this bookstall' });

  att.isPresent = true;
  att.sessions.push({ joinedAt: new Date() });

  await bs.save();
  res.json({ message: 'Rejoined bookstall' });
};

// POST /api/bookstalls/:id/reflection - Write/update reflection
const addReflection = async (req, res) => {
  const { text } = req.body;
  const bs = await Bookstall.findById(req.params.id);
  if (!bs) return res.status(404).json({ message: 'Bookstall not found' });

  const wasPresent = bs.lead.toString() === req.user.id ||
    bs.attendance.some((a) => a.volunteer.toString() === req.user.id);

  if (!wasPresent && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'You were not part of this bookstall' });
  }

  const existing = bs.reflections.find((r) => r.volunteer?.toString() === req.user.id);
  if (existing) {
    existing.text = text;
    existing.writtenAt = new Date();
  } else {
    bs.reflections.push({ volunteer: req.user.id, text, writtenAt: new Date() });
  }

  await bs.save();
  res.json({ message: 'Reflection saved' });
};


// GET /api/bookstalls/reflections/all - All reflections as a social feed
const getAllReflections = async (req, res) => {
  const bookstalls = await Bookstall.find({ 'reflections.0': { $exists: true } })
    .populate('reflections.volunteer', 'name profilePhoto')
    .populate('city', 'name')
    .select('reflections city location startedAt closedAt')
    .sort('-startedAt');

  // Flatten all reflections into a single feed sorted by writtenAt
  const feed = [];
  for (const bs of bookstalls) {
    for (const r of bs.reflections) {
      feed.push({
        _id: r._id,
        text: r.text,
        writtenAt: r.writtenAt,
        volunteer: r.volunteer,
        bookstall: {
          _id: bs._id,
          city: bs.city,
          location: bs.location,
          startedAt: bs.startedAt,
        },
      });
    }
  }

  feed.sort((a, b) => new Date(b.writtenAt) - new Date(a.writtenAt));
  res.json(feed);
};

// GET /api/bookstalls/:id/summary - Bookstall summary stats
const getBookstallSummary = async (req, res) => {
  const bs = await Bookstall.findById(req.params.id)
    .populate('city', 'name')
    .populate('lead', 'name')
    .populate('attendance.volunteer', 'name');
  if (!bs) return res.status(404).json({ message: 'Bookstall not found' });

  const Sale = require('../models/Sale');
  const sales = await Sale.find({ bookstall: bs._id }).populate('book', 'title');

  // Total hours
  const endTime = bs.closedAt || new Date();
  const totalHours = ((endTime - bs.startedAt) / 3600000).toFixed(2);

  // Total books sold
  const totalBooksSold = sales.reduce((sum, s) => sum + s.quantity, 0);

  // Bookstall efficiency = books sold per hour
  const bookstallEfficiency = totalHours > 0
    ? (totalBooksSold / totalHours).toFixed(2)
    : 0;

  // Volunteer presence hours
  const volunteerHours = [];
  // Lead - present for full duration
  const leadHours = parseFloat(totalHours);
  volunteerHours.push({ name: bs.lead?.name + ' (Lead)', hours: leadHours });

  // Attendance array - skip the lead to avoid duplicate
  for (const att of bs.attendance) {
    if (att.volunteer?._id?.toString() === bs.lead?._id?.toString()) continue;
    let presenceMs = 0;
    for (const session of att.sessions) {
      const exit = session.exitedAt || endTime;
      presenceMs += exit - session.joinedAt;
    }
    const hours = (presenceMs / 3600000).toFixed(2);
    volunteerHours.push({ name: att.volunteer?.name, hours: parseFloat(hours) });
  }

  const totalPresenceHours = volunteerHours.reduce((sum, v) => sum + v.hours, 0);

  // Volunteer efficiency = books sold / total presence hours
  const volunteerEfficiency = totalPresenceHours > 0
    ? (totalBooksSold / totalPresenceHours).toFixed(2)
    : 0;

  // Books breakdown
  const bookBreakdown = {};
  for (const s of sales) {
    const title = s.book?.title || 'Unknown';
    bookBreakdown[title] = (bookBreakdown[title] || 0) + s.quantity;
  }

  res.json({
    totalHours: parseFloat(totalHours),
    totalBooksSold,
    bookstallEfficiency: parseFloat(bookstallEfficiency),
    volunteerEfficiency: parseFloat(volunteerEfficiency),
    volunteerHours,
    totalPresenceHours: parseFloat(totalPresenceHours).toFixed(2),
    bookBreakdown,
    status: bs.status,
    location: bs.location,
    city: bs.city?.name,
    startedAt: bs.startedAt,
    closedAt: bs.closedAt,
  });
};

module.exports = {
  getBookstalls, getActiveBookstall, getBookstall,
  startBookstall, closeBookstall, exitBookstall,
  rejoinBookstall, addReflection, getAllReflections, getBookstallSummary,
};