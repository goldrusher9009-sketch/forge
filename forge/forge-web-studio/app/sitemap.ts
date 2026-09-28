import type {MetadataRoute} from 'next';
const base='https://forge-sand-two.vercel.app';
export default function sitemap():MetadataRoute.Sitemap{
 const now=new Date('2026-09-18');
 return [
  {url:base+'/landing',lastModified:now,changeFrequency:'weekly',priority:1,alternates:{languages:{en:base+'/landing?lang=en','zh-CN':base+'/landing?lang=zh'}}},
  {url:base+'/pricing',lastModified:now,changeFrequency:'weekly',priority:0.9},
  {url:base+'/register',lastModified:now,changeFrequency:'monthly',priority:0.8},
  {url:base+'/terms',lastModified:now,changeFrequency:'yearly',priority:0.3},
  {url:base+'/privacy',lastModified:now,changeFrequency:'yearly',priority:0.3},
 ];
}