let adapter;

	({ default: adapter } = await import('@sveltejs/adapter-node'));


/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter()
	}
};

export default config;