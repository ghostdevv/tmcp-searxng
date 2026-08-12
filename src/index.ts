import { ValibotJsonSchemaAdapter } from '@tmcp/adapter-valibot';
import { searchTool } from './tools/search.ts';
import { parseArgs } from 'node:util';
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

type Command = 'serve' | 'stdio';

function args() {
	const args = parseArgs({
		args: process.argv.slice(2),
		allowPositionals: true,
	});

	const command = args.positionals.at(0);

	if (!command || (command !== 'serve' && command !== 'stdio')) {
		// prettier-ignore
		console.error('Missing/Invalid command. Usage: tmcp-searxng <serve|stdio>',);
		process.exit(1);
	}

	return { command: command as Command };
}

const { command } = args();

// oxlint-disable-next-line default-case
switch (command) {
	case 'serve': {
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

		app.get('/health', (c) => {
			return c.text('All is well');
		});

		serve({ fetch: app.fetch, hostname: env.HOST, port: 4143 }, (f) => {
			console.log(`Listening on http://${f.address}:${f.port}`);
		});
		break;
	}

	case 'stdio': {
		const { StdioTransport } = await import('@tmcp/transport-stdio');
		const transport = new StdioTransport(server);
		transport.listen();
		break;
	}
}
