'use strict';

const path = require('node:path');

const CONTENT_POLICY_VERSION = 'forge-inbound-v2';
const BLOCKED_EXTENSIONS = new Set([
  '.apk', '.app', '.appimage', '.cab', '.chm', '.class', '.com', '.cpl', '.deb', '.dex', '.dll',
  '.dmg', '.docm', '.dotm', '.exe', '.hta', '.img', '.ipa', '.iso', '.jar', '.msi', '.msix', '.msp',
  '.ocx', '.pkg', '.potm', '.ppam', '.ppsm', '.pptm', '.reg', '.rpm', '.scr', '.sldm', '.sys', '.vhd',
  '.vhdx', '.war', '.xlam', '.xlsb', '.xlsm', '.xltm',
]);
const ZIP_CONTAINER_EXTENSIONS = new Set([
  '.docx', '.dotx', '.epub', '.odp', '.ods', '.odt', '.potx', '.ppsx', '.pptx', '.vsdx', '.xltx', '.xlsx', '.zip',
]);
const OPAQUE_ARCHIVE_EXTENSIONS = new Set([
  '.7z', '.bz2', '.gz', '.lz', '.lzma', '.rar', '.tar', '.tgz', '.txz', '.xz', '.zst',
]);
const NESTED_ARCHIVE_EXTENSIONS = new Set([...ZIP_CONTAINER_EXTENSIONS, ...OPAQUE_ARCHIVE_EXTENSIONS]);
const MACH_O_MAGICS = new Set(['bebafeca', 'bfbafeca', 'cafebabf', 'cefaedfe', 'cffaedfe', 'feedface', 'feedfacf']);
const ZIP_EOCD_SIGNATURE = 0x06054b50;
const ZIP_CENTRAL_SIGNATURE = 0x02014b50;
const ZIP_MAX_ENTRIES = 2048;
const ZIP_MAX_UNCOMPRESSED_BYTES = 128 * 1024 * 1024;
const ZIP_RATIO_MIN_BYTES = 1024 * 1024;
const ZIP_MAX_COMPRESSION_RATIO = 200;

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

function blocked(reason) {
  return { allowed: false, policy: CONTENT_POLICY_VERSION, reason };
}

function findZipEndOfCentralDirectory(content) {
  const minimumOffset = Math.max(0, content.length - 65_557);
  for (let offset = content.length - 22; offset >= minimumOffset; offset -= 1) {
    if (content.readUInt32LE(offset) === ZIP_EOCD_SIGNATURE) return offset;
  }
  return -1;
}

