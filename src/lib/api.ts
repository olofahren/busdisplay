export async function fetchBusData(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = body?.error ?? `HTTP ${response.status}`;
    throw new Error(message);
  }
  return response.json();
}

export async function fetchWeatherData(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Weather API error: HTTP ${response.status}`);
  return response.json();
}
