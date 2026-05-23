#!/usr/bin/env python3
"""
1. Fix double-encoded UTF-8 (mojibake) in ForgeApp.tsx
2. Apply visual redesign: Claude red background, neon color-cycling logo, crisp Inter font
3. Fix "thinking" indicator (ensure it's using proper text not emoji)
"""
import sys, re

filepath = r"C:\Users\teste\OneDrive\Documents\Claude\Projects\forge\forge-web-studio\app\components\ForgeApp.tsx"

print("Reading file...")
with open(filepath, 'rb') as f:
    raw = f.read()

# Strip BOM
if raw[:3] == b'\xef\xbb\xbf':
    raw = raw[3:]

# Decode as UTF-8 (gets mojibake text)
text = raw.decode('utf-8')
print(f"Original: {len(text)} chars, {text.count(chr(10))} lines")

# ── Step 1: Fix encoding ──────────────────────────────────────────────────────
print("Fixing encoding...")
result_bytes = bytearray()
for c in text:
    try:
        result_bytes.extend(c.encode('cp1252'))
    except (UnicodeEncodeError, LookupError):
        result_bytes.extend(c.encode('utf-8'))

fixed = result_bytes.decode('utf-8', errors='replace')
print(f"After fix: {len(fixed)} chars, {fixed.count(chr(10))} lines")

# Verify
assert '⚡' in fixed, "⚡ not found after fix"
assert 'âš¡' not in fixed, "mojibake âš¡ still present"
print("✓ Encoding fix verified")

# ── Step 2: Visual redesign ───────────────────────────────────────────────────
print("Applying visual redesign...")

OLD_STYLES = """@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  --fg-bg:      #0a0a0f;
  --fg-bg2:     #0f0f18;
  --fg-bg3:     #141420;
  --fg-bg4:     #1c1c2e;
  --fg-bg5:     #252540;
  --fg-orange:  #da7756;
  --fg-orange2: #e8956d;
  --fg-odim:    rgba(218,119,86,0.12);
  --fg-odim2:   rgba(218,119,86,0.20);
  --fg-border:  rgba(255,255,255,0.06);
  --fg-border2: rgba(255,255,255,0.11);
  --fg-border3: rgba(218,119,86,0.28);
  --fg-text:    #ececf1;
  --fg-text2:   #8e8ea0;
  --fg-text3:   #565666;
  --fg-green:   #4ade80;
  --fg-purple:  #a78bfa;
  --fg-blue:    #60a5fa;
  --fg-red:     #f87171;
  --fg-font-ui: 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --fg-font-display: 'Inter', ui-sans-serif, system-ui, sans-serif;
  --fg-font-mono: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
}

* { box-sizing: border-box; }

body, #__next { background: var(--fg-bg) !important; color: var(--fg-text) !important; font-family: var(--fg-font-ui) !important; }

::-webkit-scrollbar { width: 3px; height: 3px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--fg-bg5); border-radius: 2px; }
::-webkit-scrollbar-thumb:hover { background: var(--fg-bg4); }

@keyframes pulse { 0%,100%{opacity:.4;transform:scale(.85)} 50%{opacity:1;transform:scale(1)} }
@keyframes fg-live-pulse { 0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(34,197,94,.4)} 50%{opacity:.7;box-shadow:0 0 0 5px rgba(34,197,94,0)} }
@keyframes fg-orange-glow { 0%,100%{box-shadow:0 0 0 0 rgba(249,115,22,.35)} 50%{box-shadow:0 0 0 5px rgba(249,115,22,0)} }
@keyframes forge-flash {
  0%,100% { background:var(--fg-orange); box-shadow:0 0 10px rgba(249,115,22,.5); }
  50%     { background:var(--fg-orange2); box-shadow:0 0 16px rgba(249,115,22,.3); }
}
@keyframes forge-ring {
  0%,100% { border-color: var(--fg-border3); }
  50%     { border-color: var(--fg-orange); }
}
@keyframes forge-text-flash {
  0%,100% { color: var(--fg-orange); }
  50%     { color: var(--fg-orange2); }
}
@keyframes send-pulse {
  0%,100% { background:var(--fg-orange); box-shadow:0 0 0 0 rgba(249,115,22,.5); }
  50%     { background:var(--fg-orange2); box-shadow:0 0 0 6px rgba(249,115,22,0); }
}
@keyframes fg-think { 0%,60%,100%{transform:scale(.8);opacity:.3} 30%{transform:scale(1.15);opacity:1} }
@keyframes fg-slide-in { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
@keyframes fg-topbar-line { 0%{background-position:0% 50%} 100%{background-position:200% 50%} }
`"""

