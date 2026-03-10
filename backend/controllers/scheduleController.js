// controllers/scheduleController.js
const Schedule = require('../models/Schedule');
const Volunteer = require('../models/Volunteer');
const Notification = require('../models/Notification');

// GET /api/schedules - Get upcoming schedules
const getSchedules = async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  else filter.status = { $in: ['scheduled', 'ongoing'] };

  const schedules = await Schedule.find(filter)
    .populate('city', 'name pinCode')
    .populate('assignedLead', 'name profilePhoto')
    .sort('scheduledDate');
  res.json(schedules);
};

// POST /api/schedules - Add new schedule (admin)
const addSchedule = async (req, res) => {
  const { cityId, location, scheduledDate, startTime, assignedLeadId } = req.body;

  const schedule = await Schedule.create({
    city: cityId,
    location,
    scheduledDate: new Date(scheduledDate),
    startTime,
    assignedLead: assignedLeadId,
  });

  await schedule.populate([
    { path: 'city', select: 'name' },
    { path: 'assignedLead', select: 'name' },
  ]);

  res.status(201).json(schedule);
};

// PUT /api/schedules/:id - Update schedule (admin)
const updateSchedule = async (req, res) => {
  const { cityId, location, scheduledDate, startTime, assignedLeadId } = req.body;
  const schedule = await Schedule.findByIdAndUpdate(
    req.params.id,
    {
      city: cityId,
      location,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
      startTime,
      assignedLead: assignedLeadId,
    },
    { new: true, runValidators: true }
  ).populate('city assignedLead');

  if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
  res.json(schedule);
};

// DELETE /api/schedules/:id - Cancel schedule (admin)
const deleteSchedule = async (req, res) => {
  await Schedule.findByIdAndUpdate(req.params.id, { status: 'cancelled' });
  res.json({ message: 'Schedule cancelled' });
};

module.exports = { getSchedules, addSchedule, updateSchedule, deleteSchedule };
