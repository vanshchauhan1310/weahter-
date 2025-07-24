document.addEventListener('DOMContentLoaded', function() {
  
    const searchBtn = document.getElementById('searchBtn');
    const cityInput = document.getElementById('cityInput');
    const currentWeather = document.getElementById('currentWeather');
    const forecastContainer = document.getElementById('forecast');
    const historyList = document.getElementById('historyList');
    
    let searchHistory = JSON.parse(localStorage.getItem('weatherSearchHistory')) || [];
    
    // Initialize the app with the last searched city if available
    if (searchHistory.length > 0) {
        fetchWeather(searchHistory[0]);
    }
    
    // Event listeners
    searchBtn.addEventListener('click', handleSearch);
    cityInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') handleSearch();
    });
    
    historyList.addEventListener('click', function(e) {
        if (e.target.tagName === 'LI') {
            fetchWeather(e.target.textContent);
        }
    });
    
    function handleSearch() {
        const city = cityInput.value.trim();
        if (city) {
            fetchWeather(city);
            cityInput.value = '';
        }
    }
    
    function fetchWeather(city) {
        // Fetch current weather
        fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`)
            .then(response => response.json())
            .then(data => {
                if (data.cod === 200) {
                    displayCurrentWeather(data);
                    addToHistory(city);
                    
                    // Fetch forecast
                    return fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}`);
                } else {
                    throw new Error(data.message || 'City not found');
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.cod === '200') {
                    displayForecast(data);
                }
            })
            .catch(error => {
                currentWeather.querySelector('.weather-content').innerHTML = `
                    <p class="error">Error: ${error.message}</p>
                `;
                forecastContainer.innerHTML = '';
                console.error('Error fetching weather data:', error);
            });
    }
    
    function displayCurrentWeather(data) {
        const weather = data.weather[0];
        const iconClass = getWeatherIconClass(weather.id);
        
        currentWeather.querySelector('.weather-content').innerHTML = `
            <div class="weather-icon">
                <i class="fas ${iconClass}"></i>
            </div>
            <div class="weather-details">
                <h3>${data.name}, ${data.sys.country}</h3>
                <p>${new Date().toLocaleDateString()}</p>
                <p><strong>${Math.round(data.main.temp)}°C</strong> (Feels like ${Math.round(data.main.feels_like)}°C)</p>
                <p>${weather.description}</p>
                <p>Humidity: ${data.main.humidity}%</p>
                <p>Wind: ${Math.round(data.wind.speed * 3.6)} km/h</p>
            </div>
        `;
    }
    
    function displayForecast(data) {
        // Group forecast by day
        const dailyForecast = {};
        data.list.forEach(item => {
            const date = new Date(item.dt * 1000).toLocaleDateString();
            if (!dailyForecast[date]) {
                dailyForecast[date] = [];
            }
            dailyForecast[date].push(item);
        });
        
        // Get the next 5 days (excluding today)
        const forecastDates = Object.keys(dailyForecast).slice(1, 6);
        
        forecastContainer.innerHTML = forecastDates.map(date => {
            const dayData = dailyForecast[date];
            const avgTemp = Math.round(dayData.reduce((sum, item) => sum + item.main.temp, 0) / dayData.length);
            const weather = dayData[Math.floor(dayData.length / 2)].weather[0];
            const iconClass = getWeatherIconClass(weather.id);
            
            return `
                <div class="forecast-card">
                    <h4>${new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}</h4>
                    <p>${date}</p>
                    <div class="forecast-icon">
                        <i class="fas ${iconClass}"></i>
                    </div>
                    <p><strong>${avgTemp}°C</strong></p>
                    <p>${weather.description}</p>
                </div>
            `;
        }).join('');
    }
    
    function addToHistory(city) {
        // Remove if already exists
        searchHistory = searchHistory.filter(item => item.toLowerCase() !== city.toLowerCase());
        // Add to beginning of array
        searchHistory.unshift(city);
        // Keep only last 5 searches
        searchHistory = searchHistory.slice(0, 5);
        
        localStorage.setItem('weatherSearchHistory', JSON.stringify(searchHistory));
        updateHistoryList();
    }
    
    function updateHistoryList() {
        historyList.innerHTML = searchHistory.map(city => `
            <li>${city}</li>
        `).join('');
    }
    
    function getWeatherIconClass(weatherId) {
        // Map weather codes to Font Awesome icons
        if (weatherId >= 200 && weatherId < 300) return 'fa-bolt'; // Thunderstorm
        if (weatherId >= 300 && weatherId < 400) return 'fa-cloud-rain'; // Drizzle
        if (weatherId >= 500 && weatherId < 600) return 'fa-umbrella'; // Rain
        if (weatherId >= 600 && weatherId < 700) return 'fa-snowflake'; // Snow
        if (weatherId >= 700 && weatherId < 800) return 'fa-smog'; // Atmosphere
        if (weatherId === 800) return 'fa-sun'; // Clear
        if (weatherId > 800) return 'fa-cloud'; // Clouds
        return 'fa-question'; // Default
    }
});