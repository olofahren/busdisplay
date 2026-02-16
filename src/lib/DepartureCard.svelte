<script lang="ts">
  import type { Departure } from '../routes/store';
  import { formatTime, getDelay, getDelayClass, getMinutesUntilDeparture, departsWithin5Minutes } from './utils';

  export let departure: Departure;
  export let currentTime: number;
  export let isLine74: boolean = false;

  $: significantDelay = Math.abs(departure.delay) >= 60;
  $: realtimeString = formatTime(departure.realtime);
  $: scheduledTimeString = formatTime(departure.scheduled);
  $: showDualTimes = significantDelay && realtimeString !== scheduledTimeString;
</script>

<div class="departure-card" class:line-74={isLine74}>
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
    <div class="time-box" class:departs-soon={departsWithin5Minutes(departure.realtime, currentTime)}>
      <div class="label">Departs</div>
      {#if showDualTimes}
        <div class="time scheduled">{scheduledTimeString}</div>
        <div class="time actual">{realtimeString}</div>
      {:else}
        <div class="time">{realtimeString}</div>
      {/if}
      <div class="minutes-until">in {getMinutesUntilDeparture(departure.realtime, currentTime)}</div>
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

<style>
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
  .departs-soon .time,
  .departs-soon .time.scheduled,
  .departs-soon .time.actual {
    color: white;
  }

  .departure-card.line-74 .departs-soon .time,
  .departure-card.line-74 .departs-soon .label {
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

  .time.scheduled {
    text-decoration: line-through;
    font-size: 0.9em;
    opacity: 0.6;
  }

  .time.actual {
    font-size: 1.4em;
    color: #e10e1c;
  }

  .departs-soon .time.actual {
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
  }
</style>
