import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const BASE_URL = 'https://realtime-api.trafiklab.se/v1/departures/740026008';

export const GET: RequestHandler = async ({ fetch }) => {
  const apiKey = env.TRAFIKLAB_API_KEY;

  if (!apiKey) {
    return json({ error: 'TRAFIKLAB_API_KEY is not configured' }, { status: 500 });
  }

  const url = new URL(BASE_URL);
  url.searchParams.set('key', apiKey);

  const response = await fetch(url.toString());

  if (!response.ok) {
    return json({ error: 'Failed to fetch bus data' }, { status: response.status }, );
  }

  const data = await response.json();
  return json(data);
};
