import Link from 'next/link';
import styles from './legal/legal.module.css';
export default function NotFound(){
 return <main className={styles.shell}><div className={styles.ambient} aria-hidden="true"/><header className={styles.header}><Link className={styles.brand} href="/landing" aria-label="Forge home"><span className={styles.brandMark}>F</span>Forge</Link></header>
 <section className={styles.frame}><aside className={styles.rail} aria-hidden="true"/><div className={styles.document}><div className={styles.hero}><p className={styles.statusLine}><span>404</span><span>Page not found · 页面不存在</span></p><h1>This page does not exist.</h1><p>The address may be out of date. Continue from the product overview, pricing, or sign in to your workspace.<br/>这个地址可能已经失效。你可以回到产品介绍、查看价格，或登录进入工作区。</p></div>
 <nav className={styles.headerNav} aria-label="Recovery links" style={{padding:"32px clamp(28px, 7vw, 110px)",flexWrap:"wrap"}}><Link href="/landing">Overview · 产品介绍</Link><Link href="/pricing">Pricing · 价格</Link><Link className={styles.enterLink} href="/login">Sign in · 登录 ↗</Link></nav></div></section></main>;
}