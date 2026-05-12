import { defineTool } from 'tmcp/tool';
import { tool } from 'tmcp/utils';
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
		name: 'search',
		description:
			'Search the web using SearXNG. Returns a list of search results with titles, URLs, and snippets.',
		schema: searchSchema,
	},
	async ({ query: q, time_range }) => {
		const data = await ofetch<SearxngResponse>('/search', {
			baseURL: process.env.SEARXNG_BASE_URL,
			params: {
				format: 'json',
				time_range,
				q,
			},
		});

		const result = data.results
			.filter((result) => v.is(SearchResultSchema, result))
			.map((result) => {
				return `### ${result.title}\n\nURL: ${result.url}\nSnippet: ${result.content}`;
			})
			.join('\n\n');

		return tool.text(result);
	},
);
