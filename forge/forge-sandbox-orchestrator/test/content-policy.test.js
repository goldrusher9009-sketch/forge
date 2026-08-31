'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { CONTENT_POLICY_VERSION, inspectInboundWorkspaceFile } = require('../src/content-policy');

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeStoredZip(entries) {
  const localParts = [];
  const centralParts = [];
  let localOffset = 0;
  for (const entry of entries) {
    const filename = Buffer.from(entry.name, 'utf8');
    const localFilename = Buffer.from(entry.localName || entry.name, 'utf8');
    const data = Buffer.isBuffer(entry.content) ? entry.content : Buffer.from(entry.content || '');
    const flags = 0x0800 | (entry.encrypted ? 0x0001 : 0) | (entry.dataDescriptor ? 0x0008 : 0);
    const compressionMethod = entry.compressionMethod || 0;
    const compressedBytes = entry.compressedBytes ?? data.length;
    const uncompressedBytes = entry.uncompressedBytes ?? data.length;
    const checksum = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(flags, 6);
    local.writeUInt16LE(compressionMethod, 8);
    local.writeUInt32LE(entry.dataDescriptor ? 0 : checksum, 14);
    local.writeUInt32LE(entry.dataDescriptor ? 0 : compressedBytes, 18);
    local.writeUInt32LE(entry.dataDescriptor ? 0 : uncompressedBytes, 22);
    local.writeUInt16LE(localFilename.length, 26);
    localParts.push(local, localFilename, data);
    let descriptorLength = 0;
    if (entry.dataDescriptor) {
      const descriptor = Buffer.alloc(16);
      descriptor.writeUInt32LE(0x08074b50, 0);
      descriptor.writeUInt32LE(checksum, 4);
      descriptor.writeUInt32LE(compressedBytes, 8);
      descriptor.writeUInt32LE(uncompressedBytes, 12);
      localParts.push(descriptor);
      descriptorLength = descriptor.length;
    }

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(0x0314, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(flags, 8);
    central.writeUInt16LE(compressionMethod, 10);
    central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(compressedBytes, 20);
    central.writeUInt32LE(uncompressedBytes, 24);
    central.writeUInt16LE(filename.length, 28);
    central.writeUInt32LE(entry.externalAttributes || 0, 38);
    central.writeUInt32LE(localOffset, 42);
    centralParts.push(central, filename);
    localOffset += local.length + localFilename.length + data.length + descriptorLength;
  }

  const centralSize = centralParts.reduce((total, part) => total + part.length, 0);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralSize, 12);
  eocd.writeUInt32LE(localOffset, 16);
  return Buffer.concat([...localParts, ...centralParts, eocd]);
}

test('candidate content policy allows ordinary documents, archives, and source code', () => {
  for (const filename of ['report.pdf', 'tool.py', 'setup.sh']) {
    assert.deepEqual(inspectInboundWorkspaceFile(filename, Buffer.from('ordinary candidate content')), {
      allowed: true,
      policy: CONTENT_POLICY_VERSION,
      reason: null,
    });
  }
  const safeZip = makeStoredZip([
    { name: 'README.md', content: 'safe archive' },
    { name: 'src/index.js', content: 'console.log("safe")' },
  ]);
  for (const filename of ['sheet.xlsx', 'slides.pptx', 'document.docx', 'source.zip']) {
    assert.deepEqual(inspectInboundWorkspaceFile(filename, safeZip), {
      allowed: true,
      policy: CONTENT_POLICY_VERSION,
      reason: null,
    });
  }
  assert.equal(inspectInboundWorkspaceFile('streamed.zip', makeStoredZip([
    { name: 'streamed.txt', content: 'safe streamed archive', dataDescriptor: true },
  ])).allowed, true);
});

test('candidate content policy blocks executable and macro-enabled extensions case-insensitively', () => {
  for (const filename of ['invoice.pdf.EXE', 'installer.msi', 'report.docm', 'sheet.XLSM', 'application.apk', 'disk.iso']) {
    const result = inspectInboundWorkspaceFile(filename, Buffer.from('not executable by signature'));
    assert.equal(result.allowed, false, filename);
    assert.equal(result.reason, 'EXECUTABLE_OR_ACTIVE_CONTENT_EXTENSION', filename);
  }
});