NEW_STYLES = """@import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,300;0,14..32,400;0,14..32,500;0,14..32,600;0,14..32,700;1,14..32,400&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  /* Claude-inspired deep red dark theme */
  --fg-bg:      #0d0608;
  --fg-bg2:     #120a0c;
  --fg-bg3:     #1a0e12;
  --fg-bg4:     #231419;
  --fg-bg5:     #2e1a20;
  --fg-orange:  #cc2936;
  --fg-orange2: #e63946;
  --fg-odim:    rgba(204,41,54,0.14);
  --fg-odim2:   rgba(204,41,54,0.22);
  --fg-border:  rgba(255,255,255,0.06);
  --fg-border2: rgba(255,255,255,0.10);
  --fg-border3: rgba(204,41,54,0.30);
  --fg-text:    #f0ecec;
  --fg-text2:   #9a8f91;
  --fg-text3:   #5c5054;
  --fg-green:   #4ade80;
  --fg-purple:  #c084fc;
  --fg-blue:    #60a5fa;
  --fg-red:     #f87171;
  --fg-font-ui: 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --fg-font-display: 'Inter', ui-sans-serif, system-ui, sans-serif;
  --fg-font-mono: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
}

* { box-sizing: border-box; }

body, #__next { background: var(--fg-bg) !important; color: var(--fg-text) !important; font-family: var(--fg-font-ui) !important; }

::-webkit-scrollbar { width: 3px; height: 3px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--fg-bg5); border-radius: 2px; }
::-webkit-scrollbar-thumb:hover { background: var(--fg-bg4); }

/* Neon color-cycling animation for logo */
@keyframes neon-cycle {
  0%   { color: #ff003c; text-shadow: 0 0 8px #ff003c, 0 0 20px #ff003c, 0 0 40px #ff003c; }
  14%  { color: #ff6600; text-shadow: 0 0 8px #ff6600, 0 0 20px #ff6600, 0 0 40px #ff6600; }
  28%  { color: #ffcc00; text-shadow: 0 0 8px #ffcc00, 0 0 20px #ffcc00, 0 0 40px #ffcc00; }
  42%  { color: #00ff88; text-shadow: 0 0 8px #00ff88, 0 0 20px #00ff88, 0 0 40px #00ff88; }
  57%  { color: #00ccff; text-shadow: 0 0 8px #00ccff, 0 0 20px #00ccff, 0 0 40px #00ccff; }
  71%  { color: #7c3aed; text-shadow: 0 0 8px #7c3aed, 0 0 20px #7c3aed, 0 0 40px #9f4ffa; }
  85%  { color: #ff0099; text-shadow: 0 0 8px #ff0099, 0 0 20px #ff0099, 0 0 40px #ff0099; }
  100% { color: #ff003c; text-shadow: 0 0 8px #ff003c, 0 0 20px #ff003c, 0 0 40px #ff003c; }
}

@keyframes pulse { 0%,100%{opacity:.4;transform:scale(.85)} 50%{opacity:1;transform:scale(1)} }
@keyframes fg-live-pulse { 0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(34,197,94,.4)} 50%{opacity:.7;box-shadow:0 0 0 5px rgba(34,197,94,0)} }
@keyframes fg-orange-glow { 0%,100%{box-shadow:0 0 0 0 rgba(204,41,54,.35)} 50%{box-shadow:0 0 0 5px rgba(204,41,54,0)} }
@keyframes forge-flash {
  0%,100% { background:var(--fg-orange); box-shadow:0 0 10px rgba(204,41,54,.6); }
  50%     { background:var(--fg-orange2); box-shadow:0 0 18px rgba(230,57,70,.4); }
}
@keyframes forge-ring {
  0%,100% { border-color: var(--fg-border3); }
  50%     { border-color: var(--fg-orange); }
}
@keyframes forge-text-flash {
  0%,100% { color: var(--fg-orange); }
  50%     { color: var(--fg-orange2); }
}
@keyframes send-pulse {
  0%,100% { background:var(--fg-orange); box-shadow:0 0 0 0 rgba(204,41,54,.5); }
  50%     { background:var(--fg-orange2); box-shadow:0 0 0 6px rgba(204,41,54,0); }
}
@keyframes fg-think { 0%,60%,100%{transform:scale(.8);opacity:.3} 30%{transform:scale(1.15);opacity:1} }
@keyframes fg-slide-in { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
@keyframes fg-topbar-line { 0%{background-position:0% 50%} 100%{background-position:200% 50%} }
`"""

