document.addEventListener('DOMContentLoaded', function () {
    console.log('DOMContentLoaded event triggered');

    let searchButton = document.getElementById('search-button');
    let searchInput = document.getElementById('search-input');
    const currentCity = document.getElementById('current-city');
    const recentSearchContainer = document.getElementById('recent-search-container');
    const maxRecentSearches = 10;

    function displayCurrentCity(city, state, country) {
        const stateText = state ? `${state} ` : '';
        const countryText = country ? `${country}` : '';
    
        const currentDate = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = currentDate.toLocaleDateString(undefined, options);
    
        currentCity.innerHTML = `${city} ${stateText}${countryText} - ${formattedDate}`;
    }
    
    function updateFiveDayForecast(weatherData) {
        const forecastContainers = [
            document.getElementById('one-day-out-forecast'),
            document.getElementById('two-days-out-forecast'),
            document.getElementById('three-days-out-forecast'),
            document.getElementById('four-days-out-forecast'),
            document.getElementById('five-days-out-forecast')
        ];
    
        // Ensure weatherData and weatherData.list exist before accessing properties
        if (weatherData && weatherData.list) {
            // Assuming weatherData is an array containing 5-day forecast data
            for (let i = 0; i < 5; i++) {
                const forecastIndex = i * 8; // Each day has multiple entries, we skip 8 for the next day
    
                // Check if weatherData.list[forecastIndex] exists before accessing its properties
                if (weatherData.list[forecastIndex]) {
                    const date = new Date(weatherData.list[forecastIndex].dt * 1000); // Convert timestamp to date
                    const options = { weekday: 'long', month: 'long', day: 'numeric' };
                    const formattedDate = date.toLocaleDateString(undefined, options);
    
                    const weatherCondition = weatherData.list[forecastIndex].weather[0].main;
                    const iconClass = getWeatherIconClass(weatherCondition);
                    const temperatureKelvin = weatherData.list[forecastIndex].main.temp;
                    const temperatureFahrenheit = Math.round((temperatureKelvin - 273.15) * 9/5 + 32);
                    const wind = weatherData.list[forecastIndex].wind.speed;
                    const humidity = weatherData.list[forecastIndex].main.humidity;
    
                    const forecastContainer = forecastContainers[i];
                    forecastContainer.textContent = ''; // Clear existing content
    
                    // Add the date with the icon below it
                    const dateElement = document.createElement('div');
                    dateElement.textContent = formattedDate;
                    forecastContainer.appendChild(dateElement);
    
                    const iconElement = document.createElement('i');
                    iconElement.className = iconClass;
                    forecastContainer.appendChild(iconElement);
    
                    // Add each weather data as a separate list item
                    appendWeatherItem(forecastContainer, 'Temperature', `${temperatureFahrenheit}°F`);
                    appendWeatherItem(forecastContainer, 'Wind', `${wind} m/s`);
                    appendWeatherItem(forecastContainer, 'Humidity', `${humidity}%`);
                }
            }
        }
    }
    
    
    function insertCurrentWeather(temperatureFahrenheit, wind, humidity) {
        const currentWeatherList = document.getElementById('current-city-forecast');
        currentWeatherList.textContent = ''; // Clear existing content
    
        // Check if temperatureFahrenheit, wind, and humidity are valid before using them
        if (temperatureFahrenheit !== undefined && wind !== undefined && humidity !== undefined) {
            appendWeatherItem(currentWeatherList, 'Temperature', `${temperatureFahrenheit}°F`);
            appendWeatherItem(currentWeatherList, 'Wind', `${wind} m/s`);
            appendWeatherItem(currentWeatherList, 'Humidity', `${humidity}%`);
        }
    
        updateFiveDayForecast();
    }
    
    
    function getWeatherIconClass(weatherCondition) {
        // Map weather conditions to Font Awesome icon classes
        const iconMap = {
            'Clear': 'fas fa-sun yellow-icon',
            'Clouds': 'fas fa-cloud',
            'Rain': 'fas fa-cloud-showers-heavy',
            'Snow': 'fas fa-snowflake'
        };
    
        return iconMap[weatherCondition] || 'fas fa-question'; // Default to a question mark icon if condition not found
    }

    function appendWeatherItem(container, label, value, iconClass) {
        const listItem = document.createElement('li');
        listItem.innerHTML = `<i class="${iconClass}"></i> ${label}: ${value}`;
        container.appendChild(listItem);
    }    

    function updateRecentSearches() {
        const recentSearches = getRecentSearches();
        recentSearchContainer.textContent = '';
    
        for (const search of recentSearches) {
            const button = document.createElement('button');
            button.textContent = search;
            button.className = 'btn btn-outline-secondary m-2 bg-dark text-white';
            button.addEventListener('click', function () {
                performSearch(search);
            });
    
            recentSearchContainer.appendChild(button);
        }
    }
    
    

    function performSearch(search) {
        // Split the search value and perform the search
        const searchArray = search.split(',');
        const city = searchArray[0];
        const state = searchArray[1];
        const country = searchArray[2];
    
        let geocodingAPI = `https://api.openweathermap.org/geo/1.0/direct?q=${city},${state},${country}&limit=1&appid=7b1eab3296911715f248b7a79b72ba34`;
    
        fetch(geocodingAPI)
            .then(response => response.json())
            .then(data => {
                if (data.length > 0) {
                    const latitude = data[0].lat;
                    const longitude = data[0].lon;
    
                    console.log('Latitude:', latitude);
                    console.log('Longitude:', longitude);
    
                    let weatherAPI = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=7b1eab3296911715f248b7a79b72ba34`;
    
                    fetch(weatherAPI)
                        .then(response => response.json())
                        .then(weatherData => {
                            const temperatureKelvin = weatherData.list[0].main.temp;
                            const temperatureFahrenheit = Math.round((temperatureKelvin - 273.15) * 9/5 + 32);
                            const currentWind = weatherData.list[0].wind.speed;
                            const currentHumidity = weatherData.list[0].main.humidity;
    
                            console.log('Temperature in Fahrenheit:', temperatureFahrenheit);
    
                            insertCurrentWeather(temperatureFahrenheit, currentWind, currentHumidity);
                            updateFiveDayForecast(weatherData);
                        })
                        .catch(error => {
                            console.error('Error fetching weather data:', error);
                        })
                        .finally(() => {
                            // Call updateRecentSearches here to ensure it runs after weather data is fetched
                            updateRecentSearches();
                        });
                } else {
                    console.error('No geocoding data found for the given city and country.');
                }
            })
            .catch(error => {
                console.error('Error fetching geocoding data:', error);
            });
    
        storeSearchInput(searchArray);
        displayCurrentCity(city, state, country);
    }
    
    updateRecentSearches(); // Display initial recent searches

    searchButton.addEventListener('click', function (event) {
        event.preventDefault();
        console.log('Search button clicked');
        const searchArray = splitSearch();
        console.log('Search Array:', searchArray);

        const city = searchArray[0];
        const state = searchArray[1];
        const country = searchArray[2];

        let geocodingAPI = `https://api.openweathermap.org/geo/1.0/direct?q=${city},${state},${country}&limit=1&appid=7b1eab3296911715f248b7a79b72ba34`;

        fetch(geocodingAPI)
            .then(response => response.json())
            .then(data => {
                if (data.length > 0) {
                    const latitude = data[0].lat;
                    const longitude = data[0].lon;

                    console.log('Latitude:', latitude);
                    console.log('Longitude:', longitude);

                    let weatherAPI = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=7b1eab3296911715f248b7a79b72ba34`;

                    fetch(weatherAPI)
                        .then(response => response.json())
                        .then(weatherData => {
                            const temperatureKelvin = weatherData.list[0].main.temp;
                            const temperatureFahrenheit = Math.round((temperatureKelvin - 273.15) * 9/5 + 32);
                            const currentWind = weatherData.list[0].wind.speed;
                            const currentHumidity = weatherData.list[0].main.humidity;

                            console.log('Temperature in Fahrenheit:', temperatureFahrenheit);

                            insertCurrentWeather(temperatureFahrenheit, currentWind, currentHumidity);
                            updateFiveDayForecast(weatherData); // Pass weatherData to the function
                        })
                        .catch(error => {
                            console.error('Error fetching weather data:', error);
                        });
                } else {
                    console.error('No geocoding data found for the given city and country.');
                }
            })
            .catch(error => {
                console.error('Error fetching geocoding data:', error);
            });

        storeSearchInput(searchArray);
        displayCurrentCity(city, state, country);
        updateRecentSearches();
    });

    function splitSearch() {
        // Split the search input by commas
        const searchArray = searchInput.value.split(',');
    
        // Trim each part to remove leading and trailing spaces
        const trimmedSearchArray = searchArray.map(part => part.trim());
    
        return trimmedSearchArray;
    }    

    function storeSearchInput(searchArray) {
        const searchInput = searchArray.join(', '); // Join with commas
        const recentSearches = getRecentSearches();
        recentSearches.unshift(searchInput); // Add the search input directly
        const trimmedSearches = recentSearches.slice(0, maxRecentSearches);
        localStorage.setItem('recentSearches', JSON.stringify(trimmedSearches));
    }
    

    function getRecentSearches() {
        const storedSearches = localStorage.getItem('recentSearches');
        return storedSearches ? JSON.parse(storedSearches) : [];
    }
});












