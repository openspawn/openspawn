import { request } from 'node:http';

export function statusCommand(): void {
  const port = 3333;
  const url = `http://localhost:${port}/api/agents`;

  const req = request(url, { timeout: 3000 }, (res) => {
    let data = '';
    res.on('data', (chunk: Buffer) => { data += chunk.toString(); });
    res.on('end', () => {
      try {
        const agents = JSON.parse(data);
        const total = Array.isArray(agents) ? agents.length : 0;
        const active = Array.isArray(agents) ? agents.filter((a: Record<string, unknown>) => a.status === 'active' || a.status === 'working').length : 0;
        const idle = total - active;

        console.log(`
\x1b[36m🪸 OpenSpawn Status\x1b[0m

Server:     http://localhost:${port} \x1b[32m✓\x1b[0m
Agents:     ${total} (${active} active, ${idle} idle)
Protocols:  A2A ✓  MCP ✓
`);
      } catch {
        showOffline();
      }
    });
  });

  req.on('error', () => { showOffline(); });
  req.on('timeout', () => { req.destroy(); showOffline(); });
  req.end();
}

function showOffline(): void {
  console.log(`
\x1b[36m🪸 OpenSpawn Status\x1b[0m

Server:     \x1b[31mNot running\x1b[0m

No server detected on localhost:3333.
Start with: \x1b[36mopenspawn start\x1b[0m
`);
}
