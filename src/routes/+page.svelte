<script lang="ts">
  import { onMount } from 'svelte';
  import { busData, loading, error, departures, stopName, timeSinceLastUpdate, currentTime } from './store';
  import DepartureCard from '../lib/DepartureCard.svelte';
  import WeatherWidget, { type WeatherData } from '../lib/WeatherWidget.svelte';
  import { fetchBusData, fetchWeatherData } from '../lib/api';

  const BUS_API_URL = 'https://realtime-api.trafiklab.se/v1/departures/740026008?key=6afd99eae92849e68af272ea6aeafb43';
  const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast?latitude=58.58711&longitude=16.182502&daily=temperature_2m_min,temperature_2m_max,wind_speed_10m_max,uv_index_max,precipitation_probability_max&current=temperature_2m&timezone=Europe%2FBerlin&forecast_days=1&wind_speed_unit=ms';

  let weatherData: WeatherData | null = null;
  let weatherError: string | null = null;
  let lastRefetchTime = 0;
  let displayedDepartureCount = 0;
  let busRetryInterval: ReturnType<typeof setInterval> | undefined;
  let weatherRetryInterval: ReturnType<typeof setInterval> | undefined;

  async function handleBusDataFetch() {
    loading.set(true);
    error.set(null);
    try {
      const data = await fetchBusData(BUS_API_URL);
      busData.set(data);
      currentTime.set(Date.now());
      // Clear retry interval on successful fetch
      if (busRetryInterval) {
        clearInterval(busRetryInterval);
        busRetryInterval = undefined;
      }
    } catch (err) {
      error.set(err instanceof Error ? err.message : 'Unknown error');
      console.error(err);
      // Set up retry interval if not already active
      if (!busRetryInterval) {
        busRetryInterval = setInterval(handleBusDataFetch, 60 * 1000);
      }
    } finally {
      loading.set(false);
    }
  }

  async function handleWeatherFetch() {
    weatherError = null;
    try {
      weatherData = await fetchWeatherData(WEATHER_API_URL);
      // Clear retry interval on successful fetch
      if (weatherRetryInterval) {
        clearInterval(weatherRetryInterval);
        weatherRetryInterval = undefined;
      }
    } catch (err) {
      weatherError = err instanceof Error ? err.message : 'Unknown error';
      console.error(err);
      // Set up retry interval if not already active
      if (!weatherRetryInterval) {
        weatherRetryInterval = setInterval(handleWeatherFetch, 60 * 1000);
      }
    }
  }

  function getLine74Departures() {
    const now = $currentTime;
    return $departures
      .filter(dep => {
        const departureTime = new Date(dep.realtime).getTime();
        return departureTime > now && dep.route.designation === '74';
      })
      .sort((a, b) => {
        const aTime = new Date(a.realtime).getTime();
        const bTime = new Date(b.realtime).getTime();
        return aTime - bTime;
      });
  }

  function getOtherDepartures() {
    const now = $currentTime;
    return $departures
      .filter(dep => {
        const departureTime = new Date(dep.realtime).getTime();
        return departureTime > now && dep.route.designation !== '74';
      })
      .sort((a, b) => {
        const aTime = new Date(a.realtime).getTime();
        const bTime = new Date(b.realtime).getTime();
        return aTime - bTime;
      })
      .slice(0, 10);
  }

  onMount(() => {
    handleBusDataFetch();
    handleWeatherFetch();

    let fetchInterval: ReturnType<typeof setInterval> | undefined;
    let weatherInterval: ReturnType<typeof setInterval> | undefined;
    
    if (isEarlyMorning()) {
      fetchInterval = setInterval(handleBusDataFetch, 2 * 60 * 1000);
    }

    weatherInterval = setInterval(handleWeatherFetch, 4 * 60 * 60 * 1000);
    
    const timeInterval = setInterval(() => {
      currentTime.set(Date.now());
      
      // Check if we have fewer departures than before (some have passed)
      const now = Date.now();
      const futureDepartures = $departures.filter(dep => {
        const departureTime = new Date(dep.realtime).getTime();
        return departureTime > now;
      });
      
      // If we've lost departures (count decreased), refetch new data
      if (futureDepartures.length < displayedDepartureCount && (now - lastRefetchTime) > 5000) {
        lastRefetchTime = now;
        handleBusDataFetch();
      }
      
      displayedDepartureCount = futureDepartures.length;
    }, 1000);
    
    return () => {
      if (fetchInterval) clearInterval(fetchInterval);
      if (weatherInterval) clearInterval(weatherInterval);
      if (busRetryInterval) clearInterval(busRetryInterval);
      if (weatherRetryInterval) clearInterval(weatherRetryInterval);
      clearInterval(timeInterval);
    };
  });

  function isEarlyMorning(): boolean {
    const now = new Date();
    return now.getHours() === 6 && now.getMinutes() < 45;
  }
</script>

<div class="container">
  <header>
    <div class="header-left">
      <h2>{new Date($currentTime).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</h2>
      {#if $timeSinceLastUpdate}
        <p class="update-time">Refreshed {$timeSinceLastUpdate}</p>
      {/if}
    </div>
    {#if weatherData}
      <WeatherWidget weather={weatherData} />
    {/if}
  </header>

  {#if $loading && !$busData}
    <div class="loading">Loading departures...</div>
  {:else if $error}
    <div class="error">Error: {$error}</div>
    <button on:click={handleBusDataFetch}>Retry</button>
  {:else}
    <div class="departures-list">
      {#each getLine74Departures() as departure (departure.trip.trip_id)}
        <DepartureCard {departure} currentTime={$currentTime} isLine74={true} />
      {/each}
      
      {#if getLine74Departures().length > 0 && getOtherDepartures().length > 0}
        <div class="divider"></div>
      {/if}

      {#each getOtherDepartures() as departure (departure.trip.trip_id)}
        <DepartureCard {departure} currentTime={$currentTime} isLine74={false} />
      {/each}
    </div>
  {/if}

  <footer>
    <button on:click={handleBusDataFetch} disabled={$loading}>Refresh</button>
  </footer>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    background: linear-gradient(135deg, #e10e1c 0%, #c00a16 100%);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    min-height: 100vh;
  }

  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }

  header {
    color: white;
    margin-bottom: 30px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
  }

  .header-left {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  h2 {
    margin: 0 0 5px 0;
    font-size: 3em;
    font-weight: 400;
  }

  .update-time {
    margin: 5px 0 0 0;
    font-size: 0.9em;
    opacity: 0.9;
  }

  .departures-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .divider {
    height: 2px;
    background: white;
    margin: 8px 0;
    opacity: 0.5;
  }

  .loading,
  .error {
    text-align: center;
    padding: 40px 20px;
    background: white;
    border-radius: 8px;
    font-size: 1.1em;
    color: #e10e1c;
  }

  button {
    background: white;
    color: #e10e1c;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    font-weight: bold;
    cursor: pointer;
    font-size: 1em;
    transition: all 0.3s ease;
  }

  button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    background: #f0f0f0;
  }

  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  footer {
    text-align: center;
    margin-top: 30px;
  }

  @media (max-width: 600px) {
    header {
      flex-direction: column;
      align-items: center;
    }

    .header-left {
      text-align: center;
      width: 100%;
    }

    h2 {
      font-size: 1.2em;
    }
  }
</style>