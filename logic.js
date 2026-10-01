// This function maps a weather code (returned by the API) to an emoji icon
function getIcon(code) {
  if (code === 0) return "☀️";                 // clear sky
  if (code === 1 || code === 2) return "🌤️";   // partly cloudy
  if (code === 3) return "☁️";                 // overcast
  if (code === 45 || code === 48) return "🌫️"; // fog
  if (code >= 51 && code <= 67) return "🌧️";   // drizzle / rain
  if (code >= 71 && code <= 77) return "🌨️";   // snow
  if (code >= 80 && code <= 82) return "🌦️";   // rain showers
  if (code >= 95) return "⛈️";                 // thunderstorm
  return "🌡️";
}

// This function maps a weather code to a short text description
function getConditionText(code) {
  if (code === 0) return "Clear";
  if (code === 1 || code === 2) return "Partly Cloudy";
  if (code === 3) return "Cloudy";
  if (code === 45 || code === 48) return "Fog";
  if (code >= 51 && code <= 67) return "Rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 80 && code <= 82) return "Showers";
  if (code >= 95) return "Thunderstorm";
  return "Unknown";
}

// This function turns "2026-09-12T14:00" into something like "2PM"
function formatHour(timeStr) {
  let hour = parseInt(timeStr.slice(11, 13));
  const suffix = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return hour + suffix;
}

// Main function, runs when the user clicks the "Search" button
async function getWeather() {
  const city = document.getElementById("cityInput").value;
  const errorText = document.getElementById("error");
  errorText.textContent = "";

  if (city === "") {
    errorText.textContent = "Please enter a city name.";
    return;
  }

  try {
    // Step 1: Convert the city name into latitude and longitude
    const geoURL = "https://geocoding-api.open-meteo.com/v1/search?name=" + city;
    const geoResponse = await fetch(geoURL);
    const geoData = await geoResponse.json();

    if (!geoData.results) {
      errorText.textContent = "City not found. Please check the spelling.";
      return;
    }

    const lat = geoData.results[0].latitude;
    const lon = geoData.results[0].longitude;
    const foundName = geoData.results[0].name;

    // Step 2: Fetch current, hourly, and daily weather in a single call
    const weatherURL = "https://api.open-meteo.com/v1/forecast" +
      "?latitude=" + lat + "&longitude=" + lon +
      "&current_weather=true" +
      "&hourly=temperature_2m,weathercode" +
      "&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max" +
      "&timezone=auto";

    const weatherResponse = await fetch(weatherURL);
    const weatherData = await weatherResponse.json();

    // Step 3: Display the current weather at the top of the page
    const current = weatherData.current_weather;
    document.getElementById("cityName").textContent = foundName;
    document.getElementById("currentTemp").textContent =
      Math.round(current.temperature) + "° | " + getConditionText(current.weathercode);

    // Step 4: Build the hourly forecast (next 6 hours, starting from now)
    const hourly = weatherData.hourly;
    const startIndex = hourly.time.indexOf(current.time); // find "now" in the hourly list
    let hourlyHTML = "";

    for (let i = startIndex; i < startIndex + 6; i++) {
      const label = (i === startIndex) ? "Now" : formatHour(hourly.time[i]);
      const icon = getIcon(hourly.weathercode[i]);
      const temp = Math.round(hourly.temperature_2m[i]);

      hourlyHTML += `
        <div class="hour-item">
          <p>${label}</p>
          <p class="icon">${icon}</p>
          <p>${temp}°</p>
        </div>
      `;
    }
    document.getElementById("hourlyList").innerHTML = hourlyHTML;

    // Step 5: Build the daily forecast (one row for each day returned)
    const daily = weatherData.daily;
    let dailyHTML = "";

    for (let i = 0; i < daily.time.length; i++) {
      let dayLabel;
      if (i === 0) {
        dayLabel = "Today";
      } else {
        dayLabel = new Date(daily.time[i]).toLocaleDateString("en-US", { weekday: "short" });
      }

      const icon = getIcon(daily.weathercode[i]);
      const precip = daily.precipitation_probability_max[i];
      const low = Math.round(daily.temperature_2m_min[i]);
      const high = Math.round(daily.temperature_2m_max[i]);

      dailyHTML += `
        <div class="daily-row">
          <span class="day-name">${dayLabel}</span>
          <span class="day-icon">${icon}</span>
          <span class="precip">${precip}%</span>
          <div class="temp-range">
            <span>${low}°</span>
            <div class="bar"></div>
            <span>${high}°</span>
          </div>
        </div>
      `;
    }
    document.getElementById("dailyList").innerHTML = dailyHTML;

  } catch (error) {
    errorText.textContent = "Something went wrong. Please try again.";
  }
}