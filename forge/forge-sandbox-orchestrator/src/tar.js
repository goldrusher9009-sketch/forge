'use strict';

const path = require('node:path');

function writeOctal(buffer, offset, length, value) {
  const encoded = Math.max(0, value).toString(8).padStart(length - 1, '0').slice(-(length - 1));
  buffer.write(encoded, offset, length - 1, 'ascii');
  buffer[offset + length - 1] = 0;
}

function singleFileTar(filename, content) {
  const safeName = path.posix.basename(filename);
  if (!safeName || Buffer.byteLength(safeName) > 100) throw new Error('TAR_FILENAME_INVALID');
  const body = Buffer.isBuffer(content) ? content : Buffer.from(content);
  const header = Buffer.alloc(512, 0);
  header.write(safeName, 0, 100, 'utf8');
  writeOctal(header, 100, 8, 0o644);
  writeOctal(header, 108, 8, 10001);
  writeOctal(header, 116, 8, 10001);
  writeOctal(header, 124, 12, body.length);
  writeOctal(header, 136, 12, Math.floor(Date.now() / 1000));
  header.fill(0x20, 148, 156);
  header[156] = '0'.charCodeAt(0);
  header.write('ustar\0', 257, 6, 'ascii');
  header.write('00', 263, 2, 'ascii');
  let checksum = 0;
  for (const byte of header) checksum += byte;
  const checksumText = checksum.toString(8).padStart(6, '0').slice(-6);
  header.write(checksumText, 148, 6, 'ascii');
  header[154] = 0;
  header[155] = 0x20;
  const padding = Buffer.alloc((512 - (body.length % 512)) % 512, 0);
  return Buffer.concat([header, body, padding, Buffer.alloc(1024, 0)]);
}

function firstFileFromTar(tarBuffer) {
  let offset = 0;
  while (offset + 512 <= tarBuffer.length) {
    const header = tarBuffer.subarray(offset, offset + 512);
    if (header.every(byte => byte === 0)) break;
    const name = header.subarray(0, 100).toString('utf8').replace(/\0.*$/, '');
    const sizeText = header.subarray(124, 136).toString('ascii').replace(/\0.*$/, '').trim();
    const size = parseInt(sizeText || '0', 8);
    const type = String.fromCharCode(header[156] || 48);
    const dataStart = offset + 512;
    if ((type === '0' || type === '\0') && size >= 0 && dataStart + size <= tarBuffer.length) {
      return { name, content: tarBuffer.subarray(dataStart, dataStart + size) };
    }
    offset = dataStart + Math.ceil(size / 512) * 512;
  }
  throw new Error('TAR_FILE_NOT_FOUND');
}

module.exports = { firstFileFromTar, singleFileTar };
