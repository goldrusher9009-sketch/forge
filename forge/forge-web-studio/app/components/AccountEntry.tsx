'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useUiLanguage } from '../../lib/ui-language';
import styles from './AccountEntry.module.css';

export function AccountEntry({request,onLogin,notice=''}:{request:(path:string,options:RequestInit)=>Promise<any>;onLogin:(user:any)=>void;notice?:string}){
  const query=typeof window==='undefined'?new URLSearchParams():new URLSearchParams(window.location.search);
  const [uiLanguage,setUiLanguage]=useUiLanguage();
  const zh=uiLanguage==='zh';
  const [mode,setMode]=useState<'login'|'register'|'forgot'>(()=>query.get('auth')==='register'?'register':'login');
  const [sent,setSent]=useState(false);
  const [recovery,setRecovery]=useState(false);
  useEffect(()=>{let live=true;request('/auth/recovery/status',{method:'GET'}).then(d=>{if(live)setRecovery(d?.data?.emailRecovery===true);}).catch(()=>{});return()=>{live=false;};},[request]);
  const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[name,setName]=useState('');
  const [error,setError]=useState(''),[loading,setLoading]=useState(false);const pending=useRef(false);
  const t=(en:string,cn:string)=>zh?cn:en;
  const submit=async(e:React.FormEvent)=>{
    e.preventDefault();if(pending.current)return;pending.current=true;setLoading(true);setError('');
    let registered=false;
    try{
      if(mode==='forgot'){
        await request('/auth/forgot-password',{method:'POST',body:JSON.stringify({email:email.trim(),language:zh?'zh':'en'})});
        setSent(true);return;
      }
      if(mode==='register'){await request('/auth/register',{method:'POST',body:JSON.stringify({email:email.trim(),password,firstName:name.trim(),lastName:''})});registered=true;}
      const data=await request('/auth/login',{method:'POST',body:JSON.stringify({email:email.trim(),password})});
      const u=data.data?.user||data.user||{},token=data.data?.accessToken||data.data?.access_token||data.accessToken||data.access_token||data.token||'';
      if(!token||!u.id)throw Error('LOGIN_INCOMPLETE');
      onLogin({id:u.id,email:u.email,name:u.firstName||u.name||email,token,role:u.role});
    }catch(e:any){
      const message=String(e.message||'');
      if(registered){setMode('login');setError(t('Your account was created. Please sign in to continue.','账号已创建，请登录以继续。'));}
      else if(message.includes('INVALID_CREDENTIALS'))setError(t('Invalid email or password.','邮箱或密码不正确。'));
      else if(message.includes('DUPLICATE_EMAIL')||message==='Email already registered')setError(t('This email is registered. Switch to Sign In.','此邮箱已注册，请切换到登录。'));
      else if(message.includes('INVALID_PASSWORD')||message==='Password must be at least 8 characters')setError(t('Use a password with at least 8 characters.','密码至少需要 8 个字符。'));
      else if(message.includes('AUTH_RATE_LIMITED')||message.includes('RATE_LIMIT_EXCEEDED')||message.includes('Too many sign-in attempts'))setError(t('Too many attempts. Please wait a few minutes and try again.','尝试次数过多，请稍等几分钟后再试。'));
      else if(message.includes('PASSWORD_RECOVERY_UNAVAILABLE')||message.includes('PASSWORD_RECOVERY_MAIL_FAILED'))setError(t('Password recovery e-mail is temporarily unavailable. Please contact support.','找回密码邮件暂时不可用，请联系支持团队。'));
      else setError(t('We could not complete this request. Please try again.','暂时无法完成请求，请重试。'));
    }finally{pending.current=false;setLoading(false);}
  };
  return <main className={styles.page} lang={zh?'zh-CN':'en'}>
    <header className={styles.header}><a href={'/landing?lang='+(zh?'zh':'en')} aria-label={t('About Forge','了解 Forge')} className={styles.brand}><span>F</span> Forge</a><button type="button" onClick={()=>setUiLanguage(zh?'en':'zh')} aria-label={t('Switch to Chinese','切换为英文')}>{zh?'EN':'中文'}</button></header>
    <div className={styles.layout}>
      <section className={styles.story}><p className={styles.eyebrow}>{t('YOUR EXPERTISE. IN ACTION.','你的专业，真正落地。')}</p><h1>{t('Make your way of working','把你的工作方法，')}<em>{t('work for you.','变成你的 Agent。')}</em></h1><p>{t('Create an Agent around your instructions and sources. Test it, publish a version, and put it to work.','围绕你的指令与资料创建 Agent，先测评，再发布，让它完成真实任务。')}</p><ol><li>{t('Your sources, organized.','整理专属资料库')}</li><li>{t('Your standards, tested.','按你的标准测评')}</li><li>{t('Your results, ready to review.','交付可检查的成果')}</li></ol><a href={'/landing?lang='+(zh?'zh':'en')}>{t('Explore Forge','了解 Forge')} ↗</a></section>
      <section className={styles.card} aria-label={t('Forge account','Forge 账号')}>
        <p className={styles.eyebrow}>{t('ONE FORGE ACCOUNT','一个 FORGE 账号')}</p><h2>{mode==='register'?t('Start your workspace.','创建你的工作区。'):mode==='forgot'?t('Reset your password.','重置密码。'):t('Welcome back.','欢迎回来。')}</h2><p>{mode==='forgot'?t('Enter your account e-mail. We will send a single-use link that works for 30 minutes.','输入账号邮箱，我们会发送一个 30 分钟内有效的一次性重置链接。'):t('Your Agents, library and model credit, together.','统一管理你的 Agent、资料库和模型额度。')}</p>
        {mode!=='forgot'&&<div className={styles.tabs}>{(['login','register'] as const).map(m=><button type="button" key={m} disabled={loading} aria-pressed={mode===m} onClick={()=>{setMode(m);setError('');}}>{m==='login'?t('Sign In','登录'):t('Sign Up','注册')}</button>)}</div>}
        {mode==='forgot'&&sent?<div>
          <p className={styles.notice} role="status">{t('If an account exists for this e-mail, a reset link is on its way. Check your inbox and spam folder.','如果该邮箱存在账号，重置链接已发送。请查看收件箱和垃圾邮件。')}</p>
          <button className={styles.submit} type="button" onClick={()=>{setMode('login');setSent(false);setError('');}}>{t('Back to Sign In','返回登录')} <span aria-hidden="true">↗</span></button>
        </div>:<form onSubmit={submit}>
          {mode==='register'&&<label>{t('Name','姓名')}<input autoComplete="name" placeholder={t('Name','姓名')} value={name} onChange={e=>setName(e.target.value)} required maxLength={100} disabled={loading}/></label>}
          <label>{t('Email','邮箱')}<input type="email" autoComplete="email" placeholder={t('Email','邮箱')} value={email} onChange={e=>setEmail(e.target.value)} required maxLength={254} disabled={loading}/></label>
          {mode!=='forgot'&&<label>{t('Password','密码')}<input type="password" autoComplete={mode==='register'?'new-password':'current-password'} placeholder={t('Password','密码')} value={password} onChange={e=>setPassword(e.target.value)} required minLength={mode==='register'?8:1} disabled={loading}/></label>}
          {mode==='register'&&<p className={styles.hint}>{t('At least 8 characters. No card needed to create an account.','至少 8 个字符。创建账号无需银行卡。')}</p>}
          {error&&<p className={styles.error} role="alert">{error}</p>}{notice&&<p className={styles.notice} role="status">{notice}</p>}
          <button className={styles.submit} disabled={loading} type="submit">{loading?t('Please wait…','请稍候…'):mode==='register'?t('Create Account','创建账号'):mode==='forgot'?t('Send reset link','发送重置链接'):t('Sign In','登录')} <span aria-hidden="true">↗</span></button>
          {mode==='login'&&recovery&&<button type="button" className={styles.link} disabled={loading} onClick={()=>{setMode('forgot');setError('');}}>{t('Forgot your password?','忘记密码？')}</button>}
          {mode==='forgot'&&<button type="button" className={styles.link} disabled={loading} onClick={()=>{setMode('login');setError('');}}>{t('Back to Sign In','返回登录')}</button>}
        </form>}
        {mode==='register'&&<p className={styles.legal}>{t('By creating an account, you agree to the ','创建账号即表示你同意')}<a href="/terms" target="_blank" rel="noreferrer">{t('Terms of Service','服务条款')}</a>{t(' and acknowledge the ','，并已阅读')}<a href="/privacy" target="_blank" rel="noreferrer">{t('Privacy Policy','隐私政策')}</a>。</p>}
        <div className={styles.foot}>{t('FORGE / PERSONAL WORKSPACE','FORGE / 个人工作区')}</div>
      </section>
    </div>
  </main>;
}
