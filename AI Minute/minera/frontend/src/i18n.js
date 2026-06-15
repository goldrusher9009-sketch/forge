// Minimal i18n. Keyed strings for sign-in + key labels. Easy to extend.
export const DICT = {
  en: { tagline:"The AI that earns you money while you sleep.", signin:"SIGN IN WITH GOOGLE",
        wallet_note:"WALLET CREATED AUTOMATICALLY · NO GAS · <60s TO EARN", signout:"SIGN OUT", start:"START EARNING" },
  es: { tagline:"La IA que te hace ganar dinero mientras duermes.", signin:"INICIAR SESIÓN CON GOOGLE",
        wallet_note:"CARTERA CREADA AUTOMÁTICAMENTE · SIN GAS · <60s PARA GANAR", signout:"SALIR", start:"EMPEZAR A GANAR" },
  fr: { tagline:"L'IA qui vous rapporte de l'argent pendant votre sommeil.", signin:"SE CONNECTER AVEC GOOGLE",
        wallet_note:"PORTEFEUILLE CRÉÉ AUTOMATIQUEMENT · SANS GAS · <60s POUR GAGNER", signout:"DÉCONNEXION", start:"COMMENCER À GAGNER" },
};
let lang = "en";
export function setLang(l){ if(DICT[l]) lang = l; }
export function getLang(){ return lang; }
export function t(key){ return (DICT[lang] && DICT[lang][key]) || DICT.en[key] || key; }
export const LANGS = Object.keys(DICT);
