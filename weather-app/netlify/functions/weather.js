exports.handler = async (event) => {

    const API_KEY = process.env.WEATHER_KEY;

    const city = event.queryStringParameters.city;
    const lat  = event.queryStringParameters.lat;
    const lon  = event.queryStringParameters.lon;

    let weatherURL = "";
    let forecastURL = "";

    // city search
    if (city) {

        weatherURL =
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;

        forecastURL =
            `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`;
    }

    // location search
    else if (lat && lon) {

        weatherURL =
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

        forecastURL =
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    }

    const [weatherRes, forecastRes] = await Promise.all([
        fetch(weatherURL),
        fetch(forecastURL)
    ]);

    const weatherData = await weatherRes.json();
    const forecastData = await forecastRes.json();

    return {
        statusCode: 200,
        body: JSON.stringify({
            weather: weatherData,
            forecast: forecastData
        })
    };
};