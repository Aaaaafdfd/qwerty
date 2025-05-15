document.addEventListener('DOMContentLoaded', function() {
    // API ключ и базовый URL
    const apiKey = '6e89c2a035ea361b23dd6f036dca0eed'; // Замените на ваш API ключ от OpenWeatherMap
    const baseUrl = 'https://api.openweathermap.org/data/2.5/';
    
    // Элементы DOM
    const cityInput = document.getElementById('city-input');
    const searchBtn = document.getElementById('search-btn');
    const cityName = document.getElementById('city-name');
    const currentDate = document.getElementById('current-date');
    const weatherIcon = document.getElementById('weather-icon');
    const temp = document.getElementById('temp');
    const weatherDesc = document.getElementById('weather-desc');
    const wind = document.getElementById('wind');
    const humidity = document.getElementById('humidity');
    const pressure = document.getElementById('pressure');
    const forecastContainer = document.getElementById('forecast');
    
    // Инициализация приложения
    function init() {
        updateDate();
        // Попробуем получить погоду по геолокации
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    getWeatherByCoords(position.coords.latitude, position.coords.longitude);
                },
                error => {
                    // Если геолокация недоступна, покажем погоду для Москвы по умолчанию
                    getWeatherByCity('Moscow');
                }
            );
        } else {
            getWeatherByCity('Moscow');
        }
    }
    
    // Обновление даты
    function updateDate() {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        currentDate.textContent = now.toLocaleDateString('ru-RU', options);
    }
    
    // Получение погоды по названию города
    async function getWeatherByCity(city) {
        try {
            const response = await fetch(`${baseUrl}weather?q=${city}&units=metric&lang=ru&appid=${apiKey}`);
            const data = await response.json();
            
            if (data.cod === 200) {
                displayCurrentWeather(data);
                getForecast(data.coord.lat, data.coord.lon);
            } else {
                alert('Город не найден. Пожалуйста, попробуйте другой.');
            }
        } catch (error) {
            console.error('Ошибка при получении данных о погоде:', error);
            alert('Произошла ошибка при получении данных о погоде.');
        }
    }
    
    // Получение погоды по координатам
    async function getWeatherByCoords(lat, lon) {
        try {
            const response = await fetch(`${baseUrl}weather?lat=${lat}&lon=${lon}&units=metric&lang=ru&appid=${apiKey}`);
            const data = await response.json();
            
            if (data.cod === 200) {
                displayCurrentWeather(data);
                getForecast(lat, lon);
            }
        } catch (error) {
            console.error('Ошибка при получении данных о погоде:', error);
        }
    }
    
    // Получение прогноза на 5 дней
    async function getForecast(lat, lon) {
        try {
            const response = await fetch(`${baseUrl}forecast?lat=${lat}&lon=${lon}&units=metric&lang=ru&appid=${apiKey}`);
            const data = await response.json();
            
            if (data.cod === '200') {
                displayForecast(data.list);
            }
        } catch (error) {
            console.error('Ошибка при получении прогноза:', error);
        }
    }
    
    // Отображение текущей погоды
    function displayCurrentWeather(data) {
        cityName.textContent = `${data.name}, ${data.sys.country}`;
        temp.textContent = Math.round(data.main.temp);
        weatherDesc.textContent = data.weather[0].description;
        wind.textContent = data.wind.speed;
        humidity.textContent = data.main.humidity;
        pressure.textContent = data.main.pressure;
        
        // Установка иконки погоды
        const iconCode = data.weather[0].icon;
        weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
        weatherIcon.alt = data.weather[0].main;
    }
    
    // Отображение прогноза на 5 дней
    function displayForecast(forecastList) {
        // Очищаем контейнер прогноза
        forecastContainer.innerHTML = '';
        
        // Группируем прогноз по дням
        const dailyForecast = {};
        
        forecastList.forEach(item => {
            const date = new Date(item.dt * 1000);
            const day = date.toLocaleDateString('ru-RU', { weekday: 'short' });
            
            if (!dailyForecast[day]) {
                dailyForecast[day] = {
                    temps: [],
                    icons: [],
                    descriptions: []
                };
            }
            
            dailyForecast[day].temps.push(item.main.temp);
            dailyForecast[day].icons.push(item.weather[0].icon);
            dailyForecast[day].descriptions.push(item.weather[0].description);
        });
        
        // Отображаем прогноз для каждого дня
        for (const day in dailyForecast) {
            if (Object.keys(dailyForecast).indexOf(day) >= 5) break;
            
            const dayForecast = dailyForecast[day];
            const avgTemp = Math.round(dayForecast.temps.reduce((a, b) => a + b, 0) / dayForecast.temps.length);
            const maxTemp = Math.round(Math.max(...dayForecast.temps));
            const minTemp = Math.round(Math.min(...dayForecast.temps));
            
            // Наиболее часто встречающаяся иконка
            const iconCounts = {};
            dayForecast.icons.forEach(icon => {
                iconCounts[icon] = (iconCounts[icon] || 0) + 1;
            });
            const mostCommonIcon = Object.keys(iconCounts).reduce((a, b) => iconCounts[a] > iconCounts[b] ? a : b);
            
            // Наиболее часто встречающееся описание
            const descCounts = {};
            dayForecast.descriptions.forEach(desc => {
                descCounts[desc] = (descCounts[desc] || 0) + 1;
            });
            const mostCommonDesc = Object.keys(descCounts).reduce((a, b) => descCounts[a] > descCounts[b] ? a : b);
            
            // Создаем элемент прогноза
            const forecastDay = document.createElement('div');
            forecastDay.className = 'forecast-day';
            forecastDay.innerHTML = `
                <h3>${day}</h3>
                <img src="https://openweathermap.org/img/wn/${mostCommonIcon}.png" alt="${mostCommonDesc}">
                <p>${mostCommonDesc}</p>
                <p><span class="temp">${maxTemp}°</span> <span class="temp-night">${minTemp}°</span></p>
            `;
            
            forecastContainer.appendChild(forecastDay);
        }
    }
    
    // Обработчик клика по кнопке поиска
    searchBtn.addEventListener('click', function() {
        const city = cityInput.value.trim();
        if (city) {
            getWeatherByCity(city);
        }
    });
    
    // Обработчик нажатия Enter в поле ввода
    cityInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const city = cityInput.value.trim();
            if (city) {
                getWeatherByCity(city);
            }
        }
    });
    
    // Инициализация приложения
    init();
});