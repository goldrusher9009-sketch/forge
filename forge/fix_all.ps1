$filepath = "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge\forge-web-studio\app\components\ForgeApp.tsx"
$utf8 = [System.Text.Encoding]::UTF8
$cp1252 = [System.Text.Encoding]::GetEncoding(1252)

# Read
$rawBytes = [System.IO.File]::ReadAllBytes($filepath)
$start = 0
if ($rawBytes[0] -eq 0xEF -and $rawBytes[1] -eq 0xBB -and $rawBytes[2] -eq 0xBF) { $start = 3 }
$text = $utf8.GetString($rawBytes, $start, $rawBytes.Length - $start)
Write-Host "Read: $($text.Length) chars, $($text.Split("`n").Length) lines"

# Fix encoding: cp1252 roundtrip
$out = New-Object System.Collections.Generic.List[byte]
foreach ($c in $text.ToCharArray()) {
    $cp = [int][char]$c
    if ($cp -le 127) { $out.Add([byte]$cp) }
    else {
        try {
            $b = $cp1252.GetBytes([string]$c)
            if ($b.Length -eq 1) { $out.Add($b[0]) }
            else { foreach ($ub in $utf8.GetBytes([string]$c)) { $out.Add($ub) } }
        } catch { foreach ($ub in $utf8.GetBytes([string]$c)) { $out.Add($ub) } }
    }
}
$fixed = $utf8.GetString($out.ToArray())
Write-Host "Encoding fixed: $($fixed.Length) chars"

# Verify bolt emoji present
$bolt = [string][char]::ConvertFromUtf32(0x26A1)
if ($fixed.Contains($bolt)) { Write-Host "OK: bolt emoji OK" }
if (-not $fixed.Contains("âš¡")) { Write-Host "OK: no mojibake" } else { Write-Host "WARN: mojibake found" }

# CSS color replacements (all single-line, no CSS syntax in PS expressions)
$fixed = $fixed -replace [regex]::Escape("--fg-bg:      #0a0a0f;"), "--fg-bg:      #0d0608;"
$fixed = $fixed -replace [regex]::Escape("--fg-bg2:     #0f0f18;"), "--fg-bg2:     #120a0c;"
$fixed = $fixed -replace [regex]::Escape("--fg-bg3:     #141420;"), "--fg-bg3:     #1a0e12;"
$fixed = $fixed -replace [regex]::Escape("--fg-bg4:     #1c1c2e;"), "--fg-bg4:     #231419;"
$fixed = $fixed -replace [regex]::Escape("--fg-bg5:     #252540;"), "--fg-bg5:     #2e1a20;"
$fixed = $fixed -replace [regex]::Escape("--fg-orange:  #da7756;"), "--fg-orange:  #cc2936;"
$fixed = $fixed -replace [regex]::Escape("--fg-orange2: #e8956d;"), "--fg-orange2: #e63946;"
$fixed = $fixed -replace [regex]::Escape("--fg-odim:    rgba(218,119,86,0.12);"), "--fg-odim:    rgba(204,41,54,0.14);"
$fixed = $fixed -replace [regex]::Escape("--fg-odim2:   rgba(218,119,86,0.20);"), "--fg-odim2:   rgba(204,41,54,0.22);"
$fixed = $fixed -replace [regex]::Escape("--fg-border3: rgba(218,119,86,0.28);"), "--fg-border3: rgba(204,41,54,0.30);"
$fixed = $fixed -replace [regex]::Escape("--fg-text:    #ececf1;"), "--fg-text:    #f0ecec;"
$fixed = $fixed -replace [regex]::Escape("--fg-text2:   #8e8ea0;"), "--fg-text2:   #9a8f91;"
$fixed = $fixed -replace [regex]::Escape("--fg-text3:   #565666;"), "--fg-text3:   #5c5054;"
Write-Host "OK: CSS vars replaced"

# Fix orange glow values in keyframes
$fixed = $fixed -replace [regex]::Escape("box-shadow:0 0 10px rgba(249,115,22,.5);"), "box-shadow:0 0 12px rgba(204,41,54,.6);"
$fixed = $fixed -replace [regex]::Escape("box-shadow:0 0 16px rgba(249,115,22,.3);"), "box-shadow:0 0 20px rgba(230,57,70,.4);"
$fixed = $fixed -replace [regex]::Escape("box-shadow:0 0 0 0 rgba(249,115,22,.35)"), "box-shadow:0 0 0 0 rgba(204,41,54,.35)"
$fixed = $fixed -replace [regex]::Escape("box-shadow:0 0 0 5px rgba(249,115,22,0)"), "box-shadow:0 0 0 5px rgba(204,41,54,0)"
$fixed = $fixed -replace [regex]::Escape("box-shadow:0 0 0 0 rgba(249,115,22,.5);"), "box-shadow:0 0 0 0 rgba(204,41,54,.5);"
$fixed = $fixed -replace [regex]::Escape("box-shadow:0 0 0 6px rgba(249,115,22,0);"), "box-shadow:0 0 0 6px rgba(204,41,54,0);"
Write-Host "OK: glow colors updated"

# Inject neon-cycle keyframe: append to the GLOBAL_STYLES string before its closing backtick
# The GLOBAL_STYLES string ends with: fg-topbar-line { ... }\n`;
# We'll insert before the closing of the template literal
$neon = "@keyframes neon-cycle {`n  0%   { color: #ff003c; text-shadow: 0 0 8px #ff003c, 0 0 22px rgba(255,0,60,.6); }`n  14%  { color: #ff6600; text-shadow: 0 0 8px #ff6600, 0 0 22px rgba(255,102,0,.6); }`n  28%  { color: #ffcc00; text-shadow: 0 0 8px #ffcc00, 0 0 22px rgba(255,204,0,.6); }`n  42%  { color: #00ff88; text-shadow: 0 0 8px #00ff88, 0 0 22px rgba(0,255,136,.6); }`n  57%  { color: #00ccff; text-shadow: 0 0 8px #00ccff, 0 0 22px rgba(0,204,255,.6); }`n  71%  { color: #9f4ffa; text-shadow: 0 0 8px #9f4ffa, 0 0 22px rgba(159,79,250,.6); }`n  85%  { color: #ff0099; text-shadow: 0 0 8px #ff0099, 0 0 22px rgba(255,0,153,.6); }`n  100% { color: #ff003c; text-shadow: 0 0 8px #ff003c, 0 0 22px rgba(255,0,60,.6); }`n}"
$topbarAnchor = "@keyframes fg-topbar-line { 0%{background-position:0% 50%} 100%{background-position:200% 50%} }"
if ($fixed.Contains($topbarAnchor)) {
    $fixed = $fixed -replace [regex]::Escape($topbarAnchor), ($topbarAnchor + "`n" + $neon)
    Write-Host "OK: neon-cycle keyframe injected"
} else {
    Write-Host "WARN: topbar anchor not found"
}

