'use client';
import React, { useEffect, useState } from 'react';

function useChinese() {
  const [zh, setZh] = useState(false);
  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem('forge_library_language'); } catch {}
    setZh(saved ? saved === 'zh' : navigator.language.toLowerCase().startsWith('zh'));
  }, []);
  return zh;
}

const panelStyle: React.CSSProperties = {
  padding: '32px 24px', color: 'var(--fg-text2)', minHeight: 160,
  display: 'grid', alignContent: 'center', justifyItems: 'start', gap: 12,
};

export function ToolPanelLoading() {
  const zh = useChinese();
  return <div style={panelStyle} role="status" aria-live="polite" data-testid="tool-panel-loading">
    {zh ? '正在打开工具…' : 'Opening your tool…'}
  </div>;
}

function ToolPanelUnavailable() {
  const zh = useChinese();
  return <div style={panelStyle} role="alert" data-testid="tool-panel-unavailable">
    <strong>{zh ? '工具暂时无法打开' : 'This tool could not be opened'}</strong>
    <span>{zh ? '请检查网络连接，然后重新加载。你仍可切换到其他工作区页面。' : 'Check your connection, then reload. You can still switch to another workspace page.'}</span>
    <button type="button" onClick={() => window.location.reload()} style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid var(--fg-border2)', background: 'var(--fg-bg3)', color: 'var(--fg-text)', cursor: 'pointer' }}>
      {zh ? '重新加载' : 'Reload'}
    </button>
  </div>;
}

class ToolPanelBoundary extends React.Component<React.PropsWithChildren, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <ToolPanelUnavailable /> : this.props.children; }
}

export function withToolPanelBoundary<Props extends object>(Panel: React.ComponentType<Props>): React.ComponentType<Props> {
  function DeferredToolPanel(props: Props) {
    return <ToolPanelBoundary><Panel {...props} /></ToolPanelBoundary>;
  }
  return DeferredToolPanel;
}
