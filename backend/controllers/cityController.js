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

module.exports = { getCities, addCity, deleteCity };