test('candidate content policy blocks renamed native executables by signature', () => {
  const pe = Buffer.alloc(128);
  pe.write('MZ', 0, 'ascii');
  pe.writeUInt32LE(64, 0x3c);
  pe.write('PE\0\0', 64, 'binary');
  const samples = [
    Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0x02]),
    Buffer.from([0xca, 0xfe, 0xba, 0xbe, 0x00]),
    Buffer.from([0xfe, 0xed, 0xfa, 0xcf, 0x00]),
    Buffer.from('dex\n035\0payload', 'binary'),
    pe,
  ];
  for (const content of samples) {
    const result = inspectInboundWorkspaceFile('renamed-safe.txt', content);
    assert.equal(result.allowed, false);
    assert.equal(result.reason, 'EXECUTABLE_SIGNATURE');
  }
});

test('candidate content policy does not reject plain text that merely starts with MZ', () => {
  const result = inspectInboundWorkspaceFile('notes.txt', Buffer.from('MZ is a timezone abbreviation in this note.'));
  assert.equal(result.allowed, true);
});

test('candidate content policy rejects malformed, encrypted, and unsupported archives', () => {
  assert.equal(inspectInboundWorkspaceFile('broken.zip', Buffer.from('not a zip')).reason, 'ARCHIVE_INVALID');
  assert.equal(inspectInboundWorkspaceFile('encrypted.zip', makeStoredZip([
    { name: 'secret.txt', content: 'opaque', encrypted: true },
  ])).reason, 'ARCHIVE_ENCRYPTED');
  assert.equal(inspectInboundWorkspaceFile('opaque.7z', Buffer.from('opaque archive')).reason, 'ARCHIVE_FORMAT_UNSUPPORTED');
});

test('candidate content policy rejects unsafe and uninspectable nested archive entries', () => {
  assert.equal(inspectInboundWorkspaceFile('traversal.zip', makeStoredZip([
    { name: '../escape.txt', content: 'escape' },
  ])).reason, 'ARCHIVE_PATH_UNSAFE');
  assert.equal(inspectInboundWorkspaceFile('mismatched-path.zip', makeStoredZip([
    { name: 'safe.txt', localName: '../escape.txt', content: 'escape' },
  ])).reason, 'ARCHIVE_PATH_UNSAFE');
  assert.equal(inspectInboundWorkspaceFile('symlink.zip', makeStoredZip([
    { name: 'safe-link', content: 'target', externalAttributes: ((0xa000 | 0o777) << 16) >>> 0 },
  ])).reason, 'ARCHIVE_PATH_UNSAFE');
  assert.equal(inspectInboundWorkspaceFile('nested.zip', makeStoredZip([
    { name: 'payloads/installer.pdf.exe', content: 'renamed executable' },
  ])).reason, 'ARCHIVE_NESTED_BLOCKED_CONTENT');
  assert.equal(inspectInboundWorkspaceFile('nested-archive.zip', makeStoredZip([
    { name: 'payloads/opaque.zip', content: 'nested archive' },
  ])).reason, 'ARCHIVE_NESTED_ARCHIVE_UNINSPECTED');
});

test('candidate content policy rejects active Office internals and zip-bomb metadata', () => {
  assert.equal(inspectInboundWorkspaceFile('renamed-safe.docx', makeStoredZip([
    { name: 'word/vbaProject.bin', content: 'macro project' },
  ])).reason, 'ARCHIVE_ACTIVE_OFFICE_CONTENT');
  assert.equal(inspectInboundWorkspaceFile('bomb.zip', makeStoredZip([
    { name: 'huge.txt', content: 'x', compressionMethod: 8, compressedBytes: 1, uncompressedBytes: 256 * 1024 * 1024 },
  ])).reason, 'ARCHIVE_LIMIT_EXCEEDED');
});

test('candidate content policy never throws on bounded malformed archive bytes', () => {
  let state = 0x5eed1234;
  for (let length = 0; length <= 1024; length += 17) {
    const content = Buffer.alloc(length);
    for (let index = 0; index < content.length; index += 1) {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      content[index] = state & 0xff;
    }
    assert.doesNotThrow(() => inspectInboundWorkspaceFile('untrusted.zip', content));
  }
  const forgedEocd = Buffer.alloc(64);
  forgedEocd.writeUInt32LE(0x06054b50, 42);
  forgedEocd.writeUInt16LE(1, 50);
  forgedEocd.writeUInt16LE(1, 52);
  forgedEocd.writeUInt32LE(0xffffffff, 54);
  assert.doesNotThrow(() => inspectInboundWorkspaceFile('forged.zip', forgedEocd));
  assert.equal(inspectInboundWorkspaceFile('forged.zip', forgedEocd).allowed, false);
});
