'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { isBlockedIp, signature, verifySignedRequest } = require('../src/security');
const { demultiplexDockerStream } = require('../src/docker-api');
const { firstFileFromTar, singleFileTar } = require('../src/tar');

test('HMAC contract accepts one request and rejects replay', () => {
  const secret = 'test-secret-with-enough-entropy';
  const rawBody = Buffer.from('{"runId":"run_12345678"}');
  const timestamp = String(Date.now());
  const nonce = 'nonce_1234567890123456';
  const headers = {
    'x-forge-timestamp': timestamp,
    'x-forge-nonce': nonce,
    'x-forge-signature': signature(secret, 'POST', '/v1/tools/execute', timestamp, nonce, rawBody),
  };
  const nonces = new Map();
  verifySignedRequest({ secret, method: 'POST', requestPath: '/v1/tools/execute', headers, rawBody, nonces });
  assert.throws(() => verifySignedRequest({ secret, method: 'POST', requestPath: '/v1/tools/execute', headers, rawBody, nonces }), /REPLAYED/);
});

test('private, loopback, metadata, and mapped private addresses are blocked', () => {
  for (const value of ['127.0.0.1', '10.1.2.3', '172.16.0.1', '192.168.1.1', '169.254.169.254', '100.64.0.1', '::1', 'fd00::1', '::ffff:127.0.0.1']) {
    assert.equal(isBlockedIp(value), true, value);
  }
  assert.equal(isBlockedIp('1.1.1.1'), false);
  assert.equal(isBlockedIp('2606:4700:4700::1111'), false);
});

test('single-file tar round-trips binary content', () => {
  const original = Buffer.from([0, 1, 2, 3, 255, 10, 13]);
  const extracted = firstFileFromTar(singleFileTar('input.bin', original));
  assert.equal(extracted.name, 'input.bin');
  assert.deepEqual(extracted.content, original);
});

test('Docker multiplex framing separates stdout and stderr', () => {
  const frame = (stream, value) => {
    const body = Buffer.from(value);
    const header = Buffer.alloc(8);
    header[0] = stream;
    header.writeUInt32BE(body.length, 4);
    return Buffer.concat([header, body]);
  };
  const output = demultiplexDockerStream(Buffer.concat([frame(1, 'ok'), frame(2, 'warn')]));
  assert.equal(output.stdout, 'ok');
  assert.equal(output.stderr, 'warn');
});
