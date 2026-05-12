import * as v from 'valibot';

const EnvSchema = v.object({
	SEARXNG_AUTH: v.optional(v.pipe(v.string(), v.trim())),
	SEARXNG_BASE_URL: v.pipe(
		v.string(),
		v.trim(),
		v.url(),
		v.check((d) => {
			const u = new URL(d);
			return u.protocol === 'https:' || u.protocol === 'http:';
		}),
	),
});

export const env = v.parse(EnvSchema, process.env);
