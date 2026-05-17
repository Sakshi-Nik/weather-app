// script.js
// my OpenWeatherMap API key


// ── State (saved in localStorage) ──
let unit    = localStorage.getItem("wUnit")    || "C";
let history = JSON.parse(localStorage.getItem("wHistory") || "[]");
let favs    = JSON.parse(localStorage.getItem("wFavs")    || "[]");

// Last fetched data (for unit toggle re-render)
let lastWeather  = null;
let lastForecast = null;


// ─────────────────────────────────────────
//  Unit Toggle
// ─────────────────────────────────────────
function setUnit(u) {
    unit = u;
    localStorage.setItem("wUnit", u);
    document.getElementById("btnC").classList.toggle("active", u === "C");
    document.getElementById("btnF").classList.toggle("active", u === "F");
    if (lastWeather)  renderWeather(lastWeather);
    if (lastForecast) renderForecast(lastForecast);
}

function toDisplay(celsius) {
    if (unit === "F") return Math.round(celsius * 9 / 5 + 32) + "°F";
    return Math.round(celsius) + "°C";
}


// ─────────────────────────────────────────
//  Condition → Emoji
// ─────────────────────────────────────────
function conditionEmoji(main) {
    const map = {
        Clear: "☀️", Clouds: "⛅", Rain: "🌧️",
        Drizzle: "🌦️", Thunderstorm: "⛈️",
        Snow: "❄️", Mist: "🌫️", Fog: "🌫️", Haze: "🌫️"
    };
    return map[main] || "🌡️";
}


// ─────────────────────────────────────────
//  Search History
// ─────────────────────────────────────────
function addHistory(city) {

    if (!city || city === "null") return;

    history = [city, ...history.filter(c =>
        c && c.toLowerCase() !== city.toLowerCase()
    )].slice(0, 5);

    localStorage.setItem("wHistory", JSON.stringify(history));
    renderChips();
}

function removeHistory(city) {
    history = history.filter(c => c !== city);
    localStorage.setItem("wHistory", JSON.stringify(history));
    renderChips();
}

function renderChips() {
    const el = document.getElementById("historyChips");
    el.innerHTML = history.map(c => `
        <span class="chip" onclick="fetchWeather('${c}')">
            🕐 ${c}
            <span class="remove" onclick="event.stopPropagation(); removeHistory('${c}')">&times;</span>
        </span>
    `).join("");
}


// ─────────────────────────────────────────
//  Favourites
// ─────────────────────────────────────────
function toggleFav(city) {
    if (favs.includes(city)) {
        favs = favs.filter(f => f !== city);
    } else {
        favs = [...favs, city];
    }
    localStorage.setItem("wFavs", JSON.stringify(favs));
    renderFavs();
    if (lastWeather) renderWeather(lastWeather); // refresh star icon
}

function renderFavs() {
    const section = document.getElementById("favSection");
    const chips   = document.getElementById("favChips");
    if (favs.length === 0) { section.style.display = "none"; return; }
    section.style.display = "block";
    chips.innerHTML = favs.map(f => `
        <span class="fav-chip" onclick="fetchWeather('${f}')">⭐ ${f}</span>
    `).join("");
}


// ─────────────────────────────────────────
//  Render: Main Weather Card
// ─────────────────────────────────────────
function renderWeather(data) {
    lastWeather = data;
    const isFav     = favs.includes(data.name);
    const visibility = data.visibility ? (data.visibility / 1000).toFixed(1) + " km" : "N/A";

    document.getElementById("weatherResult").innerHTML = `
        <div class="card">
            <div class="city-row">
                <span class="city-name">${data.name}, ${data.sys.country}</span>
                <button class="fav-btn" onclick="toggleFav('${data.name}')"
                    title="${isFav ? 'Remove from favourites' : 'Add to favourites'}">
                    ${isFav ? "★" : "☆"}
                </button>
            </div>
            <div class="temp">${toDisplay(data.main.temp)}</div>
            <div class="condition">${conditionEmoji(data.weather[0].main)} ${data.weather[0].description}</div>
            <div class="stats">
                <div class="stat">
                    <div class="label">Feels like</div>
                    <div class="val">${toDisplay(data.main.feels_like)}</div>
                </div>
                <div class="stat">
                    <div class="label">Humidity</div>
                    <div class="val">${data.main.humidity}%</div>
                </div>
                <div class="stat">
                    <div class="label">Wind</div>
                    <div class="val">${data.wind.speed} m/s</div>
                </div>
                <div class="stat">
                    <div class="label">Pressure</div>
                    <div class="val">${data.main.pressure} hPa</div>
                </div>
            </div>
        </div>
    `;

    changeBackground(data.weather[0].main);
}


