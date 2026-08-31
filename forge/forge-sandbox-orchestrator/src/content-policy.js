'use strict';

const path = require('node:path');

const CONTENT_POLICY_VERSION = 'forge-inbound-v1';
const BLOCKED_EXTENSIONS = new Set([
  '.apk', '.app', '.appimage', '.cab', '.chm', '.class', '.com', '.cpl', '.deb', '.dex', '.dll',
  '.dmg', '.docm', '.dotm', '.exe', '.hta', '.img', '.ipa', '.iso', '.jar', '.msi', '.msix', '.msp',
  '.ocx', '.pkg', '.potm', '.ppam', '.ppsm', '.pptm', '.reg', '.rpm', '.scr', '.sldm', '.sys', '.vhd',
  '.vhdx', '.war', '.xlam', '.xlsb', '.xlsm', '.xltm',
]);
const MACH_O_MAGICS = new Set(['bebafeca', 'bfbafeca', 'cafebabf', 'cefaedfe', 'cffaedfe', 'feedface', 'feedfacf']);

function executableSignature(content) {
  if (!Buffer.isBuffer(content) || content.length < 4) return null;
  const firstFour = content.subarray(0, 4).toString('hex');
  if (firstFour === '7f454c46') return 'ELF';
  if (firstFour === 'cafebabe') return 'JAVA_CLASS_OR_MACH_UNIVERSAL';
  if (MACH_O_MAGICS.has(firstFour)) return 'MACH_O';
  if (content.subarray(0, 4).toString('ascii') === 'dex\n') return 'ANDROID_DEX';
  if (content.length >= 64 && content[0] === 0x4d && content[1] === 0x5a) {
    const peOffset = content.readUInt32LE(0x3c);
    if (peOffset >= 64 && peOffset + 4 <= content.length && content.subarray(peOffset, peOffset + 4).equals(Buffer.from('PE\0\0'))) return 'WINDOWS_PE';
  }
  return null;
}

function inspectInboundWorkspaceFile(relativePath, content) {
  const extension = path.posix.extname(String(relativePath || '')).toLowerCase();
  if (BLOCKED_EXTENSIONS.has(extension)) {
    return { allowed: false, policy: CONTENT_POLICY_VERSION, reason: 'EXECUTABLE_OR_ACTIVE_CONTENT_EXTENSION' };
  }
  if (executableSignature(content)) {
    return { allowed: false, policy: CONTENT_POLICY_VERSION, reason: 'EXECUTABLE_SIGNATURE' };
  }
  return { allowed: true, policy: CONTENT_POLICY_VERSION, reason: null };
}

module.exports = { CONTENT_POLICY_VERSION, inspectInboundWorkspaceFile };
