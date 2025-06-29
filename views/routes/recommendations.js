// routes/recommendations.js
const express = require('express');
const router = express.Router();
const TravelGroup = require('../models/TravelGroup');
const axios = require('axios');

router.get('/groups/:id/recommendations', async (req, res) => {
  const group = await TravelGroup.findById(req.params.id);
  if (!group) return res.status(404).send("Group not found");

  const destination = group.destination;

  try {
    const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destination)}`;
    const geoRes = await axios.get(geocodeUrl);
    const loc = geoRes.data[0];

    if (!loc) {
      return res.send(`❌ Could not find location: ${destination}`);
    }

    const lat = loc.lat;
    const lon = loc.lon;

    res.render('recommendations', {
      group,
      lat,
      lon
    });

  } catch (err) {
    console.error('❌ Overpass/Nominatim Error:', err.message);
    res.status(500).send("Could not fetch location data.");
  }
});

module.exports = router;
