#!/usr/bin/env python3
"""
Fix double-encoded UTF-8 (mojibake) in ForgeApp.tsx.
The file's emoji were stored as cp1252-decoded UTF-8 bytes, then re-encoded as UTF-8.
Fix: read as UTF-8, encode each char back to cp1252 (single byte), collect raw bytes, decode as UTF-8.
"""
import sys

filepath = r"C:\Users\teste\OneDrive\Documents\Claude\Projects\forge\forge-web-studio\app\components\ForgeApp.tsx"

with open(filepath, 'rb') as f:
    raw = f.read()

# Strip BOM if present
if raw[:3] == b'\xef\xbb\xbf':
    raw = raw[3:]

# Decode as UTF-8 to get the mojibake string
text = raw.decode('utf-8')

# Reverse the double-encoding: encode each char back to cp1252 bytes (the original UTF-8 bytes)
result_bytes = bytearray()
for c in text:
    try:
        result_bytes.extend(c.encode('cp1252'))
    except (UnicodeEncodeError, LookupError):
        # Char not in cp1252 — keep as UTF-8 (it was already correct)
        result_bytes.extend(c.encode('utf-8'))

# Decode the recovered bytes as UTF-8 to get proper text
fixed = result_bytes.decode('utf-8', errors='replace')

# Verify key strings look right
checks = [
    ("AGENT_ICONS has proper emoji", "['🧠','⚡'" in fixed),
    ("No mojibake ðŸ", "ðŸ" not in fixed),
    ("No mojibake âš", "âš¡" not in fixed),
]
all_ok = True
for label, ok in checks:
    print(f"{'✓' if ok else '✗'} {label}")
    if not ok:
        all_ok = False

print(f"\nLines: {fixed.count(chr(10))}")
print(f"Chars: {len(fixed)}")

if not all_ok:
    print("ERROR: Fix did not work correctly, aborting.")
    sys.exit(1)

# Write back as UTF-8 without BOM
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(fixed)

print("\nFile written successfully.")
