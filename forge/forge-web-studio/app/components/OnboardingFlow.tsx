'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useUiLanguage } from '../../lib/ui-language';
import styles from './OnboardingFlow.module.css';

interface OnboardingFlowProps {
  onComplete: (data: { orgName: string; teamSize: string; providers: string[] }) => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [uiLanguage] = useUiLanguage();
  const zh = uiLanguage === 'zh';
  const enter = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    enter.current?.focus();
    return () => { previous?.focus(); };
  }, []);
  // Keep the callback contract while avoiding setup fields the parent does not save.
  const complete = () => onComplete({ orgName: '', teamSize: '', providers: [] });
  const steps = zh ? [
    ['01', '让资料有序', '把文件放进个人资料库，用文件夹整理，并为 Agent 选择参考资料。'],
    ['02', '把方法做成 Agent', '描述它的工作，编辑指令与模型，运行测评，再发布可复用的版本。'],
    ['03', '从任务走向交付', '选择已发布版本，提出目标，在对话中跟进结果和模型用量。'],
  ] : [
    ['01', 'Give your knowledge a home', 'Organize files in your personal library and choose the sources your Agent can use.'],
    ['02', 'Turn your method into an Agent', 'Describe the job, refine its instructions and model, then evaluate and publish a version.'],
    ['03', 'Start with an outcome', 'Use a published version for a task. Follow the results and review your model usage.'],
  ];
  return <div className={styles.backdrop} onKeyDown={event => {
    if (event.key === 'Tab') { event.preventDefault(); enter.current?.focus(); }
    if (event.key === 'Escape') complete();
  }}>
    <section role="dialog" aria-modal="true" aria-labelledby="forge-welcome-title" aria-describedby="forge-welcome-description" className={styles.dialog}>
      <div className={styles.brand}><span aria-hidden="true">F↗</span><span>FORGE</span></div>
      <p className={styles.eyebrow}>{zh ? '你的第一个工作区' : 'YOUR FIRST WORKSPACE'}</p>
      <h2 id="forge-welcome-title">{zh ? '欢迎，让工作向前一步。' : 'Welcome. Put your ideas to work.'}</h2>
      <p id="forge-welcome-description" className={styles.intro}>{zh ? '从一个任务开始，逐步建立属于你的 Agent 和资料库。' : 'Start with one task. Build a library of knowledge and Agents that work your way.'}</p>
      <ol className={styles.steps}>{steps.map(([number,title,description]) => <li key={number}><span className={styles.number}>{number}</span><div><h3>{title}</h3><p>{description}</p></div></li>)}</ol>
      <div className={styles.footer}><p>{zh ? '部分模型当前免费，受 OpenRouter 限额约束；付费模型按实际用量扣减 Forge 额度。可在账号中查看价格与用量。' : 'Some models are currently free, subject to OpenRouter limits. Paid models use Forge credit based on actual usage. Review prices and usage in your account.'}</p><button ref={enter} onClick={complete}>{zh ? '进入我的工作区' : 'Open my workspace'} <span aria-hidden="true">↗</span></button></div>
    </section>
  </div>;
};
