'use client';
import React,{useEffect,useState} from 'react';
import {useUiLanguage} from '../../lib/ui-language';
import styles from '../components/AccountEntry.module.css';

export default function ResetPasswordPage(){
  const [uiLanguage,setUiLanguage]=useUiLanguage();
  const zh=uiLanguage==='zh';
  const [token,setToken]=useState('');
  const [password,setPassword]=useState(''),[confirm,setConfirm]=useState('');
  const [error,setError]=useState(''),[loading,setLoading]=useState(false),[done,setDone]=useState(false);
  useEffect(()=>{const q=new URLSearchParams(location.search);setToken(q.get('token')||'');},[]);
  const t=(en:string,cn:string)=>zh?cn:en,lang=zh?'zh':'en';
  const submit=async(e:React.FormEvent)=>{
    e.preventDefault();setError('');
    if(password.length<8){setError(t('Use a password with at least 8 characters.','密码至少需要 8 个字符。'));return;}
    if(password!==confirm){setError(t('The two passwords do not match.','两次输入的密码不一致。'));return;}
    setLoading(true);
    try{
      const res=await fetch('/api/auth/reset-password/complete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,newPassword:password}),cache:'no-store'});
      const body=await res.json().catch(()=>({}));
      if(!res.ok){
        const code=String(body.error||'');
        if(code==='RESET_TOKEN_INVALID')setError(t('This reset link is invalid or has expired. Request a new one from the sign-in page.','此重置链接无效或已过期，请在登录页重新申请。'));
        else if(code==='AUTH_RATE_LIMITED')setError(t('Too many attempts. Please wait a few minutes and try again.','尝试次数过多，请稍等几分钟后再试。'));
        else setError(t('We could not complete this request. Please try again.','暂时无法完成请求，请重试。'));
        return;
      }
      try{localStorage.removeItem('forge_user');localStorage.removeItem('forge_token');localStorage.removeItem('forge_access_token');}catch{}
      setDone(true);
    }catch{setError(t('We could not complete this request. Please try again.','暂时无法完成请求，请重试。'));}
    finally{setLoading(false);}
  };
  return <main className={styles.page} lang={zh?'zh-CN':'en'}>
    <header className={styles.header}><a href={'/landing?lang='+lang} aria-label={t('About Forge','了解 Forge')} className={styles.brand}><span>F</span> Forge</a><button type="button" onClick={()=>setUiLanguage(zh?'en':'zh')} aria-label={t('Switch to Chinese','切换为英文')}>{zh?'EN':'中文'}</button></header>
    <div className={styles.layout}>
      <section className={styles.story}><p className={styles.eyebrow}>FORGE / ACCOUNT</p><h1>{t('Choose a new','设置一个')}<em>{t('password.','新密码。')}</em></h1><p>{t('After the change, every signed-in device is signed out. Sign in again with the new password on the website and in Forge Desktop.','修改后，所有已登录设备都会退出。请在网站和 Forge 桌面端用新密码重新登录。')}</p></section>
      <section className={styles.card} aria-label={t('Reset password','重置密码')}>
        <p className={styles.eyebrow}>{t('ONE FORGE ACCOUNT','一个 FORGE 账号')}</p><h2>{done?t('Password updated.','密码已更新。'):t('New password.','新密码。')}</h2>
        {done?<div>
          <p className={styles.notice} role="status">{t('Your password has been changed and other sessions were signed out.','密码已修改，其他会话已退出。')}</p>
          <a className={styles.submit} href={'/login?lang='+lang}>{t('Sign In','登录')} <span aria-hidden="true">↗</span></a>
        </div>:!token?<div>
          <p className={styles.error} role="alert">{t('This link is missing its reset token. Open the link from your e-mail, or request a new one.','链接缺少重置凭证。请从邮件中打开链接，或重新申请。')}</p>
          <a className={styles.submit} href={'/login?lang='+lang}>{t('Back to Sign In','返回登录')} <span aria-hidden="true">↗</span></a>
        </div>:<form onSubmit={submit}>
          <label>{t('New password','新密码')}<input type="password" autoComplete="new-password" placeholder={t('New password','新密码')} value={password} onChange={e=>setPassword(e.target.value)} required minLength={8} disabled={loading}/></label>
          <label>{t('Confirm password','确认密码')}<input type="password" autoComplete="new-password" placeholder={t('Confirm password','确认密码')} value={confirm} onChange={e=>setConfirm(e.target.value)} required minLength={8} disabled={loading}/></label>
          <p className={styles.hint}>{t('At least 8 characters. The link can be used once and expires 30 minutes after it was requested.','至少 8 个字符。链接只能使用一次，申请后 30 分钟内有效。')}</p>
          {error&&<p className={styles.error} role="alert">{error}</p>}
          <button className={styles.submit} disabled={loading} type="submit">{loading?t('Please wait…','请稍候…'):t('Save new password','保存新密码')} <span aria-hidden="true">↗</span></button>
        </form>}
        <div className={styles.foot}>{t('FORGE / PERSONAL WORKSPACE','FORGE / 个人工作区')}</div>
      </section>
    </div>
  </main>;
}