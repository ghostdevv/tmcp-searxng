import { defineTool } from 'tmcp/tool';
import { env } from '../env.ts';
import { ofetch } from 'ofetch';
import * as v from 'valibot';

const SearchResultSchema = v.object({
	title: v.pipe(v.string(), v.trim(), v.minLength(1)),
	url: v.pipe(v.string(), v.trim(), v.url()),
	content: v.pipe(v.string(), v.trim(), v.minLength(1)),
});

type SearchResult = v.InferOutput<typeof SearchResultSchema>;

interface SearxngResponse {
	results: Partial<SearchResult>[];
}

const searchSchema = v.object({
	query: v.pipe(v.string(), v.nonEmpty()),
	time_range: v.optional(v.picklist(['day', 'week', 'month', 'year'])),
});

export const searchTool = defineTool(
	{
		name: 'web_search',
		description:
			'Search the web returning a markdown list of results, with the page title, url, and content snippet. Use the fetch tool to fetch the content of individual pages as needed.',
		schema: searchSchema,
	},
	async ({ query: q, time_range }) => {
		const data = await ofetch<SearxngResponse>('/search', {
			baseURL: env.SEARXNG_BASE_URL,
			headers: {
				Authorization: env.SEARXNG_AUTH,
				'User-Agent':
					'tmcp-searxng (+https://github.com/ghostdevv/tmcp-searxng)',
			},
			params: {
				format: 'json',
				time_range,
				q,
			},
		});

		return {
			content: data.results.map((result) => ({
				type: 'text',
				text: `### ${result.title}\n\nURL: ${result.url}\nSnippet: ${result.content}`,
			})),
		};
	},
);
