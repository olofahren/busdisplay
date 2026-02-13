<script lang="ts">
  import { onMount } from 'svelte';
  import { busData, loading, error, departures, stopName, timeSinceLastUpdate, currentTime, type BusApiResponse } from './store.ts';

  const API_URL = 'https://realtime-api.trafiklab.se/v1/departures/740026008?key=6afd99eae92849e68af272ea6aeafb43';

  async function fetchBusData(): Promise<void> {
    loading.set(true);
    error.set(null);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Failed to fetch bus data');
      const data: BusApiResponse = await response.json();
      busData.set(data);
      currentTime.set(Date.now());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      error.set(errorMessage);
      console.error(err);
    } finally {
      loading.set(false);
    }
  }

  function formatTime(timeString: string): string {
    const date = new Date(timeString);
    return date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
  }

  function getDelay(delay: number): string {
    if (delay === 0) return 'On time';
    if (delay > 0) return `${delay}s late`;
    return `${Math.abs(delay)}s early`;
  }

  function getDelayClass(delay: number): 'on-time' | 'delayed' | 'early' {
    if (delay === 0) return 'on-time';
    if (delay > 0) return 'delayed';
    return 'early';
  }

  function departsWithin5Minutes(departureTime: string): boolean {
    const now = new Date();
    const departureDate = new Date(departureTime);
    const diffInSeconds = (departureDate.getTime() - now.getTime()) / 1000;
    return diffInSeconds <= 5 * 60;
  }

  function getMinutesUntilDeparture(departureTime: string, delay: number): number {
    const departureDate = new Date(departureTime).getTime();
    const now = $currentTime;
    const minutesUntil = Math.max(0, Math.ceil((departureDate - now) / 60000));
    return minutesUntil;
  }

  function shouldRefreshFrequently(): boolean {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    return hours === 6 && minutes < 45;
  }

  function getLine74Departures() {
    return $departures.filter(dep => dep.route.designation === '74');
  }

  function getOtherDepartures() {
    return $departures.filter(dep => dep.route.designation !== '74').slice(0, 10);
  }

  function getDisplayedDepartures() {
    return [...getLine74Departures(), ...getOtherDepartures()];
  }

  function shouldShowDividerBefore(index: number): boolean {
    const line74Count = getLine74Departures().length;
    return line74Count > 0 && index === line74Count;
  }

  function isLine74(designation: string): boolean {
    return designation === '74';
  }

  onMount(() => {
    fetchBusData();
    let fetchInterval: ReturnType<typeof setInterval> | undefined;
    
    if (shouldRefreshFrequently()) {
      fetchInterval = setInterval(fetchBusData, 2 * 60 * 1000);
    }
    
    const timeInterval = setInterval(() => {
      currentTime.set(Date.now());
    }, 1000);
    
    return () => {
      if (fetchInterval) clearInterval(fetchInterval);
      clearInterval(timeInterval);
    };
  });
</script>

