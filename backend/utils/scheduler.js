// utils/scheduler.js
// Cron jobs that run in the background
// Currently: Check every hour for bookstalls scheduled within 12 hours and notify volunteers

const schedule = require('node-schedule');
const Schedule = require('../models/Schedule');
const Volunteer = require('../models/Volunteer');
const Notification = require('../models/Notification');

const scheduleJobs = () => {
  // Run every hour to check for upcoming bookstalls
  schedule.scheduleJob('0 * * * *', async () => {
    try {
      const now = new Date();
      const in12Hours = new Date(now.getTime() + 12 * 60 * 60 * 1000);
      const in11Hours = new Date(now.getTime() + 11 * 60 * 60 * 1000);

      // Find schedules in the 11-12 hour window that haven't been notified yet
      const upcomingSchedules = await Schedule.find({
        status: 'scheduled',
        scheduledDate: { $gte: in11Hours, $lte: in12Hours },
        notificationSent: false,
      }).populate('city', 'name');

      for (const sched of upcomingSchedules) {
        // Find volunteers willing to serve in this city
        const volunteers = await Volunteer.find({
          status: 'active',
          willingCities: sched.city._id,
        });

        // Create in-app notification for each eligible volunteer
        const notifications = volunteers.map((vol) => ({
          recipient: vol._id,
          title: '📚 Upcoming Bookstall Reminder',
          message: `Bookstall at ${sched.location}, ${sched.city.name} is scheduled at ${sched.startTime} tomorrow. Please confirm your attendance.`,
          type: 'bookstall_reminder',
          relatedSchedule: sched._id,
        }));

        if (notifications.length > 0) {
          await Notification.insertMany(notifications);
        }

        // Mark notification as sent so it's not re-sent
        await Schedule.findByIdAndUpdate(sched._id, { notificationSent: true });
        console.log(`✅ Sent notifications for schedule: ${sched._id}`);
      }
    } catch (err) {
      console.error('❌ Scheduler error:', err.message);
    }
  });

  console.log('✅ Background scheduler started');
};

module.exports = scheduleJobs;
