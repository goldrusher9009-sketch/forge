import type {MetadataRoute} from 'next';
export default function robots():MetadataRoute.Robots{
 return {rules:[{userAgent:'*',allow:['/landing','/pricing','/terms','/privacy','/login','/register','/signup'],disallow:['/api/','/reset-password','/history','/queue','/workflows','/agents']}],sitemap:'https://forge-sand-two.vercel.app/sitemap.xml'};
}