function inspectZipContainer(content) {
  if (!Buffer.isBuffer(content) || content.length < 22) return blocked('ARCHIVE_INVALID');
  const eocdOffset = findZipEndOfCentralDirectory(content);
  if (eocdOffset < 0 || eocdOffset + 22 > content.length) return blocked('ARCHIVE_INVALID');

  const diskNumber = content.readUInt16LE(eocdOffset + 4);
  const centralDisk = content.readUInt16LE(eocdOffset + 6);
  const entriesOnDisk = content.readUInt16LE(eocdOffset + 8);
  const entryCount = content.readUInt16LE(eocdOffset + 10);
  const centralSize = content.readUInt32LE(eocdOffset + 12);
  const centralOffset = content.readUInt32LE(eocdOffset + 16);
  const commentLength = content.readUInt16LE(eocdOffset + 20);

  if (diskNumber !== 0 || centralDisk !== 0 || entriesOnDisk !== entryCount) return blocked('ARCHIVE_MULTIPART_UNSUPPORTED');
  if (entryCount > ZIP_MAX_ENTRIES) return blocked('ARCHIVE_LIMIT_EXCEEDED');
  if (eocdOffset + 22 + commentLength !== content.length) return blocked('ARCHIVE_INVALID');
  if (centralOffset + centralSize !== eocdOffset || centralOffset + centralSize > content.length) return blocked('ARCHIVE_INVALID');

  let offset = centralOffset;
  let totalUncompressed = 0;
  const localHeaderOffsets = new Set();
  const localRanges = [];
  for (let index = 0; index < entryCount; index += 1) {
    if (offset + 46 > content.length || content.readUInt32LE(offset) !== ZIP_CENTRAL_SIGNATURE) return blocked('ARCHIVE_INVALID');
    const flags = content.readUInt16LE(offset + 8);
    const compressionMethod = content.readUInt16LE(offset + 10);
    const checksum = content.readUInt32LE(offset + 16);
    const compressedBytes = content.readUInt32LE(offset + 20);
    const uncompressedBytes = content.readUInt32LE(offset + 24);
    const filenameLength = content.readUInt16LE(offset + 28);
    const extraLength = content.readUInt16LE(offset + 30);
    const entryCommentLength = content.readUInt16LE(offset + 32);
    const startDisk = content.readUInt16LE(offset + 34);
    const externalAttributes = content.readUInt32LE(offset + 38);
    const localHeaderOffset = content.readUInt32LE(offset + 42);
    const entryEnd = offset + 46 + filenameLength + extraLength + entryCommentLength;

    if (entryEnd > content.length || startDisk !== 0) return blocked('ARCHIVE_INVALID');
    if (compressedBytes === 0xffffffff || uncompressedBytes === 0xffffffff) return blocked('ARCHIVE_ZIP64_UNSUPPORTED');
    if ((flags & 0x0001) !== 0) return blocked('ARCHIVE_ENCRYPTED');
    if (![0, 8].includes(compressionMethod)) return blocked('ARCHIVE_COMPRESSION_UNSUPPORTED');

    totalUncompressed += uncompressedBytes;
    if (totalUncompressed > ZIP_MAX_UNCOMPRESSED_BYTES) return blocked('ARCHIVE_LIMIT_EXCEEDED');
    if (uncompressedBytes > 0 && compressedBytes === 0) return blocked('ARCHIVE_LIMIT_EXCEEDED');
    if (uncompressedBytes >= ZIP_RATIO_MIN_BYTES && uncompressedBytes / compressedBytes > ZIP_MAX_COMPRESSION_RATIO) {
      return blocked('ARCHIVE_LIMIT_EXCEEDED');
    }

    const filenameBytes = content.subarray(offset + 46, offset + 46 + filenameLength);
    const filename = filenameBytes.toString((flags & 0x0800) !== 0 ? 'utf8' : 'latin1');
    const normalized = filename.replace(/\\/g, '/');
    const segments = normalized.split('/');
    const unixMode = externalAttributes >>> 16;
    if (localHeaderOffsets.has(localHeaderOffset) || localHeaderOffset + 30 > centralOffset || content.readUInt32LE(localHeaderOffset) !== 0x04034b50) {
      return blocked('ARCHIVE_INVALID');
    }
    localHeaderOffsets.add(localHeaderOffset);
    const localFlags = content.readUInt16LE(localHeaderOffset + 6);
    const localCompressionMethod = content.readUInt16LE(localHeaderOffset + 8);
    const localChecksum = content.readUInt32LE(localHeaderOffset + 14);
    const localCompressedBytes = content.readUInt32LE(localHeaderOffset + 18);
    const localUncompressedBytes = content.readUInt32LE(localHeaderOffset + 22);
    const localFilenameLength = content.readUInt16LE(localHeaderOffset + 26);
    const localExtraLength = content.readUInt16LE(localHeaderOffset + 28);
    const localFilenameStart = localHeaderOffset + 30;
    const localDataStart = localFilenameStart + localFilenameLength + localExtraLength;
    const localDataEnd = localDataStart + compressedBytes;
    if (localDataEnd > centralOffset || localFlags !== flags || localCompressionMethod !== compressionMethod) {
      return blocked('ARCHIVE_INVALID');
    }
    let localEntryEnd = localDataEnd;
    if ((flags & 0x0008) === 0) {
      if (localChecksum !== checksum || localCompressedBytes !== compressedBytes || localUncompressedBytes !== uncompressedBytes) {
        return blocked('ARCHIVE_INVALID');
      }
    } else {
      const signedDescriptor = localDataEnd + 16 <= centralOffset && content.readUInt32LE(localDataEnd) === 0x08074b50;
      const descriptorStart = localDataEnd + (signedDescriptor ? 4 : 0);
      localEntryEnd = descriptorStart + 12;
      if (localEntryEnd > centralOffset
        || content.readUInt32LE(descriptorStart) !== checksum
        || content.readUInt32LE(descriptorStart + 4) !== compressedBytes
        || content.readUInt32LE(descriptorStart + 8) !== uncompressedBytes) {
        return blocked('ARCHIVE_INVALID');
      }
    }
    if (!content.subarray(localFilenameStart, localFilenameStart + localFilenameLength).equals(filenameBytes)) {
      return blocked('ARCHIVE_PATH_UNSAFE');
    }
    localRanges.push({ start: localHeaderOffset, end: localEntryEnd });
    if (!normalized || normalized.includes('\0') || normalized.startsWith('/') || /^[A-Za-z]:\//.test(normalized) || segments.includes('..')) {
      return blocked('ARCHIVE_PATH_UNSAFE');
    }
    if ((unixMode & 0xf000) === 0xa000) return blocked('ARCHIVE_PATH_UNSAFE');

    if (!normalized.endsWith('/')) {
      const lower = normalized.toLowerCase();
      const extension = path.posix.extname(lower);
      if (BLOCKED_EXTENSIONS.has(extension)) return blocked('ARCHIVE_NESTED_BLOCKED_CONTENT');
      if (NESTED_ARCHIVE_EXTENSIONS.has(extension)) return blocked('ARCHIVE_NESTED_ARCHIVE_UNINSPECTED');
      if (/(^|\/)vbaproject\.bin$/.test(lower) || lower.includes('/activex/') || lower.includes('/embeddings/')) {
        return blocked('ARCHIVE_ACTIVE_OFFICE_CONTENT');
      }
    }
    offset = entryEnd;
  }

  if (offset !== centralOffset + centralSize) return blocked('ARCHIVE_INVALID');
  localRanges.sort((left, right) => left.start - right.start);
  let localCursor = 0;
  for (const range of localRanges) {
    if (range.start !== localCursor || range.end < range.start) return blocked('ARCHIVE_INVALID');
    localCursor = range.end;
  }
  if (localCursor !== centralOffset) return blocked('ARCHIVE_INVALID');
  return { allowed: true, policy: CONTENT_POLICY_VERSION, reason: null };
}

function inspectInboundWorkspaceFile(relativePath, content) {
  const extension = path.posix.extname(String(relativePath || '')).toLowerCase();
  if (BLOCKED_EXTENSIONS.has(extension)) {
    return blocked('EXECUTABLE_OR_ACTIVE_CONTENT_EXTENSION');
  }
  if (executableSignature(content)) {
    return blocked('EXECUTABLE_SIGNATURE');
  }
  if (OPAQUE_ARCHIVE_EXTENSIONS.has(extension)) return blocked('ARCHIVE_FORMAT_UNSUPPORTED');
  const startsLikeZip = Buffer.isBuffer(content) && content.length >= 4 && content[0] === 0x50 && content[1] === 0x4b;
  if (ZIP_CONTAINER_EXTENSIONS.has(extension) || startsLikeZip) return inspectZipContainer(content);
  return { allowed: true, policy: CONTENT_POLICY_VERSION, reason: null };
}

module.exports = { CONTENT_POLICY_VERSION, inspectInboundWorkspaceFile };
