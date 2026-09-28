'use client';

import { useEffect, useState } from 'react';
import { useUiLanguage } from '../../lib/ui-language';
import styles from './WorkspaceStatus.module.css';

export function WorkspaceStatus({ failed = false }: { failed?: boolean }) {
  const [language] = useUiLanguage();
  const zh = language === 'zh';
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), 10000);
    return () => window.clearTimeout(timer);
  }, []);
  return <main className={styles.page} lang={zh ? 'zh-CN' : 'en'}>
    <a className={styles.brand} href={`/landing?lang=${language}`}><span>F↗</span> FORGE</a>
    <section className={styles.card} aria-live="polite" aria-busy={!failed}>
      <p className={styles.eyebrow}>{zh ? '从意图到交付' : 'FROM INTENT TO DELIVERY'}</p>
      <h1>{failed ? (zh ? '暂时无法打开工作区。' : 'Your workspace could not open.') : (zh ? '正在准备你的工作区。' : 'Preparing your workspace.')}</h1>
      <p className={styles.detail}>{failed
        ? (zh ? '请重新加载后继续。如果问题仍然存在，可以稍后再试。' : 'Reload to continue. If the problem persists, please try again in a moment.')
        : slow ? (zh ? '加载比平时久一些。请检查网络，或重新加载此页面。' : 'This is taking longer than usual. Check your connection or reload this page.')
        : (zh ? '即将打开你的任务、Agent 和资料库。' : 'Your tasks, Agents and sources will be here shortly.')}</p>
      {!failed && <div className={styles.preview} aria-hidden="true"><div /><div /><div /></div>}
      {(failed || slow) && <div className={styles.actions}><button onClick={() => window.location.reload()}>{zh ? '重新加载' : 'Reload workspace'} ↗</button><a href={`/landing?lang=${language}`}>{zh ? '返回产品首页' : 'Back to Forge'}</a></div>}
    </section>
    <span className={styles.footer}>{zh ? '你的专业，真正落地。' : 'YOUR EXPERTISE. IN ACTION.'}</span>
  </main>;
}