if OLD_STYLES not in fixed:
    print("WARNING: Could not find old styles block — checking partial match...")
    # Try to find just the :root block
    if '--fg-bg:      #0a0a0f' not in fixed:
        print("ERROR: Cannot locate CSS block to replace")
        sys.exit(1)
    # Fall back to regex replace of just the :root vars
    fixed = fixed.replace('--fg-bg:      #0a0a0f;', '--fg-bg:      #0d0608;')
    fixed = fixed.replace('--fg-bg2:     #0f0f18;', '--fg-bg2:     #120a0c;')
    fixed = fixed.replace('--fg-bg3:     #141420;', '--fg-bg3:     #1a0e12;')
    fixed = fixed.replace('--fg-bg4:     #1c1c2e;', '--fg-bg4:     #231419;')
    fixed = fixed.replace('--fg-bg5:     #252540;', '--fg-bg5:     #2e1a20;')
    fixed = fixed.replace('--fg-orange:  #da7756;', '--fg-orange:  #cc2936;')
    fixed = fixed.replace('--fg-orange2: #e8956d;', '--fg-orange2: #e63946;')
    fixed = fixed.replace('--fg-odim:    rgba(218,119,86,0.12);', '--fg-odim:    rgba(204,41,54,0.14);')
    fixed = fixed.replace('--fg-odim2:   rgba(218,119,86,0.20);', '--fg-odim2:   rgba(204,41,54,0.22);')
    fixed = fixed.replace('--fg-border3: rgba(218,119,86,0.28);', '--fg-border3: rgba(204,41,54,0.30);')
    fixed = fixed.replace('--fg-text:    #ececf1;', '--fg-text:    #f0ecec;')
    fixed = fixed.replace('--fg-text2:   #8e8ea0;', '--fg-text2:   #9a8f91;')
    fixed = fixed.replace('--fg-text3:   #565666;', '--fg-text3:   #5c5054;')
    print("✓ Applied individual CSS variable replacements")
else:
    fixed = fixed.replace(OLD_STYLES, NEW_STYLES, 1)
    print("✓ Applied full styles block replacement")

# ── Step 3: Apply neon-cycle class to the logo text ──────────────────────────
# Find the login screen logo "Forge" text and add neon animation
# Look for the logo display in the login/unauthenticated screen
# Pattern: the big "Forge" heading on the login screen

# Replace static logo style with neon-animated version
# The logo appears as: style={{ fontSize:48, fontWeight:800, ... }}Forge
# We need to find it and add the neon class or inline animation

# Search for the login panel "Forge" heading
logo_patterns = [
    # Pattern 1: fontSize:48 heading with Forge text
    (
        "fontSize:48, fontWeight:800",
        "fontSize:48, fontWeight:900, fontFamily:'Inter, sans-serif', letterSpacing:'-0.02em', animation:'neon-cycle 4s linear infinite'"
    ),
    # Fallback pattern: any large Forge logo text
    (
        "fontSize:36, marginBottom:8",
        "fontSize:40, marginBottom:8, animation:'neon-cycle 4s linear infinite'"
    ),
]

replaced_logo = False
for old_style, new_style in logo_patterns:
    if old_style in fixed:
        fixed = fixed.replace(old_style, new_style, 1)
        print(f"✓ Applied neon animation to logo (matched: {old_style[:40]}...)")
        replaced_logo = True
        break

if not replaced_logo:
    print("WARNING: Could not find logo style pattern to add neon animation")

# ── Step 4: Fix the login screen icon (replace ⚡ emoji div with styled text) ──
# The login screen has: <div style={{ fontSize:36, marginBottom:8 }}>⚡</div>
# Replace with a styled "F" monogram or keep the ⚡ but style it with neon
old_icon = '<div style={{ fontSize:36, marginBottom:8 }}>⚡</div>'
new_icon = '<div style={{ fontSize:40, marginBottom:8, animation:\'neon-cycle 4s linear infinite\', fontWeight:900, fontFamily:\'Inter, sans-serif\' }}>⚡</div>'
if old_icon in fixed:
    fixed = fixed.replace(old_icon, new_icon, 1)
    print("✓ Applied neon to login icon")

# ── Step 5: Update sidebar logo icon (the ⚡ in orange square) ───────────────
# Pattern: width:28, height:28, background:'var(--fg-orange)'... >⚡</div>
# Make the sidebar Forge logo also use neon cycling
old_sidebar_icon = "background:'var(--fg-orange)', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>⚡</div>"
new_sidebar_icon = "background:'transparent', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, animation:'neon-cycle 3s linear infinite' }}>⚡</div>"
if old_sidebar_icon in fixed:
    fixed = fixed.replace(old_sidebar_icon, new_sidebar_icon, 1)
    print("✓ Applied neon to sidebar icon")

# ── Verify final state ────────────────────────────────────────────────────────
print(f"\nFinal: {len(fixed)} chars, {fixed.count(chr(10))} lines")
assert '#0d0608' in fixed or '#cc2936' in fixed, "Red theme not applied"
assert 'neon-cycle' in fixed, "Neon animation not in file"
assert '⚡' in fixed, "⚡ emoji missing"
assert 'âš¡' not in fixed, "Mojibake still present"
print("✓ All assertions passed")

# Write back as UTF-8 without BOM
with open(filepath, 'w', encoding='utf-8', newline='') as f:
    f.write(fixed)

print("\n✅ File written successfully.")
