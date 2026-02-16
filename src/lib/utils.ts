export function formatTime(timeString: string): string {
  const date = new Date(timeString);
  return date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
}

export function getDelay(delay: number): string {
  if (delay === 0) return 'On time';
  
  const isLate = delay > 0;
  const absDeley = Math.abs(delay);
  const minutes = Math.floor(absDeley / 60);
  const seconds = absDeley % 60;
  
  let result = '';
  if (minutes > 0) {
    result += `${minutes}m`;
  }
  if (seconds > 0) {
    if (result) result += ' ';
    result += `${seconds}s`;
  }
  
  return isLate ? `${result} late` : `${result} early`;
}

export type DelayClass = 'on-time' | 'delayed' | 'early';

export function getDelayClass(delay: number): DelayClass {
  if (delay === 0) return 'on-time';
  if (delay > 0) return 'delayed';
  return 'early';
}

export function getMinutesUntilDeparture(departureTime: string, currentTime: number): string {
  const departureDate = new Date(departureTime).getTime();
  const secondsUntil = Math.max(0, Math.ceil((departureDate - currentTime) / 1000));
  
  const minutes = Math.floor(secondsUntil / 60);
  const seconds = secondsUntil % 60;
  
  if (minutes === 0) {
    return `${seconds}s`;
  }
  
  return `${minutes}m ${seconds}s`;
}

export function departsWithin5Minutes(departureTime: string, currentTime: number): boolean {
  const departureDate = new Date(departureTime);
  const diffInSeconds = (departureDate.getTime() - currentTime) / 1000;
  return diffInSeconds <= 5 * 60;
}

export function getActualDepartureTime(scheduledTime: string, delay: number): Date {
  const date = new Date(scheduledTime);
  date.setSeconds(date.getSeconds() + delay);
  return date;
}
