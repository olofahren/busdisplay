import { writable, derived } from 'svelte/store';
export const prerender = true;
export interface Platform {
  id: string;
  designation: string;
}

export interface Route {
  name: string | null;
  designation: string;
  transport_mode_code: number;
  transport_mode: 'BUS' | 'TRAM';
  direction: string;
  origin: { id: string; name: string };
  destination: { id: string; name: string };
}

export interface Trip {
  trip_id: string;
  start_date: string;
  technical_number: number;
}

export interface Agency {
  id: string;
  name: string;
  operator: string;
}

export interface Stop {
  id: string;
  name: string;
  lat: number;
  lon: number;
  transport_modes: string[];
  alerts: unknown[];
}

export interface Departure {
  scheduled: string;
  realtime: string;
  delay: number;
  canceled: boolean;
  route: Route;
  trip: Trip;
  agency: Agency;
  stop: Stop;
  scheduled_platform: Platform;
  realtime_platform: Platform;
  alerts: unknown[];
  is_realtime: boolean;
}

export interface BusApiResponse {
  timestamp: string;
  query: { queryTime: string; query: string };
  stops: Stop[];
  departures: Departure[];
}

export const busData = writable<BusApiResponse | null>(null);
export const loading = writable<boolean>(false);
export const error = writable<string | null>(null);
export const currentTime = writable<number>(Date.now());

export const departures = derived<typeof busData, Departure[]>(busData, ($busData) => {
  if ($busData && $busData.departures) {
    return $busData.departures.filter(dep => !dep.canceled);
  }
  return [];
});

export const stopName = derived<typeof busData, string>(busData, ($busData) => {
  if ($busData && $busData.stops && $busData.stops.length > 0) {
    return $busData.stops[0].name;
  }
  return 'Bus Stop';
});

export const lastUpdated = derived<typeof busData, Date | null>(busData, ($busData) => {
  if ($busData && $busData.timestamp) {
    return new Date($busData.timestamp);
  }
  return null;

});

export const timeSinceLastUpdate = derived<[typeof currentTime, typeof lastUpdated], string>(
  [currentTime, lastUpdated],
  ([$currentTime, $lastUpdated]) => {
    if (!$lastUpdated) return 'never';
    const diffMs = $currentTime - $lastUpdated.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    if (diffSeconds < 1) return 'just now';
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins === 1) return '1m ago';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ago`;
  }
);