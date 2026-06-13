$file = "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge\forge-web-studio\app\components\ForgeApp.tsx"
$content = Get-Content $file -Raw

# Find the last good cut point - everything up to and including the thread context menu closing
# We want to keep everything up through the threadMenu block (ends with })())
# and then add the correct ending

# Find the position of "      {/* Project context menu popup */"
# and truncate there, replacing with the correct full ending

$cutMarker = "      {/* Project context menu popup */}"
$idx = $content.IndexOf($cutMarker)

if ($idx -lt 0) {
    Write-Host "ERROR: cut marker not found"
    exit 1
}

Write-Host "Cut marker found at char index: $idx"

$goodPart = $content.Substring(0, $idx)

$tail = @'
      {/* Project context menu popup */}
      {projectMenu && (() => {
        const p = projects.find(x => x.id === projectMenu.projectId);
        if (!p) return null;
        return (
          <div style={{ position:'fixed', top: projectMenu.y, left: projectMenu.x, background:'var(--fg-bg3)', border:'1px solid var(--fg-border2)', borderRadius:10, padding:4, zIndex:2000, minWidth:160, boxShadow:'0 8px 32px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
            {[
              { icon:'✏️', label:'Rename', action:() => { setRenamingProject({ id:p.id, name:p.name }); setProjectMenu(null); } },
              { icon: p.pinned ? '📌 Unpin' : '📌 Pin', label: p.pinned ? 'Unpin' : 'Pin', action:() => { togglePin(p); setProjectMenu(null); } },
              { icon:'🗑️', label:'Delete', action:() => { deleteProject(p.id); setProjectMenu(null); } },
            ].map(item => (
              <button key={item.label} onClick={item.action} style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'8px 12px', background:'none', border:'none', color: item.label === 'Delete' ? 'var(--fg-red)' : 'var(--fg-text)', cursor:'pointer', fontSize:13, borderRadius:7, textAlign:'left' }}
                onMouseEnter={e => (e.currentTarget.style.background='var(--fg-bg4)')} onMouseLeave={e => (e.currentTarget.style.background='none')}>
                <span>{item.icon}</span>{item.label}
              </button>
            ))}
          </div>
        );
      })()}

      {/* Rename project modal */}
      {renamingProject && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }} onClick={() => setRenamingProject(null)}>
          <div style={{ width:360, background:'var(--fg-bg3)', borderRadius:16, padding:24, border:'1px solid var(--fg-border)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color:'var(--fg-text)', margin:'0 0 16px', fontSize:16, fontWeight:700 }}>Rename Project</h3>
            <input value={renamingProject.name} onChange={e => setRenamingProject(prev => prev ? { ...prev, name: e.target.value } : prev)} onKeyDown={e => { if (e.key==='Enter') renameProject(); }} autoFocus style={{ width:'100%', padding:'10px 12px', marginBottom:16, background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text)', fontSize:14, boxSizing:'border-box', outline:'none' }} />
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setRenamingProject(null)} style={{ flex:1, padding:'9px', background:'transparent', border:'1px solid var(--fg-border2)', borderRadius:8, color:'var(--fg-text3)', cursor:'pointer' }}>Cancel</button>
              <button onClick={renameProject} style={{ flex:1, padding:'9px', background:'var(--fg-orange)', border:'none', borderRadius:8, color:'#fff', fontWeight:600, cursor:'pointer' }}>Rename</button>
            </div>
          </div>
        </div>
      )}

      {renamingThread && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }} onClick={() => setRenamingThread(null)}>
          <div style={{ width:380, background:'var(--fg-bg3)', borderRadius:16, padding:24, border:'1px solid var(--fg-border)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color:'var(--fg-text)', margin:'0 0 20px', fontSize:18, fontFamily:'var(--fg-font-display)', fontWeight:700 }}>Rename Thread</h3>
            <input value={renamingThread.title} onChange={e => setRenamingThread(prev => prev ? { ...prev, title: e.target.value } : prev)} onKeyDown={e => { if (e.key==='Enter') renameThread(); }} autoFocus style={{ width:'100%', padding:'12px', marginBottom:16, background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text)', fontSize:14, boxSizing:'border-box', outline:'none' }} />
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setRenamingThread(null)} style={{ flex:1, padding:'10px', background:'transparent', border:'1px solid var(--fg-border2)', borderRadius:8, color:'var(--fg-text3)', cursor:'pointer' }}>Cancel</button>
              <button onClick={renameThread} style={{ flex:1, padding:'10px', background:'var(--fg-orange)', border:'none', borderRadius:8, color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer' }}>Rename</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
'@

$newContent = $goodPart + $tail
[System.IO.File]::WriteAllText($file, $newContent, [System.Text.Encoding]::UTF8)
$lines = (Get-Content $file).Count
Write-Host "Done. File now has $lines lines."
