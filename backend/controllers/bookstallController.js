// controllers/bookstallController.js
// Manages the lifecycle of a bookstall session
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

// GET /api/bookstalls/active - Currently ongoing bookstall for logged-in volunteer
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
// Only the assigned lead for a schedule can start it
const startBookstall = async (req, res) => {
  const {
    scheduleId, cityId, location, presentVolunteerIds,
    coordinates, specialOccasion,
  } = req.body;

  const volunteerId = req.user.id;

  // Verify requester is the assigned lead for this schedule
  if (scheduleId) {
    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
    if (schedule.assignedLead?.toString() !== volunteerId) {
      return res.status(403).json({ message: 'Only the assigned lead can start this bookstall' });
    }
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
      if (id !== volunteerId) {
        attendance.push({
          volunteer: id,
          joinedAt: new Date(),
          isPresent: true,
          sessions: [{ joinedAt: new Date() }],
        });
      }
    }
  }

  const bookstall = await Bookstall.create({
    schedule: scheduleId || undefined,
    city: cityId,
    location,
    lead: volunteerId,
    attendance,
    coordinates,
    specialOccasion,
    startedAt: new Date(),
  });

  // Update schedule status to ongoing
  if (scheduleId) {
    await Schedule.findByIdAndUpdate(scheduleId, {
      status: 'ongoing',
      bookstallRef: bookstall._id,
    });
  }

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

  // Update schedule status to completed
  if (bs.schedule) {
    await Schedule.findByIdAndUpdate(bs.schedule, { status: 'completed' });
  }

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

  // Check volunteer was part of this bookstall
  const wasPresent = bs.lead.toString() === req.user.id ||
    bs.attendance.some((a) => a.volunteer.toString() === req.user.id);

  if (!wasPresent && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'You were not part of this bookstall' });
  }

  // Update existing reflection or add new
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

module.exports = {
  getBookstalls, getActiveBookstall, getBookstall,
  startBookstall, closeBookstall, exitBookstall,
  rejoinBookstall, addReflection,
};
