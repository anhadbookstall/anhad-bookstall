// controllers/cityController.js
const City = require('../models/City');
const Volunteer = require('../models/Volunteer');

const getCities = async (req, res) => {
  const cities = await City.find().sort('name');
  res.json(cities);
};

const addCity = async (req, res) => {
  const { name, pinCode, dateOfInclusion } = req.body;
  const city = await City.create({ name, pinCode, dateOfInclusion });
  res.status(201).json(city);
};

const deleteCity = async (req, res) => {
  const city = await City.findByIdAndDelete(req.params.id);
  if (!city) return res.status(404).json({ message: 'City not found' });
  // Remove from all volunteers' willingCities
  await Volunteer.updateMany(
    { willingCities: req.params.id },
    { $pull: { willingCities: req.params.id } }
  );
  res.json({ message: 'City deleted' });
};

// GET /api/cities/:id/volunteers - Get volunteers who opted for this city
const getCityVolunteers = async (req, res) => {
  console.log('getCityVolunteers called for city:', req.params.id);
  const volunteers = await Volunteer.find({
    willingCities: req.params.id,
    status: 'active',
  }).select('name profilePhoto gmailId isBookstallLead');

  const GitaMember = require('../models/GitaMember');
  const gitaMembers = await GitaMember.find({
    willingCities: req.params.id,
    status: 'active',
  }).select('name gmailId').catch(() => []);

  res.json({ volunteers, gitaMembers });
};

module.exports = { getCities, addCity, deleteCity, getCityVolunteers };
