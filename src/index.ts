import { ValibotJsonSchemaAdapter } from '@tmcp/adapter-valibot';
import { CliTransport } from '@tmcp/transport-cli';
import { searchTool } from './tools/search.ts';
import { McpServer } from 'tmcp';
import { env } from './env.ts';

const adapter = new ValibotJsonSchemaAdapter();

const server = new McpServer(
	{
		name: 'searxng',
		version: '1.0.0',
		description: 'Search the web with SearXNG',
	},
	{
		adapter,
		capabilities: {
			tools: { listChanged: true },
		},
	},
);

server.tool(searchTool);

const cli = new CliTransport(server, {
	setup(sade) {
		sade.command('serve')
			.describe('Serve the MCP server over Streamable HTTP')
			.action(async () => {
				const { HttpTransport } = await import('@tmcp/transport-http');
				const { serve } = await import('@hono/node-server');
				const { Hono } = await import('hono');

				const transport = new HttpTransport(server);
				const app = new Hono();

				app.use(async (req) => {
					const res = await transport.respond(req.req.raw);
					if (res) return res;
					return req.notFound();
				});

				serve(
					{ fetch: app.fetch, hostname: env.HOST, port: 4143 },
					(f) => {
						console.log(
							`Listening on http://${f.address}:${f.port}`,
						);
					},
				);
			});

		sade.command('stdio')
			.describe('Serve the MCP server over STDIO')
			.action(async () => {
				const { StdioTransport } =
					await import('@tmcp/transport-stdio');
				const transport = new StdioTransport(server);
				transport.listen();
			});
	},
});

await cli.run();