<div class="container">
  <header>
    <h2>{$stopName}</h2>
    {#if $timeSinceLastUpdate}
      <p class="update-time">Refreshed {$timeSinceLastUpdate}</p>
    {/if}
  </header>

  {#if $loading && !$busData}
    <div class="loading">Loading departures...</div>
  {:else if $error}
    <div class="error">Error: {$error}</div>
    <button on:click={fetchBusData}>Retry</button>
  {:else}
    <div class="departures-list">
      {#each getLine74Departures() as departure (departure.trip.trip_id)}
        <div class="departure-card line-74">
          <div class="route-info">
            <span class="route-number">{departure.route.designation}</span>
            <span class="transport-mode" class:bus={departure.route.transport_mode === 'BUS'} class:tram={departure.route.transport_mode === 'TRAM'}>
              {departure.route.transport_mode}
            </span>
          </div>
          <div class="destination">
            <strong>{departure.route.destination.name}</strong>
            <span class="direction">via {departure.route.direction}</span>
          </div>
          <div class="times">
            <div class="time-box" class:departs-soon={departsWithin5Minutes(departure.realtime)}>
              <div class="label">Departs</div>
              <div class="time">{formatTime(departure.realtime)}</div>
              <div class="minutes-until">in {getMinutesUntilDeparture(departure.realtime, departure.delay)} min</div>
            </div>
            <div class="platform-box">
              <div class="label">Platform</div>
              <div class="platform">{departure.realtime_platform.designation}</div>
            </div>
          </div>
          <div class="status-box" class:delayed={departure.delay > 0} class:early={departure.delay < 0}>
            <span class="delay {getDelayClass(departure.delay)}">{getDelay(departure.delay)}</span>
          </div>
        </div>
      {/each}
      
      {#if getLine74Departures().length > 0 && getOtherDepartures().length > 0}
        <div class="divider"></div>
      {/if}

      {#each getOtherDepartures() as departure (departure.trip.trip_id)}
        <div class="departure-card">
          <div class="route-info">
            <span class="route-number">{departure.route.designation}</span>
            <span class="transport-mode" class:bus={departure.route.transport_mode === 'BUS'} class:tram={departure.route.transport_mode === 'TRAM'}>
              {departure.route.transport_mode}
            </span>
          </div>
          <div class="destination">
            <strong>{departure.route.destination.name}</strong>
            <span class="direction">via {departure.route.direction}</span>
          </div>
          <div class="times">
            <div class="time-box" class:departs-soon={departsWithin5Minutes(departure.realtime)}>
              <div class="label">Departs</div>
              <div class="time">{formatTime(departure.realtime)}</div>
              <div class="minutes-until">in {getMinutesUntilDeparture(departure.realtime, departure.delay)} min</div>
            </div>
            <div class="platform-box">
              <div class="label">Platform</div>
              <div class="platform">{departure.realtime_platform.designation}</div>
            </div>
          </div>
          <div class="status-box" class:delayed={departure.delay > 0} class:early={departure.delay < 0}>
            <span class="delay {getDelayClass(departure.delay)}">{getDelay(departure.delay)}</span>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <footer>
    <button on:click={fetchBusData} disabled={$loading}>Refresh</button>
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
    text-align: center;
    color: white;
    margin-bottom: 30px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  h1 {
    margin: 0 0 10px 0;
    font-size: 2.5em;
  }

  h2 {
    margin: 0 0 5px 0;
    font-size: 1.5em;
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

  .departure-card {
    background: white;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 16px;
    align-items: start;
  }

  .departure-card.line-74 {
    background: rgb(255, 222, 185);
    border: 2px solid #e10e1c;
  }

  .departure-card.line-74 .route-number,
  .departure-card.line-74 .destination strong,
  .departure-card.line-74 .direction,
  .departure-card.line-74 .time,
  .departure-card.line-74 .label {
    color: #333;
  }

  .departure-card.line-74 .platform {
    color: #e10e1c;
  }

  .departure-card.line-74 .status-box {
    background: rgba(225, 14, 28, 0.1);
  }

  .departure-card.line-74 .delay {
    color: #333;
  }

  .departs-soon {
    background: #e10e1c;
    color: rgb(255, 255, 255);
    padding: 4px;
    border-radius: 6px;
  }

  .departs-soon .label,
  .departs-soon .time {
    color: white;
  }

  .minutes-until {
    font-size: 0.75em;
    color: #666;
    margin-top: 4px;
  }

  .departs-soon .minutes-until {
    color: white;
  }

  .route-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .route-number {
    font-size: 1.8em;
    font-weight: bold;
    color: #333;
    min-width: 50px;
    text-align: center;
  }

  .transport-mode {
    font-size: 0.75em;
    font-weight: bold;
    padding: 4px 8px;
    border-radius: 4px;
    text-align: center;
  }

  .transport-mode.bus {
    background: #e10e1c;
    color: white;
  }

  .transport-mode.tram {
    background: #e10e1c;
    color: white;
  }

  .destination {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .destination strong {
    font-size: 1.1em;
    color: #333;
  }

  .direction {
    font-size: 0.85em;
    color: #666;
  }

  .times {
    display: flex;
    gap: 12px;
    align-items: flex-start;
  }

  .time-box,
  .platform-box {
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .label {
    font-size: 0.75em;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .time {
    font-size: 1.4em;
    font-weight: bold;
    color: #333;
  }

  .platform {
    font-size: 1.2em;
    font-weight: bold;
    color: #e10e1c;
  }

  .status-box {
    text-align: center;
    padding: 8px;
    border-radius: 6px;
    background: #f0f0f0;
  }

  .status-box.delayed {
    background: #ffe0e0;
  }

  .status-box.early {
    background: #e0f0e0;
  }

  .delay {
    font-weight: bold;
    font-size: 0.9em;
  }

  .delay.on-time {
    color: #27ae60;
  }

  .delay.delayed {
    color: #e10e1c;
  }

  .delay.early {
    color: #27ae60;
  }

  .loading,
  .error {
    text-align: center;
    padding: 40px 20px;
    background: white;
    border-radius: 8px;
    font-size: 1.1em;
  }

  .loading {
    color: #e10e1c;
  }

  .error {
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
    .departure-card {
      grid-template-columns: auto 1fr;
      gap: 12px;
    }

    .times {
      grid-column: 1 / -1;
      justify-content: space-between;
    }

    .status-box {
      grid-column: 1 / -1;
    }

    h1 {
      font-size: 2em;
    }

    h2 {
      font-size: 1.2em;
    }
  }
</style>