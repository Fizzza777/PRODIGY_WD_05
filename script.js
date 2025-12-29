const container = document.querySelector(".app-container");
const searchBtn = document.querySelector("#search-btn");
const cityInput = document.querySelector("#city-input");
const locationBtn = document.querySelector("#location-btn");
const weatherContent = document.querySelector("#weather-content");
const notFound = document.querySelector("#not-found");
const loader = document.querySelector("#loader");

// Elements to update
const tempElement = document.querySelector("#temperature");
const descElement = document.querySelector("#description");
const cityElement = document.querySelector("#city-name");
const humidityElement = document.querySelector("#humidity");
const windElement = document.querySelector("#wind-speed");
const feelsLikeElement = document.querySelector("#feels-like");
const iconElement = document.querySelector("#weather-icon");

// WMO Weather Codes mapping to icons and descriptions
const weatherCodes = {
  0: {
    desc: "Clear sky",
    icon: "https://cdn-icons-png.flaticon.com/512/6974/6974833.png",
  },
  1: {
    desc: "Mainly clear",
    icon: "https://cdn-icons-png.flaticon.com/512/1163/1163661.png",
  },
  2: {
    desc: "Partly cloudy",
    icon: "https://cdn-icons-png.flaticon.com/512/1163/1163661.png",
  },
  3: {
    desc: "Overcast",
    icon: "https://cdn-icons-png.flaticon.com/512/414/414825.png",
  },
  45: {
    desc: "Fog",
    icon: "https://cdn-icons-png.flaticon.com/512/4151/4151022.png",
  },
  48: {
    desc: "Depositing rime fog",
    icon: "https://cdn-icons-png.flaticon.com/512/4151/4151022.png",
  },
  51: {
    desc: "Light drizzle",
    icon: "https://cdn-icons-png.flaticon.com/512/414/414974.png",
  },
  53: {
    desc: "Moderate drizzle",
    icon: "https://cdn-icons-png.flaticon.com/512/414/414974.png",
  },
  55: {
    desc: "Dense drizzle",
    icon: "https://cdn-icons-png.flaticon.com/512/414/414974.png",
  },
  61: {
    desc: "Slight rain",
    icon: "https://cdn-icons-png.flaticon.com/512/3351/3351979.png",
  },
  63: {
    desc: "Moderate rain",
    icon: "https://cdn-icons-png.flaticon.com/512/3351/3351979.png",
  },
  65: {
    desc: "Heavy rain",
    icon: "https://cdn-icons-png.flaticon.com/512/3351/3351979.png",
  },
  71: {
    desc: "Slight snow",
    icon: "https://cdn-icons-png.flaticon.com/512/642/642102.png",
  },
  73: {
    desc: "Moderate snow",
    icon: "https://cdn-icons-png.flaticon.com/512/642/642102.png",
  },
  75: {
    desc: "Heavy snow",
    icon: "https://cdn-icons-png.flaticon.com/512/642/642102.png",
  },
  95: {
    desc: "Thunderstorm",
    icon: "https://cdn-icons-png.flaticon.com/512/1146/1146869.png",
  },
  // Default fallback
  default: {
    desc: "Unknown",
    icon: "https://cdn-icons-png.flaticon.com/512/1163/1163661.png",
  },
};

function showLoader() {
  weatherContent.classList.add("hidden");
  notFound.classList.add("hidden");
  loader.classList.remove("hidden");
}

function hideLoader() {
  loader.classList.add("hidden");
}

function showWeather() {
  notFound.classList.add("hidden");
  weatherContent.classList.remove("hidden");
}

function showError() {
  weatherContent.classList.add("hidden");
  notFound.classList.remove("hidden");
}

async function getCoordinates(city) {
  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=en&format=json`
    );
    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      throw new Error("City not found");
    }

    return data.results[0];
  } catch (error) {
    throw error;
  }
}

async function getWeather(lat, lon) {
  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m&timezone=auto`
  );
  return await response.json();
}

async function updateUI(lat, lon, cityName) {
  showLoader();

  try {
    const weatherData = await getWeather(lat, lon);
    const current = weatherData.current;

    // Update DOM elements
    tempElement.textContent = `${Math.round(current.temperature_2m)}°C`;
    humidityElement.textContent = `${current.relative_humidity_2m}%`;
    windElement.textContent = `${current.wind_speed_10m} km/h`;
    feelsLikeElement.textContent = `${Math.round(
      current.apparent_temperature
    )}°C`;
    cityElement.textContent = cityName;

    // Set weather icon and description
    const weatherCode = current.weather_code;
    const weatherInfo = weatherCodes[weatherCode] || weatherCodes["default"];

    descElement.textContent = weatherInfo.desc;
    iconElement.src = weatherInfo.icon;

    hideLoader();
    showWeather();
  } catch (error) {
    console.error(error);
    hideLoader();
    showError();
  }
}

// Event Listeners
searchBtn.addEventListener("click", async () => {
  const city = cityInput.value.trim();
  if (!city) return;

  try {
    showLoader();
    const locationData = await getCoordinates(city);
    await updateUI(
      locationData.latitude,
      locationData.longitude,
      locationData.name
    );
  } catch (error) {
    hideLoader();
    showError();
  }
});

cityInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    searchBtn.click();
  }
});

locationBtn.addEventListener("click", () => {
  if (navigator.geolocation) {
    showLoader();
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        // Reverse geocoding optional here, but for now we'll just say "Your Location" or try to find a nearby city if needed.
        // Let's try to fetch a city name for these coords just to be nice.
        try {
          // Using a simple reverse geocoding approximation or just displaying generic
          // For simplicity/open-source limits, we'll label it "Current Location"
          // or we could use the same geocoding api if it supports reverse? Open-Meteo doesn't have a direct reverse geocoding simple endpoint for name without complexity.
          // Actually, bigdatacloud is a free option, but let's stick to "Current Location" to avoid extra deps.

          await updateUI(latitude, longitude, "Current Location");
        } catch (error) {
          hideLoader();
          showError();
        }
      },
      (error) => {
        alert("Unable to retrieve your location");
        hideLoader();
      }
    );
  } else {
    alert("Geolocation is not supported by this browser.");
  }
});

// Initial load (optional - maybe default to a city?)
// updateUI(28.61, 77.20, "New Delhi");
