// Forge AI Extension — Content Script
(function () {
  'use strict';

  if (window.__forgeExtLoaded) return;
  window.__forgeExtLoaded = true;

  // ─── Config ───────────────────────────────────────────────────────────────
  const DEFAULT_BACKEND = 'https://forge-sand-two.vercel.app';

  const TOOLS = [
    { id: 'improve',      label: '✨ Improve' },
    { id: 'summarize',    label: '📝 Summarize' },
    { id: 'simplify',     label: '💡 Explain' },
    { id: 'shorten',      label: '✂️ Shorten' },
    { id: 'professional', label: '👔 Professionalize' },
    { id: 'bullet',       label: '📋 Bullets' },
    { id: 'translate',    label: '🌍 Translate' },
    { id: 'tone',         label: '🎭 Tone' },
  ];

  // ─── State ────────────────────────────────────────────────────────────────
  let selectedText = '';
  let toolbarEl = null;
  let panelEl = null;
  let showTimeout = null;

  // ─── Get stored settings ──────────────────────────────────────────────────
  function getSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['forge_token', 'forge_backend'], (r) => {
        resolve({
          token: r.forge_token || '',
          backend: r.forge_backend || DEFAULT_BACKEND,
        });
      });
    });
  }

  // ─── Toolbar ──────────────────────────────────────────────────────────────
  function removeToolbar() {
    if (toolbarEl) { toolbarEl.remove(); toolbarEl = null; }
  }

  function createToolbar(rect) {
    removeToolbar();
    toolbarEl = document.createElement('div');
    toolbarEl.id = 'forge-toolbar';

    // Pill
    const pill = document.createElement('div');
    pill.className = 'forge-pill';
    pill.innerHTML = '<span class="forge-logo">⚡</span><span class="forge-pill-text">Forge</span><span class="forge-arrow">▾</span>';

    // Tool grid
    const grid = document.createElement('div');
    grid.className = 'forge-tools';
    grid.style.display = 'none';

    TOOLS.forEach(t => {
      const btn = document.createElement('button');
      btn.className = 'forge-tool-btn';
      btn.textContent = t.label;
      btn.dataset.tool = t.id;
      btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        runTool(t.id, selectedText);
        removeToolbar();
      });
      grid.appendChild(btn);
    });

    pill.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      grid.style.display = grid.style.display === 'none' ? 'grid' : 'none';
    });

    toolbarEl.appendChild(pill);
    toolbarEl.appendChild(grid);

    // Position above selection
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const left = Math.max(8, Math.min(rect.left + scrollX, window.innerWidth + scrollX - 240));
    const top = rect.top + scrollY - 52;

    toolbarEl.style.left = left + 'px';
    toolbarEl.style.top = top + 'px';

    document.body.appendChild(toolbarEl);
  }

  // ─── Panel ────────────────────────────────────────────────────────────────
  function ensurePanel() {
    if (!panelEl) {
      panelEl = document.createElement('div');
      panelEl.id = 'forge-panel';
      document.body.appendChild(panelEl);
    }
    return panelEl;
  }

  function showLoading(title) {
    const p = ensurePanel();
    p.innerHTML = `
      <div class="forge-panel-header">
        <span class="forge-panel-title">⚡ ${title}</span>
        <div class="forge-panel-actions">
          <button class="forge-close-btn" id="forge-close">✕</button>
        </div>
      </div>
      <div class="forge-panel-body">
        <div class="forge-loading">
          <div class="forge-spinner"></div>
          <span>Forge is thinking...</span>
        </div>
      </div>`;
    p.classList.add('forge-panel-open');
    document.getElementById('forge-close').addEventListener('click', closePanel);
  }

  function showResult(title, htmlContent, originalSnippet) {
    const p = ensurePanel();
    const snippet = originalSnippet && originalSnippet.length > 120
      ? originalSnippet.slice(0, 120) + '…'
      : originalSnippet;

    p.innerHTML = `
      <div class="forge-panel-header">
        <span class="forge-panel-title">⚡ ${title}</span>
        <div class="forge-panel-actions">
          <button class="forge-copy-btn" id="forge-copy">📋 Copy</button>
          <button class="forge-close-btn" id="forge-close">✕</button>
        </div>
      </div>
      <div class="forge-panel-body">
        <div class="forge-result">${htmlContent}</div>
        ${snippet ? `<div class="forge-original"><strong>Original:</strong>${escHtml(snippet)}</div>` : ''}
      </div>`;
    p.classList.add('forge-panel-open');

    document.getElementById('forge-close').addEventListener('click', closePanel);
    document.getElementById('forge-copy').addEventListener('click', () => {
      const text = p.querySelector('.forge-result').innerText;
      navigator.clipboard.writeText(text).then(() => {
        document.getElementById('forge-copy').textContent = '✓ Copied!';
        setTimeout(() => {
          const btn = document.getElementById('forge-copy');
          if (btn) btn.textContent = '📋 Copy';
        }, 2000);
      });
    });
  }

  function showError(msg) {
    const p = ensurePanel();
    p.innerHTML = `
      <div class="forge-panel-header">
        <span class="forge-panel-title">⚡ Forge</span>
        <div class="forge-panel-actions">
          <button class="forge-close-btn" id="forge-close">✕</button>
        </div>
      </div>
      <div class="forge-panel-body">
        <div class="forge-error">${escHtml(msg)}</div>
        ${msg.includes('token') ? `<p style="margin-top:12px;font-size:13px;color:#6b7280">Click the ⚡ Forge icon in your Chrome toolbar to add your token.</p>` : ''}
      </div>`;
    p.classList.add('forge-panel-open');
    document.getElementById('forge-close').addEventListener('click', closePanel);
  }

  function closePanel() {
    if (panelEl) panelEl.classList.remove('forge-panel-open');
  }

  function escHtml(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ─── Tool execution ───────────────────────────────────────────────────────
  async function runTool(toolId, text) {
    if (!text || text.length < 5) return;

    const toolLabel = TOOLS.find(t => t.id === toolId)?.label || toolId;
    showLoading(toolLabel);

    const { token, backend } = await getSettings();

    if (!token) {
      showError('No Forge token found. Please add your token in the extension settings.');
      return;
    }

    try {
      let endpoint, body, resultHtml;

      if (toolId === 'summarize') {
        endpoint = '/api/summarize';
        body = { text, mode: 'tldr', length: 'short' };
      } else if (toolId === 'translate') {
        endpoint = '/api/translate';
        body = { text, languages: ['Spanish', 'French', 'German', 'Japanese', 'Chinese'] };
      } else if (toolId === 'tone') {
        endpoint = '/api/tone-detect';
        body = { text };
      } else {
        endpoint = '/api/write-assist';
        body = { text, mode: toolId };
      }

      const r = await fetch(`${backend}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const d = await r.json();
      if (!r.ok) throw new Error(d.error || `Server error ${r.status}`);

      // Format result
      if (toolId === 'summarize') {
        const stats = d.stats || {};
        resultHtml = `<p>${escHtml(d.result || '')}</p>
          <div class="forge-meta">
            ${stats.inputWords ? `${stats.inputWords} words → ${stats.outputWords} words (${Math.round(stats.compressionRatio * 100)}% compression)` : ''}
          </div>`;

      } else if (toolId === 'translate') {
        const results = d.results || [];
        resultHtml = results.map(r =>
          `<div style="margin-bottom:14px">
            <div class="forge-section-title">${escHtml(r.language)}</div>
            <p>${escHtml(r.translation)}</p>
           </div>`
        ).join('');

      } else if (toolId === 'tone') {
        const emotions = (d.emotions || []).slice(0, 4);
        const emotionBars = emotions.map(e =>
          `<div style="margin-bottom:8px">
            <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px">
              <span>${escHtml(e.emotion)}</span>
              <span style="color:#6b7280">${Math.round(e.intensity * 100)}%</span>
            </div>
            <div style="height:6px;background:#f3f4f6;border-radius:3px">
              <div style="height:6px;background:#6366f1;border-radius:3px;width:${Math.round(e.intensity * 100)}%"></div>
            </div>
          </div>`
        ).join('');

        resultHtml = `
          <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">
            <span class="forge-tag" style="background:#eef2ff;color:#6366f1">${escHtml(d.primaryTone || '')}</span>
            <span class="forge-tag" style="background:#f0fdf4;color:#166534">${escHtml(d.sentiment?.label || '')}</span>
            <span class="forge-tag" style="background:#fff7ed;color:#92400e">${escHtml(d.formality || '')}</span>
          </div>
          <div class="forge-section-title">Emotions</div>
          ${emotionBars}
          ${d.insights?.length ? `<div class="forge-section-title" style="margin-top:12px">Insights</div>${d.insights.slice(0,3).map(i => `<p style="font-size:13px;color:#374151">• ${escHtml(i)}</p>`).join('')}` : ''}`;

      } else {
        // write-assist result
        const result = d.result || '';
        resultHtml = result.split('\n').filter(l => l.trim()).map(line => {
          if (line.startsWith('- ') || line.startsWith('• ')) {
            return `<p style="padding-left:12px">• ${escHtml(line.replace(/^[-•]\s*/, ''))}</p>`;
          }
          return `<p>${escHtml(line)}</p>`;
        }).join('');
      }

      showResult(toolLabel, resultHtml, text);

    } catch (e) {
      showError(e.message || 'Something went wrong. Please try again.');
    }
  }

  // ─── Selection listener ───────────────────────────────────────────────────
  document.addEventListener('mouseup', function (e) {
    // Don't show toolbar if clicking inside our own UI
    if (toolbarEl && toolbarEl.contains(e.target)) return;
    if (panelEl && panelEl.contains(e.target)) return;

    clearTimeout(showTimeout);
    showTimeout = setTimeout(() => {
      const sel = window.getSelection();
      const text = sel ? sel.toString().trim() : '';
      if (text.length >= 15) {
        selectedText = text;
        try {
          const range = sel.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          createToolbar(rect);
        } catch (err) { /* ignore */ }
      } else {
        removeToolbar();
      }
    }, 200);
  });

  document.addEventListener('mousedown', function (e) {
    if (toolbarEl && !toolbarEl.contains(e.target)) {
      removeToolbar();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      removeToolbar();
      closePanel();
    }
  });

  // ─── Context menu messages from background ────────────────────────────────
  chrome.runtime.onMessage.addListener(function (msg) {
    if (msg.type === 'run_tool') {
      const text = msg.text || window.getSelection()?.toString().trim() || '';
      if (text) {
        selectedText = text;
        runTool(msg.tool, text);
      }
    }
  });

})();
