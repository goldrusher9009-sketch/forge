'use strict';

const http = require('node:http');
const https = require('node:https');
const net = require('node:net');
const { resolvePublicTarget } = require('./security');

const PORT = Number(process.env.PORT || 8787);
const allowlist = String(process.env.FORGE_SANDBOX_EGRESS_ALLOWLIST || '').split(',').map(value => value.trim().toLowerCase()).filter(Boolean);

function fail(socketOrResponse, statusCode, message) {
  if (!socketOrResponse || socketOrResponse.destroyed || socketOrResponse.writableEnded) return;
  try {
    if (typeof socketOrResponse.writeHead === 'function') {
      socketOrResponse.writeHead(statusCode, {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-store',
        'X-Forge-Egress-Blocked': String(message || 'SANDBOX_EGRESS_REJECTED').slice(0, 200),
      });
      socketOrResponse.end(message);
    } else {
      socketOrResponse.end(`HTTP/1.1 ${statusCode} ${message}\r\nConnection: close\r\n\r\n`);
    }
  } catch {
    socketOrResponse.destroy();
  }
}

const proxy = http.createServer(async (req, res) => {
  try {
    const target = new URL(req.url);
    if (!['http:', 'https:'].includes(target.protocol)) throw new Error('SANDBOX_EGRESS_SCHEME_REJECTED');
    const port = Number(target.port || (target.protocol === 'https:' ? 443 : 80));
    if (![80, 443].includes(port)) throw new Error('SANDBOX_EGRESS_PORT_REJECTED');
    const address = await resolvePublicTarget(target.hostname, allowlist);
    const headers = { ...req.headers, host: target.host };
    delete headers['proxy-authorization'];
    delete headers['proxy-connection'];
    const transport = target.protocol === 'https:' ? https : http;
    const upstream = transport.request({
      hostname: address,
      servername: target.hostname,
      port,
      method: req.method,
      path: `${target.pathname}${target.search}`,
      headers,
      timeout: 30_000,
    }, upstreamResponse => {
      res.writeHead(upstreamResponse.statusCode || 502, upstreamResponse.headers);
      upstreamResponse.pipe(res);
    });
    upstream.on('timeout', () => upstream.destroy(new Error('SANDBOX_EGRESS_TIMEOUT')));
    upstream.on('error', error => { if (!res.headersSent) fail(res, 502, error.message); else res.destroy(error); });
    req.pipe(upstream);
    console.log(JSON.stringify({ type: 'egress', method: req.method, host: target.hostname, port }));
  } catch (error) {
    fail(res, 403, String(error.message || 'SANDBOX_EGRESS_REJECTED'));
  }
});

proxy.on('connect', async (req, clientSocket, head) => {
  let upstream = null;
  let connected = false;
  clientSocket.on('error', () => {
    if (upstream) upstream.destroy();
  });
  clientSocket.on('close', () => {
    if (upstream) upstream.destroy();
  });
  try {
    const parsed = new URL(`http://${req.url}`);
    const port = Number(parsed.port || 443);
    if (port !== 443) throw new Error('SANDBOX_EGRESS_PORT_REJECTED');
    const address = await resolvePublicTarget(parsed.hostname, allowlist);
    upstream = net.connect({ host: address, port }, () => {
      connected = true;
      clientSocket.write('HTTP/1.1 200 Connection Established\r\nProxy-Agent: forge-sandbox-egress\r\n\r\n');
      if (head && head.length) upstream.write(head);
      upstream.pipe(clientSocket);
      clientSocket.pipe(upstream);
    });
    upstream.setTimeout(120_000, () => upstream.destroy());
    upstream.on('error', error => {
      if (!connected) fail(clientSocket, 502, error.message);
      else clientSocket.destroy();
    });
    upstream.on('close', () => clientSocket.destroy());
    console.log(JSON.stringify({ type: 'egress-connect', host: parsed.hostname, port }));
  } catch (error) {
    fail(clientSocket, 403, String(error.message || 'SANDBOX_EGRESS_REJECTED'));
  }
});

proxy.listen(PORT, '0.0.0.0', () => console.log(`Forge Sandbox Egress Proxy listening on ${PORT}`));
