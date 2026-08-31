'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { CONTENT_POLICY_VERSION, inspectInboundWorkspaceFile } = require('../src/content-policy');

test('candidate content policy allows ordinary documents, archives, and source code', () => {
  for (const filename of ['report.pdf', 'sheet.xlsx', 'slides.pptx', 'document.docx', 'source.zip', 'tool.py', 'setup.sh']) {
    assert.deepEqual(inspectInboundWorkspaceFile(filename, Buffer.from('ordinary candidate content')), {
      allowed: true,
      policy: CONTENT_POLICY_VERSION,
      reason: null,
    });
  }
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
