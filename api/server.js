require('dotenv').config();
const express = require('express');
const axios = require('axios');
// const cors = require('cors');
const app = express();
const PORT = 3000;
// const serverless = require('serverless-http');

// app.use(cors());
// app.use(express.json());
// Serve index.html and static files
app.use(express.static(path.join(__dirname, '..')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});
app.get('/api/search', async (req, res) => {
  try {
    const address = req.query.address;
    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    // Geocode the address to get coordinates
    const geoRes = await axios.get('http://api.openweathermap.org/geo/1.0/direct', {
      params: {
        q: address,
        limit: 1,
        appid: process.env.OPENWEATHERMAP_API_KEY,
      },
    });

    const location = geoRes.data[0];
    if (!location) return res.status(404).json({ error: 'Location not found' });

    const { lat, lon, name, state, country } = location;

    // Fetch current weather data
    const weatherRes = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: {
        lat,
        lon,
        appid: process.env.OPENWEATHERMAP_API_KEY,
        units: 'metric',
      },
    });

    // Fetch air pollution data
    const aqiRes = await axios.get('http://api.openweathermap.org/data/2.5/air_pollution', {
      params: {
        lat,
        lon,
        appid: process.env.OPENWEATHERMAP_API_KEY,
      },
    });

    const weather = weatherRes.data;
    const aqiData = aqiRes.data.list[0];

    // Construct the response with real data
    const result = {
      location: {
        city: name,
        state: state || 'N/A',
        country: country,
        coordinates: {
          latitude: lat,
          longitude: lon,
        },
      },
      weather: {
        temperature: `${weather.main.temp} °C`,
        feels_like: `${weather.main.feels_like} °C`,
        humidity: `${weather.main.humidity} %`,
        pressure: `${weather.main.pressure} hPa`,
        wind_speed: `${weather.wind.speed} m/s`,
        wind_direction: `${weather.wind.deg}°`,
        cloudiness: `${weather.clouds.all} %`,
        visibility: `${weather.visibility} meters`,
        weather_conditions: weather.weather.map((w) => ({
          main: w.main,
          description: w.description,
        })),
      },
      air_quality: {
        aqi: aqiData.main.aqi,
        components: aqiData.components,
      },
    };

    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Something went wrong', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// module.exports.handler = serverless(app);
module.exports = app;