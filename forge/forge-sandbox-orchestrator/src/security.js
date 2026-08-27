'use strict';

const crypto = require('node:crypto');
const dns = require('node:dns').promises;
const net = require('node:net');

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function signature(secret, method, requestPath, timestamp, nonce, rawBody) {
  const canonical = [method.toUpperCase(), requestPath, timestamp, nonce, sha256(rawBody)].join('\n');
  return crypto.createHmac('sha256', secret).update(canonical).digest('hex');
}

function safeEqualHex(left, right) {
  if (!/^[a-f0-9]{64}$/i.test(left || '') || !/^[a-f0-9]{64}$/i.test(right || '')) return false;
  return crypto.timingSafeEqual(Buffer.from(left, 'hex'), Buffer.from(right, 'hex'));
}

function verifySignedRequest({ secret, method, requestPath, headers, rawBody, nonces, now = Date.now() }) {
  if (!secret) throw new Error('FORGE_SANDBOX_HMAC_SECRET_REQUIRED');
  const timestamp = String(headers['x-forge-timestamp'] || '');
  const nonce = String(headers['x-forge-nonce'] || '');
  const provided = String(headers['x-forge-signature'] || '');
  if (!/^\d{13}$/.test(timestamp) || !/^[A-Za-z0-9_-]{16,128}$/.test(nonce)) throw new Error('SANDBOX_SIGNATURE_HEADERS_INVALID');
  if (Math.abs(now - Number(timestamp)) > 60_000) throw new Error('SANDBOX_SIGNATURE_EXPIRED');
  if (nonces.has(nonce)) throw new Error('SANDBOX_SIGNATURE_REPLAYED');
  const expected = signature(secret, method, requestPath, timestamp, nonce, rawBody);
  if (!safeEqualHex(provided, expected)) throw new Error('SANDBOX_SIGNATURE_INVALID');
  nonces.set(nonce, now + 120_000);
}

function pruneNonces(nonces, now = Date.now()) {
  for (const [nonce, expiresAt] of nonces) if (expiresAt <= now) nonces.delete(nonce);
}

function isBlockedIp(address) {
  if (!net.isIP(address)) return true;
  const lower = address.toLowerCase();
  if (lower === '::' || lower === '::1') return true;
  if (lower.startsWith('fc') || lower.startsWith('fd') || lower.startsWith('fe8') || lower.startsWith('fe9') || lower.startsWith('fea') || lower.startsWith('feb')) return true;
  if (lower.startsWith('ff')) return true;
  if (lower.startsWith('::ffff:')) return isBlockedIp(lower.slice(7));
  if (net.isIPv6(address)) return false;
  const octets = address.split('.').map(Number);
  const [a, b] = octets;
  return a === 0 || a === 10 || a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224;
}

function hostnameAllowed(hostname, allowlist) {
  if (!allowlist.length) return true;
  const value = hostname.toLowerCase();
  return allowlist.some(entry => value === entry || value.endsWith(`.${entry}`));
}

async function resolvePublicTarget(hostname, allowlist = []) {
  const value = String(hostname || '').replace(/^\[|\]$/g, '').trim().toLowerCase();
  if (!value || value === 'localhost' || value.endsWith('.localhost') || value.endsWith('.local') || value.endsWith('.internal') || value === 'metadata.google.internal') {
    throw new Error('SANDBOX_EGRESS_HOST_REJECTED');
  }
  if (!hostnameAllowed(value, allowlist)) throw new Error('SANDBOX_EGRESS_NOT_ALLOWLISTED');
  if (net.isIP(value)) {
    if (isBlockedIp(value)) throw new Error('SANDBOX_EGRESS_PRIVATE_IP_REJECTED');
    return value;
  }
  const answers = await dns.lookup(value, { all: true, verbatim: true });
  if (!answers.length || answers.some(answer => isBlockedIp(answer.address))) throw new Error('SANDBOX_EGRESS_PRIVATE_IP_REJECTED');
  return answers[0].address;
}

module.exports = { isBlockedIp, pruneNonces, resolvePublicTarget, sha256, signature, verifySignedRequest };