// ─────────────────────────────────────────
//  Render: 5-Day Forecast
// ─────────────────────────────────────────
function renderForecast(list) {
    lastForecast = list;

    // Group 3-hourly entries by calendar day
    const days = {};
    list.forEach(item => {
        const d   = new Date(item.dt * 1000);
        const key = d.toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" });
        if (!days[key]) days[key] = { temps: [], icons: [] };
        days[key].temps.push(item.main.temp);
        days[key].icons.push(item.weather[0].main);
    });

    const entries = Object.entries(days).slice(0, 5);
    document.getElementById("forecastGrid").innerHTML = entries.map(([day, val]) => {
        const hi   = Math.max(...val.temps);
        const lo   = Math.min(...val.temps);
        const icon = conditionEmoji(val.icons[Math.floor(val.icons.length / 2)]);
        return `
            <div class="fc-card">
                <div class="day">${day}</div>
                <div class="icon">${icon}</div>
                <div class="hi">${toDisplay(hi)}</div>
                <div class="lo">${toDisplay(lo)}</div>
            </div>
        `;
    }).join("");

    document.getElementById("forecastSection").style.display = "block";
}


// ─────────────────────────────────────────
//  Dynamic Background
// ─────────────────────────────────────────
function changeBackground(condition) {
    const gradients = {
        Clear:        "linear-gradient(to right, #56ccf2, #2f80ed)",
        Clouds:       "linear-gradient(to right, #bdc3c7, #2c3e50)",
        Rain:         "linear-gradient(to right, #4b79a1, #283e51)",
        Drizzle:      "linear-gradient(to right, #4b79a1, #283e51)",
        Thunderstorm: "linear-gradient(to right, #373b44, #4286f4)",
        Snow:         "linear-gradient(to right, #e6dada, #274046)",
        Mist:         "linear-gradient(to right, #606c88, #3f4c6b)",
        Fog:          "linear-gradient(to right, #606c88, #3f4c6b)",
        Haze:         "linear-gradient(to right, #606c88, #3f4c6b)"
    };
    document.body.style.background = gradients[condition] || "#87CEEB";
}


// ─────────────────────────────────────────
//  Fetch Functions
// ─────────────────────────────────────────
function setLoading() {
    document.getElementById("weatherResult").innerHTML =
        `<div class="loading-msg">⏳ Fetching weather…</div>`;
    document.getElementById("forecastSection").style.display = "none";
}

function setError(msg) {
    document.getElementById("weatherResult").innerHTML =
        `<div class="error-msg">❌ ${msg}</div>`;
    document.getElementById("forecastSection").style.display = "none";
}

async function fetchWeather(city) {
    setLoading();

    try {

        const response = await fetch(
            `/.netlify/functions/weather?city=${encodeURIComponent(city)}`
        );

        const data = await response.json();

        const wData = data.weather;
        const fData = data.forecast;

        if (wData.cod != 200) {
            throw new Error("City not found.");
        }

        addHistory(wData.name);
        renderWeather(wData);
        renderForecast(fData.list);

    } catch (e) {
        setError(e.message);
    }
}

// uses gps location 
async function fetchByCoords(lat, lon) {

    setLoading();

    try {

        const response = await fetch(
            `/.netlify/functions/weather?lat=${lat}&lon=${lon}`
        );

        const data = await response.json();

        const wData = data.weather;
        const fData = data.forecast;

        addHistory(wData.name);

        renderWeather(wData);
        renderForecast(fData.list);

    } catch (e) {
        setError("Could not fetch weather for your location.");
    }
}


// ─────────────────────────────────────────
//  User Actions
// ─────────────────────────────────────────
function searchCity() {
    const city = document.getElementById("cityInput").value.trim();
    if (!city) { alert("Please enter a city name"); return; }
    fetchWeather(city);
}

function getLocation() {
    if (!navigator.geolocation) { setError("Geolocation not supported by your browser."); return; }
    navigator.geolocation.getCurrentPosition(
        pos => fetchByCoords(pos.coords.latitude, pos.coords.longitude),
        ()  => setError("Location access denied. Please search manually.")
    );
}

// Enter key support
document.getElementById("cityInput").addEventListener("keydown", e => {
    if (e.key === "Enter") searchCity();
});


// ─────────────────────────────────────────
//  Init
// ─────────────────────────────────────────
setUnit(unit);
renderChips();
renderFavs();
getLocation(); // auto-load on page open