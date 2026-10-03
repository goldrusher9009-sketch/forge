import {redirect} from 'next/navigation';
export default async function PricingPage({searchParams}:{searchParams:Promise<{lang?:string}>}){
 const{lang}=await searchParams;
 redirect('/landing'+(lang==='zh'||lang==='en'?'?lang='+lang:'')+'#pricing');
}