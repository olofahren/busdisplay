import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const BASE_URL = 'https://realtime-api.trafiklab.se/v1/departures/740026008';

export const GET: RequestHandler = async ({ fetch }) => {
  const apiKey = env.TRAFIKLAB_API_KEY;

  if (!apiKey) {
    console.error('[api/bus] TRAFIKLAB_API_KEY is not set');
    return json({ error: 'TRAFIKLAB_API_KEY is not configured' }, { status: 500 });
  }

  const url = new URL(BASE_URL);
  url.searchParams.set('key', apiKey);

  let response: Response;
  try {
    response = await fetch(url.toString());
  } catch (err) {
    console.error('[api/bus] Network error fetching Trafiklab:', err);
    return json({ error: 'Network error reaching Trafiklab API' }, { status: 502 });
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    console.error(`[api/bus] Trafiklab returned ${response.status}: ${body}`);
    return json(
      { error: `Trafiklab API error: ${response.status}`, detail: body },
      { status: response.status >= 500 ? 502 : response.status }
    );
  }

  const data = await response.json();
  return json(data);
};
