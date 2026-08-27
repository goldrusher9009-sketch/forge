'use strict';

const http = require('node:http');

function demultiplexDockerStream(buffer) {
  const stdout = [];
  const stderr = [];
  let offset = 0;
  while (offset + 8 <= buffer.length) {
    const stream = buffer[offset];
    const size = buffer.readUInt32BE(offset + 4);
    if (offset + 8 + size > buffer.length) break;
    const payload = buffer.subarray(offset + 8, offset + 8 + size);
    (stream === 2 ? stderr : stdout).push(payload);
    offset += 8 + size;
  }
  if (offset === 0 && buffer.length) stdout.push(buffer);
  return { stdout: Buffer.concat(stdout).toString('utf8'), stderr: Buffer.concat(stderr).toString('utf8') };
}

class DockerApi {
  constructor(socketPath = '/var/run/docker.sock') {
    this.socketPath = socketPath;
  }

  request(method, requestPath, body, { raw = false, allow404 = false, timeoutMs = 30_000 } = {}) {
    const tarRequest = Buffer.isBuffer(body);
    const payload = body == null ? null : (tarRequest ? body : Buffer.from(JSON.stringify(body)));
    return new Promise((resolve, reject) => {
      const req = http.request({
        socketPath: this.socketPath,
        path: requestPath,
        method,
        headers: payload ? { 'Content-Type': tarRequest ? 'application/x-tar' : 'application/json', 'Content-Length': String(payload.length) } : {},
      }, res => {
        const chunks = [];
        let bytes = 0;
        res.on('data', chunk => {
          bytes += chunk.length;
          if (bytes > 32 * 1024 * 1024) {
            req.destroy(new Error('DOCKER_RESPONSE_TOO_LARGE'));
            return;
          }
          chunks.push(chunk);
        });
        res.on('end', () => {
          const data = Buffer.concat(chunks);
          if (res.statusCode >= 400 && !(allow404 && res.statusCode === 404)) {
            reject(new Error(`DOCKER_HTTP_${res.statusCode}: ${data.toString('utf8').slice(0, 1000)}`));
            return;
          }
          if (raw) { resolve({ statusCode: res.statusCode, headers: res.headers, data }); return; }
          if (!data.length) { resolve({ statusCode: res.statusCode, data: null }); return; }
          try { resolve({ statusCode: res.statusCode, data: JSON.parse(data.toString('utf8')) }); }
          catch { resolve({ statusCode: res.statusCode, data: data.toString('utf8') }); }
        });
      });
      req.setTimeout(timeoutMs, () => req.destroy(new Error('DOCKER_REQUEST_TIMEOUT')));
      req.on('error', reject);
      if (payload) req.write(payload);
      req.end();
    });
  }

  async ping() { return this.request('GET', '/_ping', null, { raw: true }); }
  async inspectVolume(name, allow404 = false) { return this.request('GET', `/volumes/${encodeURIComponent(name)}`, null, { allow404 }); }
  async createVolume(name, labels) { return this.request('POST', '/volumes/create', { Name: name, Labels: labels }); }
  async createContainer(name, spec) { return this.request('POST', `/containers/create?name=${encodeURIComponent(name)}`, spec); }
  async inspectContainer(name, allow404 = false) { return this.request('GET', `/containers/${encodeURIComponent(name)}/json`, null, { allow404 }); }
  async startContainer(name) { return this.request('POST', `/containers/${encodeURIComponent(name)}/start`); }
  async waitContainer(name) { return this.request('POST', `/containers/${encodeURIComponent(name)}/wait?condition=not-running`); }
  async stopContainer(name, seconds = 2, allow404 = true) { return this.request('POST', `/containers/${encodeURIComponent(name)}/stop?t=${seconds}`, null, { allow404 }); }
  async removeContainer(name, force = true, allow404 = true) { return this.request('DELETE', `/containers/${encodeURIComponent(name)}?force=${force ? 1 : 0}&v=0`, null, { allow404 }); }

  async exec(container, cmd, env = [], timeoutMs = 150_000) {
    const created = await this.request('POST', `/containers/${encodeURIComponent(container)}/exec`, {
      AttachStdout: true,
      AttachStderr: true,
      Tty: false,
      Cmd: cmd,
      Env: env,
    });
    const execId = created.data && created.data.Id;
    if (!execId) throw new Error('DOCKER_EXEC_ID_MISSING');
    const started = await this.request('POST', `/exec/${encodeURIComponent(execId)}/start`, { Detach: false, Tty: false }, { raw: true, timeoutMs });
    const streams = demultiplexDockerStream(started.data);
    const inspected = await this.request('GET', `/exec/${encodeURIComponent(execId)}/json`);
    return { ...streams, exitCode: inspected.data && inspected.data.ExitCode };
  }

  async putArchive(container, destination, tarBuffer) {
    return this.request('PUT', `/containers/${encodeURIComponent(container)}/archive?path=${encodeURIComponent(destination)}`, tarBuffer, { raw: true, timeoutMs: 60_000 });
  }

  async getArchive(container, sourcePath) {
    const result = await this.request('GET', `/containers/${encodeURIComponent(container)}/archive?path=${encodeURIComponent(sourcePath)}`, null, { raw: true, timeoutMs: 60_000 });
    return result.data;
  }
}

module.exports = { DockerApi, demultiplexDockerStream };