# Apply neon to login heading (fontSize:48)
$fixed = $fixed -replace [regex]::Escape("fontSize:48, fontWeight:800"), "fontSize:48, fontWeight:900, letterSpacing:'-0.02em', animation:'neon-cycle 4s linear infinite'"
Write-Host "OK: neon on login heading"

# Apply neon to login icon - use hex escape for bolt U+26A1
$iconOld = "style={{ fontSize:36, marginBottom:8 }}>&#x26A1;</div>"
$iconNew = "style={{ fontSize:40, marginBottom:8, animation:'neon-cycle 4s linear infinite' }}>&#x26A1;</div>"
# Use Contains with actual char
$search36 = "style={{ fontSize:36, marginBottom:8 }}>" + $bolt + "</div>"
$replace36 = "style={{ fontSize:40, marginBottom:8, animation:'neon-cycle 4s linear infinite' }}>" + $bolt + "</div>"
if ($fixed.Contains($search36)) {
    $fixed = $fixed.Replace($search36, $replace36)
    Write-Host "OK: neon on login icon"
} else {
    Write-Host "WARN: login icon not matched"
}

# Sidebar icon: background orange box -> transparent with neon
$sbOld = "background:'var(--fg-orange)', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>" + $bolt + "</div>"
$sbNew = "background:'transparent', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, animation:'neon-cycle 3s linear infinite' }}>" + $bolt + "</div>"
if ($fixed.Contains($sbOld)) {
    $fixed = $fixed.Replace($sbOld, $sbNew)
    Write-Host "OK: neon on sidebar icon"
} else {
    Write-Host "WARN: sidebar icon not matched"
}

# Final verification
if ($fixed.Contains("#0d0608")) { Write-Host "OK: red theme active" } else { Write-Host "ERR: red theme missing" }
if ($fixed.Contains("neon-cycle")) { Write-Host "OK: neon-cycle present" } else { Write-Host "ERR: neon-cycle missing" }
Write-Host "Final lines: $($fixed.Split("`n").Length)"

[System.IO.File]::WriteAllText($filepath, $fixed, $utf8)
Write-Host "Done."
