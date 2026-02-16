<script context="module" lang="ts">
  export interface WeatherData {
    daily: {
      temperature_2m_min: number[];
      temperature_2m_max: number[];
      wind_speed_10m_max: number[];
      uv_index_max: number[];
      precipitation_probability_max: number[];
    };
  }
</script>

<script lang="ts">
  export let weather: WeatherData;
</script>

<div class="weather-widget">
  <div class="weather-item">
    <span class="weather-label">High</span>
    <span class="weather-value">{weather.daily.temperature_2m_max[0]}°C</span>
  </div>
  <div class="weather-item">
    <span class="weather-label">Low</span>
    <span class="weather-value">{weather.daily.temperature_2m_min[0]}°C</span>
  </div>
  <div class="weather-item">
    <span class="weather-label">Wind</span>
    <span class="weather-value">{weather.daily.wind_speed_10m_max[0]} km/h</span>
  </div>
  <div class="weather-item">
    <span class="weather-label">Rain</span>
    <span class="weather-value">{weather.daily.precipitation_probability_max[0]}%</span>
  </div>
  <div class="weather-item">
    <span class="weather-label">UV</span>
    <span class="weather-value">{weather.daily.uv_index_max[0].toFixed(1)}</span>
  </div>
</div>

<style>
  .weather-widget {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 8px;
    padding: 12px;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    min-width: 400px;
  }

  .weather-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    text-align: center;
  }

  .weather-label {
    font-size: 0.7em;
    color: #666;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .weather-value {
    font-size: 0.95em;
    color: #333;
    font-weight: bold;
  }

  @media (max-width: 600px) {
    .weather-widget {
      grid-template-columns: repeat(3, 1fr);
      min-width: auto;
      width: 100%;
    }
  }
</style>
