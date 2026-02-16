export async function fetchBusData(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch bus data');
  return response.json();
}

export async function fetchWeatherData(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch weather data');
  return response.json();
}
