const fs = require('fs');
const TSX = '/sessions/sharp-funny-wright/mnt/forge/forge-web-studio/app/components/ForgeApp.tsx';

let lines = fs.readFileSync(TSX, 'utf8').split('\n');

// Find anchor line numbers
const navAnchorLine = lines.findIndex(l => l.includes("id:'brandstory98'") && l.includes('icon'));
const renderAnchorLine = lines.findIndex(l => l.includes("mainTab as string) === 'brandstory98'") && l.includes('ForgeTab'));
const exportLine = lines.findIndex(l => l.includes('export default function ForgeApp()'));

console.log('navAnchor:', navAnchorLine, 'renderAnchor:', renderAnchorLine, 'export:', exportLine);
if (navAnchorLine < 0 || renderAnchorLine < 0 || exportLine < 0) { console.error('ANCHORS NOT FOUND'); process.exit(1); }

// ALL nav entries for waves 99-118
const NAV_ENTRIES = `            { id:'coldemail99', icon:'📧', label:'Cold Email Personalizer' },
            { id:'seobrief99', icon:'🔍', label:'SEO Content Brief' },
            { id:'legaldraft99', icon:'⚖️', label:'Legal Doc Drafter' },
            { id:'meetingactions99', icon:'✅', label:'Meeting Action Extractor' },
            { id:'prddraft99', icon:'📋', label:'PRD Writer' },
            { id:'ytscript100', icon:'🎬', label:'YouTube Script Writer' },
            { id:'appstore100', icon:'📱', label:'App Store Description' },
            { id:'changelog100', icon:'📝', label:'Changelog Writer' },
            { id:'linkedinco100', icon:'💼', label:'LinkedIn Company Page' },
            { id:'grantprop100', icon:'🏆', label:'Grant Proposal Writer' },
            { id:'threadwriter101', icon:'🐦', label:'Thread Writer' },
            { id:'uxaudit101', icon:'🔍', label:'UX Audit' },
            { id:'pricingtier101', icon:'💰', label:'Pricing Tier Designer' },
            { id:'onboardflow101', icon:'🚀', label:'Onboarding Flow Builder' },
            { id:'pressrelease101', icon:'📰', label:'Press Release Writer' },
            { id:'apidoc102', icon:'📚', label:'API Doc Generator' },
            { id:'breakeven102', icon:'📊', label:'Breakeven Calculator' },
            { id:'jobdesc102', icon:'💼', label:'Job Description Writer' },
            { id:'feedbackanalyzer102', icon:'💬', label:'Feedback Analyzer' },
            { id:'competitorteardown102', icon:'🔬', label:'Competitor Teardown' },
            { id:'emailsubject103', icon:'📧', label:'Email Subject Tester' },
            { id:'objectionhandler103', icon:'🛡️', label:'Objection Handler' },
            { id:'pitchfeedback103', icon:'🎯', label:'Pitch Deck Feedback' },
            { id:'nichefinder103', icon:'🔭', label:'Niche Finder' },
            { id:'contentrepurpose103', icon:'♻️', label:'Content Repurposer' },
            { id:'salesscript104', icon:'📞', label:'Sales Script Generator' },
            { id:'landingcopy104', icon:'🏠', label:'Landing Page Copywriter' },
            { id:'investorupdate104', icon:'📊', label:'Investor Update Writer' },
            { id:'bugreport104', icon:'🐛', label:'Bug Report Generator' },
            { id:'datastory104', icon:'📈', label:'Data Storyteller' },
            { id:'personabuilder105', icon:'👤', label:'Customer Persona Builder' },
            { id:'sopwriter105', icon:'📋', label:'SOP Writer' },
            { id:'okrgenerator105', icon:'🎯', label:'OKR Generator' },
            { id:'retrofacilitator105', icon:'🔄', label:'Retro Facilitator' },
            { id:'emailsequence105', icon:'📨', label:'Email Sequence Builder' },
            { id:'churnpredictor106', icon:'📉', label:'Churn Predictor' },
            { id:'phlauncher106', icon:'🚀', label:'Product Hunt Launch Kit' },
            { id:'affiliateprog106', icon:'🤝', label:'Affiliate Program Builder' },
            { id:'referralprog106', icon:'🎁', label:'Referral Program Designer' },
            { id:'partnershipgen106', icon:'🤝', label:'Partnership Pitch Generator' },
            { id:'grantwriter107', icon:'📜', label:'Grant Writer' },
            { id:'boarddeck107', icon:'📊', label:'Board Deck Builder' },
            { id:'hiringfunnel107', icon:'👥', label:'Hiring Funnel Optimizer' },
            { id:'gtmplanner107', icon:'🗺️', label:'Go-to-Market Planner' },
            { id:'moatanalyzer107', icon:'🏰', label:'Competitive Moat Analyzer' },
            { id:'pitchscorer108', icon:'🎯', label:'Pitch Deck Scorer' },
            { id:'revenuemodel108', icon:'💰', label:'Revenue Model Builder' },
            { id:'journeymap108', icon:'🗺️', label:'Customer Journey Mapper' },
            { id:'crisiscomms108', icon:'🚨', label:'Crisis Comms Writer' },
            { id:'duediligence108', icon:'🔍', label:'Due Diligence Checklist' },
            { id:'legalcontract109', icon:'⚖️', label:'Legal Contract Generator' },
            { id:'captable109', icon:'📊', label:'Cap Table Modeler' },
            { id:'investorupd109', icon:'📧', label:'Investor Update Writer' },
            { id:'coldsequence109', icon:'📨', label:'Cold Email Sequence Builder' },
            { id:'podcastscript109', icon:'🎙️', label:'Podcast Scriptwriter' },
            { id:'newsletter110', icon:'📰', label:'Newsletter Builder' },
            { id:'adcopy110', icon:'📢', label:'Ad Copy Generator' },
            { id:'abvariants110', icon:'🔀', label:'Landing Page A/B Tester' },
            { id:'webinarscript110', icon:'🎤', label:'Webinar Script Writer' },
            { id:'casestudy110', icon:'📖', label:'Case Study Writer' },
            { id:'techdoc111', icon:'📚', label:'Tech Doc Writer' },
            { id:'apichangelog111', icon:'📋', label:'API Changelog Generator' },
            { id:'featureflag111', icon:'🚩', label:'Feature Flag Planner' },
            { id:'loadtest111', icon:'⚡', label:'Load Test Designer' },
            { id:'threatmodel111', icon:'🛡️', label:'Security Threat Modeler' },
            { id:'prompteng112', icon:'🤖', label:'Prompt Engineer' },
            { id:'modelsel112', icon:'🧠', label:'AI Model Selector' },
            { id:'datapipe112', icon:'🔧', label:'Data Pipeline Designer' },
            { id:'mlexp112', icon:'🧪', label:'ML Experiment Tracker' },
            { id:'vectordb112', icon:'🗄️', label:'Vector DB Designer' },
            { id:'cohortanalyzer113', icon:'📊', label:'Cohort Analyzer' },
            { id:'funnelbuilder113', icon:'🔽', label:'Funnel Builder' },
            { id:'retentiondash113', icon:'📈', label:'Retention Dashboard' },
            { id:'abstats113', icon:'🔀', label:'A/B Stats Calculator' },
            { id:'ltvpredictor113', icon:'💎', label:'LTV Predictor' },
            { id:'jtbd114', icon:'🎯', label:'Jobs-to-be-Done Mapper' },
            { id:'pricingstrat114', icon:'💰', label:'Pricing Strategy Builder' },
            { id:'northstar114', icon:'⭐', label:'North Star Metric Finder' },
            { id:'okrgen114', icon:'🎯', label:'OKR Generator' },
            { id:'persona114', icon:'👤', label:'User Persona Creator' },
            { id:'seooptimizer115', icon:'🔍', label:'SEO Content Optimizer' },
            { id:'headlineanalyzer115', icon:'📰', label:'Headline Analyzer' },
            { id:'contentcal115', icon:'📅', label:'Content Calendar Builder' },
            { id:'backlinkstrat115', icon:'🔗', label:'Backlink Strategy Builder' },
            { id:'metatag115', icon:'🏷️', label:'Meta Tag Generator' },
            { id:'sopwriter116', icon:'📋', label:'SOP Writer' },
            { id:'perfrev116', icon:'⭐', label:'Performance Review Generator' },
            { id:'jobdesc116', icon:'💼', label:'Job Description Builder' },
            { id:'onboarding116', icon:'🚀', label:'Onboarding Checklist Generator' },
            { id:'meetingai116', icon:'📝', label:'Meeting Agenda AI' },
            { id:'contractrisk117', icon:'⚖️', label:'Contract Risk Scorer' },
            { id:'gdprcheck117', icon:'🔒', label:'GDPR Checker' },
            { id:'privacypol117', icon:'📜', label:'Privacy Policy Gen' },
            { id:'tosbuilder117', icon:'📄', label:'ToS Builder' },
            { id:'compliance117', icon:'✅', label:'Compliance Checklist' },
            { id:'cashflowfx118', icon:'💰', label:'Cash Flow Forecaster' },
            { id:'invoicegen118', icon:'🧾', label:'Invoice Generator' },
            { id:'taxestimator118', icon:'📊', label:'Tax Estimator' },
            { id:'budgetplanner118', icon:'📈', label:'Budget Planner' },
            { id:'fundingcalc118', icon:'🏦', label:'Funding Calculator' },`;

// ALL render cases for waves 99-118
const RENDER_CASES = `        {(mainTab as string) === 'coldemail99' && <ForgeTab_coldemail99 />}
        {(mainTab as string) === 'seobrief99' && <ForgeTab_seobrief99 />}
        {(mainTab as string) === 'legaldraft99' && <ForgeTab_legaldraft99 />}
        {(mainTab as string) === 'meetingactions99' && <ForgeTab_meetingactions99 />}
        {(mainTab as string) === 'prddraft99' && <ForgeTab_prddraft99 />}
        {(mainTab as string) === 'ytscript100' && <ForgeTab_ytscript100 />}
        {(mainTab as string) === 'appstore100' && <ForgeTab_appstore100 />}
        {(mainTab as string) === 'changelog100' && <ForgeTab_changelog100 />}
        {(mainTab as string) === 'linkedinco100' && <ForgeTab_linkedinco100 />}
        {(mainTab as string) === 'grantprop100' && <ForgeTab_grantprop100 />}
        {(mainTab as string) === 'threadwriter101' && <ForgeTab_threadwriter101 />}
        {(mainTab as string) === 'uxaudit101' && <ForgeTab_uxaudit101 />}
        {(mainTab as string) === 'pricingtier101' && <ForgeTab_pricingtier101 />}
        {(mainTab as string) === 'onboardflow101' && <ForgeTab_onboardflow101 />}
        {(mainTab as string) === 'pressrelease101' && <ForgeTab_pressrelease101 />}
        {(mainTab as string) === 'apidoc102' && <ForgeTab_apidoc102 />}
        {(mainTab as string) === 'breakeven102' && <ForgeTab_breakeven102 />}
        {(mainTab as string) === 'jobdesc102' && <ForgeTab_jobdesc102 />}
        {(mainTab as string) === 'feedbackanalyzer102' && <ForgeTab_feedbackanalyzer102 />}
        {(mainTab as string) === 'competitorteardown102' && <ForgeTab_competitorteardown102 />}
        {(mainTab as string) === 'emailsubject103' && <ForgeTab_emailsubject103 />}
        {(mainTab as string) === 'objectionhandler103' && <ForgeTab_objectionhandler103 />}
        {(mainTab as string) === 'pitchfeedback103' && <ForgeTab_pitchfeedback103 />}
        {(mainTab as string) === 'nichefinder103' && <ForgeTab_nichefinder103 />}
        {(mainTab as string) === 'contentrepurpose103' && <ForgeTab_contentrepurpose103 />}
        {(mainTab as string) === 'salesscript104' && <ForgeTab_salesscript104 />}
        {(mainTab as string) === 'landingcopy104' && <ForgeTab_landingcopy104 />}
        {(mainTab as string) === 'investorupdate104' && <ForgeTab_investorupdate104 />}
        {(mainTab as string) === 'bugreport104' && <ForgeTab_bugreport104 />}
        {(mainTab as string) === 'datastory104' && <ForgeTab_datastory104 />}
        {(mainTab as string) === 'personabuilder105' && <ForgeTab_personabuilder105 />}
        {(mainTab as string) === 'sopwriter105' && <ForgeTab_sopwriter105 />}
        {(mainTab as string) === 'okrgenerator105' && <ForgeTab_okrgenerator105 />}
        {(mainTab as string) === 'retrofacilitator105' && <ForgeTab_retrofacilitator105 />}
        {(mainTab as string) === 'emailsequence105' && <ForgeTab_emailsequence105 />}
        {(mainTab as string) === 'churnpredictor106' && <ForgeTab_churnpredictor106 />}
        {(mainTab as string) === 'phlauncher106' && <ForgeTab_phlauncher106 />}
        {(mainTab as string) === 'affiliateprog106' && <ForgeTab_affiliateprog106 />}
        {(mainTab as string) === 'referralprog106' && <ForgeTab_referralprog106 />}
        {(mainTab as string) === 'partnershipgen106' && <ForgeTab_partnershipgen106 />}
        {(mainTab as string) === 'grantwriter107' && <ForgeTab_grantwriter107 />}
        {(mainTab as string) === 'boarddeck107' && <ForgeTab_boarddeck107 />}
        {(mainTab as string) === 'hiringfunnel107' && <ForgeTab_hiringfunnel107 />}
        {(mainTab as string) === 'gtmplanner107' && <ForgeTab_gtmplanner107 />}
        {(mainTab as string) === 'moatanalyzer107' && <ForgeTab_moatanalyzer107 />}
        {(mainTab as string) === 'pitchscorer108' && <ForgeTab_pitchscorer108 />}
        {(mainTab as string) === 'revenuemodel108' && <ForgeTab_revenuemodel108 />}
        {(mainTab as string) === 'journeymap108' && <ForgeTab_journeymap108 />}
        {(mainTab as string) === 'crisiscomms108' && <ForgeTab_crisiscomms108 />}
        {(mainTab as string) === 'duediligence108' && <ForgeTab_duediligence108 />}
        {(mainTab as string) === 'legalcontract109' && <ForgeTab_legalcontract109 />}
        {(mainTab as string) === 'captable109' && <ForgeTab_captable109 />}
        {(mainTab as string) === 'investorupd109' && <ForgeTab_investorupd109 />}
        {(mainTab as string) === 'coldsequence109' && <ForgeTab_coldsequence109 />}
        {(mainTab as string) === 'podcastscript109' && <ForgeTab_podcastscript109 />}
        {(mainTab as string) === 'newsletter110' && <ForgeTab_newsletter110 />}
        {(mainTab as string) === 'adcopy110' && <ForgeTab_adcopy110 />}
        {(mainTab as string) === 'abvariants110' && <ForgeTab_abvariants110 />}
        {(mainTab as string) === 'webinarscript110' && <ForgeTab_webinarscript110 />}
        {(mainTab as string) === 'casestudy110' && <ForgeTab_casestudy110 />}
        {(mainTab as string) === 'techdoc111' && <ForgeTab_techdoc111 />}
        {(mainTab as string) === 'apichangelog111' && <ForgeTab_apichangelog111 />}
        {(mainTab as string) === 'featureflag111' && <ForgeTab_featureflag111 />}
        {(mainTab as string) === 'loadtest111' && <ForgeTab_loadtest111 />}
        {(mainTab as string) === 'threatmodel111' && <ForgeTab_threatmodel111 />}
        {(mainTab as string) === 'prompteng112' && <ForgeTab_prompteng112 />}
        {(mainTab as string) === 'modelsel112' && <ForgeTab_modelsel112 />}
        {(mainTab as string) === 'datapipe112' && <ForgeTab_datapipe112 />}
        {(mainTab as string) === 'mlexp112' && <ForgeTab_mlexp112 />}
        {(mainTab as string) === 'vectordb112' && <ForgeTab_vectordb112 />}
        {(mainTab as string) === 'cohortanalyzer113' && <ForgeTab_cohortanalyzer113 />}
        {(mainTab as string) === 'funnelbuilder113' && <ForgeTab_funnelbuilder113 />}
        {(mainTab as string) === 'retentiondash113' && <ForgeTab_retentiondash113 />}
        {(mainTab as string) === 'abstats113' && <ForgeTab_abstats113 />}
        {(mainTab as string) === 'ltvpredictor113' && <ForgeTab_ltvpredictor113 />}
        {(mainTab as string) === 'jtbd114' && <ForgeTab_jtbd114 />}
        {(mainTab as string) === 'pricingstrat114' && <ForgeTab_pricingstrat114 />}
        {(mainTab as string) === 'northstar114' && <ForgeTab_northstar114 />}
        {(mainTab as string) === 'okrgen114' && <ForgeTab_okrgen114 />}
        {(mainTab as string) === 'persona114' && <ForgeTab_persona114 />}
        {(mainTab as string) === 'seooptimizer115' && <ForgeTab_seooptimizer115 />}
        {(mainTab as string) === 'headlineanalyzer115' && <ForgeTab_headlineanalyzer115 />}
        {(mainTab as string) === 'contentcal115' && <ForgeTab_contentcal115 />}
        {(mainTab as string) === 'backlinkstrat115' && <ForgeTab_backlinkstrat115 />}
        {(mainTab as string) === 'metatag115' && <ForgeTab_metatag115 />}
        {(mainTab as string) === 'sopwriter116' && <ForgeTab_sopwriter116 />}
        {(mainTab as string) === 'perfrev116' && <ForgeTab_perfrev116 />}
        {(mainTab as string) === 'jobdesc116' && <ForgeTab_jobdesc116 />}
        {(mainTab as string) === 'onboarding116' && <ForgeTab_onboarding116 />}
        {(mainTab as string) === 'meetingai116' && <ForgeTab_meetingai116 />}
        {(mainTab as string) === 'contractrisk117' && <ForgeTab_contractrisk117 />}
        {(mainTab as string) === 'gdprcheck117' && <ForgeTab_gdprcheck117 />}
        {(mainTab as string) === 'privacypol117' && <ForgeTab_privacypol117 />}
        {(mainTab as string) === 'tosbuilder117' && <ForgeTab_tosbuilder117 />}
        {(mainTab as string) === 'compliance117' && <ForgeTab_compliance117 />}
        {(mainTab as string) === 'cashflowfx118' && <ForgeTab_cashflowfx118 />}
        {(mainTab as string) === 'invoicegen118' && <ForgeTab_invoicegen118 />}
        {(mainTab as string) === 'taxestimator118' && <ForgeTab_taxestimator118 />}
        {(mainTab as string) === 'budgetplanner118' && <ForgeTab_budgetplanner118 />}
        {(mainTab as string) === 'fundingcalc118' && <ForgeTab_fundingcalc118 />}`;

// Generic component factory — creates a simple AI tool UI
function makeComponent(id, title, emoji, desc, fields, apiEndpoint) {
  const fieldInputs = fields.map(f =>
    f.type === 'textarea'
      ? `      <textarea value={${f.key}} onChange={e=>set${f.key.charAt(0).toUpperCase()+f.key.slice(1)}(e.target.value)} placeholder="${f.placeholder}" rows={${f.rows||4}} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />`
      : `      <input value={${f.key}} onChange={e=>set${f.key.charAt(0).toUpperCase()+f.key.slice(1)}(e.target.value)} placeholder="${f.placeholder}" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />`
  ).join('\n');

  const stateDecls = fields.map(f =>
    `  const [${f.key}, set${f.key.charAt(0).toUpperCase()+f.key.slice(1)}] = React.useState('');`
  ).join('\n');

  const bodyObj = '{' + fields.map(f => `${f.key}`).join(', ') + '}';
  const firstField = fields[0].key;

  return `
function ForgeTab_${id}() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
${stateDecls}
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'${apiEndpoint}', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify(${bodyObj}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>${emoji} ${title}</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>${desc}</p>
${fieldInputs}
      <button onClick={run} disabled={loading||!${firstField}} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}`;
}

// Define all components for waves 99-118
const ALL_COMPONENTS = [
  // Wave 99
  makeComponent('coldemail99','Cold Email Personalizer','📧','Write hyper-personalized cold emails.',
    [{key:'prospect',placeholder:'Prospect name / company'},{key:'yourProduct',placeholder:'Your product / service'},{key:'painPoint',placeholder:'Their pain point you solve'}],'/api/email/cold-personalize'),
  makeComponent('seobrief99','SEO Content Brief','🔍','Generate a detailed SEO content brief for any keyword.',
    [{key:'keyword',placeholder:'Target keyword (e.g. "best project management software")'},{key:'audience',placeholder:'Target audience'}],'/api/seo/content-brief'),
  makeComponent('legaldraft99','Legal Doc Drafter','⚖️','Draft legal documents and agreements.',
    [{key:'docType',placeholder:'Document type (e.g. NDA, freelance contract)'},{key:'parties',placeholder:'Parties involved'},{key:'terms',placeholder:'Key terms and conditions',type:'textarea',rows:4}],'/api/legal/draft'),
  makeComponent('meetingactions99','Meeting Action Extractor','✅','Extract action items from meeting notes.',
    [{key:'notes',placeholder:'Paste meeting notes here...',type:'textarea',rows:6}],'/api/meetings/extract-actions'),
  makeComponent('prddraft99','PRD Writer','📋','Write a Product Requirements Document.',
    [{key:'feature',placeholder:'Feature or product name'},{key:'goal',placeholder:'Product goal / problem being solved'},{key:'users',placeholder:'Target users'}],'/api/product/prd'),
  // Wave 100
  makeComponent('ytscript100','YouTube Script Writer','🎬','Write engaging YouTube video scripts.',
    [{key:'topic',placeholder:'Video topic'},{key:'audience',placeholder:'Target audience'},{key:'duration',placeholder:'Desired length (e.g. 10 minutes)'}],'/api/content/youtube-script'),
  makeComponent('appstore100','App Store Description','📱','Write compelling app store descriptions.',
    [{key:'appName',placeholder:'App name'},{key:'features',placeholder:'Key features (comma-separated)',type:'textarea',rows:3}],'/api/marketing/app-store'),
  makeComponent('changelog100','Changelog Writer','📝','Generate professional changelog entries.',
    [{key:'version',placeholder:'Version number (e.g. v2.1.0)'},{key:'changes',placeholder:'List of changes made',type:'textarea',rows:5}],'/api/dev/changelog'),
  makeComponent('linkedinco100','LinkedIn Company Page','💼','Write a LinkedIn company page description.',
    [{key:'company',placeholder:'Company name'},{key:'mission',placeholder:'Company mission'},{key:'products',placeholder:'Products / services'}],'/api/marketing/linkedin-company'),
  makeComponent('grantprop100','Grant Proposal Writer','🏆','Write compelling grant proposals.',
    [{key:'organization',placeholder:'Organization name'},{key:'project',placeholder:'Project description'},{key:'amount',placeholder:'Funding amount requested'}],'/api/writing/grant'),
  // Wave 101
  makeComponent('threadwriter101','Thread Writer','🐦','Write viral Twitter/LinkedIn threads.',
    [{key:'topic',placeholder:'Thread topic'},{key:'angle',placeholder:'Unique angle or hook'},{key:'platform',placeholder:'Platform (Twitter/LinkedIn)'}],'/api/content/thread'),
  makeComponent('uxaudit101','UX Audit','🔍','Run a heuristic UX audit on your product.',
    [{key:'product',placeholder:'Product name'},{key:'description',placeholder:'Describe the current UX/flows',type:'textarea',rows:5}],'/api/design/ux-audit'),
  makeComponent('pricingtier101','Pricing Tier Designer','💰','Design optimal pricing tiers for your product.',
    [{key:'product',placeholder:'Product name'},{key:'market',placeholder:'Target market'},{key:'competitors',placeholder:'Key competitors and their pricing'}],'/api/product/pricing-tiers'),
  makeComponent('onboardflow101','Onboarding Flow Builder','🚀','Design an onboarding flow for your users.',
    [{key:'product',placeholder:'Product name'},{key:'userGoal',placeholder:'What is the user trying to achieve?'},{key:'steps',placeholder:'Current onboarding steps (if any)'}],'/api/product/onboarding-flow'),
  makeComponent('pressrelease101','Press Release Writer','📰','Write professional press releases.',
    [{key:'headline',placeholder:'News headline'},{key:'company',placeholder:'Company name'},{key:'details',placeholder:'Key details and quotes',type:'textarea',rows:4}],'/api/content/press-release'),
  // Wave 102
  makeComponent('apidoc102','API Doc Generator','📚','Generate API documentation from endpoint descriptions.',
    [{key:'endpoint',placeholder:'Endpoint (e.g. POST /api/users)'},{key:'description',placeholder:'What this endpoint does'},{key:'params',placeholder:'Parameters / body fields',type:'textarea',rows:3}],'/api/dev/api-docs'),
  makeComponent('breakeven102','Breakeven Calculator','📊','Calculate your break-even point.',
    [{key:'fixedCosts',placeholder:'Monthly fixed costs ($)'},{key:'variableCost',placeholder:'Variable cost per unit ($)'},{key:'price',placeholder:'Price per unit ($)'}],'/api/finance/breakeven'),
  makeComponent('jobdesc102','Job Description Writer','💼','Write compelling job descriptions.',
    [{key:'role',placeholder:'Job title'},{key:'company',placeholder:'Company name'},{key:'requirements',placeholder:'Key requirements',type:'textarea',rows:4}],'/api/hr/job-description'),
  makeComponent('feedbackanalyzer102','Feedback Analyzer','💬','Analyze customer feedback for insights.',
    [{key:'feedback',placeholder:'Paste customer feedback here...',type:'textarea',rows:6}],'/api/analytics/feedback'),
  makeComponent('competitorteardown102','Competitor Teardown','🔬','Deep-dive analysis of a competitor.',
    [{key:'competitor',placeholder:'Competitor name'},{key:'yourProduct',placeholder:'Your product'},{key:'focus',placeholder:'Focus area (pricing/features/marketing)'}],'/api/strategy/competitor-teardown'),
  // Wave 103
  makeComponent('emailsubject103','Email Subject Tester','📧','Test and score email subject lines.',
    [{key:'subject',placeholder:'Email subject line to test'},{key:'audience',placeholder:'Target audience'},{key:'goal',placeholder:'Email goal (open rate / clicks / conversions)'}],'/api/email/subject-test'),
  makeComponent('objectionhandler103','Objection Handler','🛡️','Generate responses to sales objections.',
    [{key:'objection',placeholder:'The objection (e.g. "Your price is too high")'},{key:'product',placeholder:'Your product / service'},{key:'context',placeholder:'Sales context / deal stage'}],'/api/sales/objection-handler'),
  makeComponent('pitchfeedback103','Pitch Deck Feedback','🎯','Get AI feedback on your pitch deck.',
    [{key:'pitchContent',placeholder:'Paste your pitch deck content or description...',type:'textarea',rows:6}],'/api/investor/pitch-feedback'),
  makeComponent('nichefinder103','Niche Finder','🔭','Find profitable niches for your business.',
    [{key:'skills',placeholder:'Your skills / expertise'},{key:'interests',placeholder:'Your interests'},{key:'market',placeholder:'Target market size (small/medium/large)'}],'/api/strategy/niche-finder'),
  makeComponent('contentrepurpose103','Content Repurposer','♻️','Repurpose content across formats.',
    [{key:'originalContent',placeholder:'Original content to repurpose...',type:'textarea',rows:5},{key:'targetFormat',placeholder:'Target format (e.g. Twitter thread, LinkedIn post, email)'}],'/api/content/repurpose'),
  // Wave 104
  makeComponent('salesscript104','Sales Script Generator','📞','Generate personalized sales scripts.',
    [{key:'product',placeholder:'Product / service'},{key:'prospect',placeholder:'Prospect profile'},{key:'objections',placeholder:'Likely objections'}],'/api/sales/script'),
  makeComponent('landingcopy104','Landing Page Copywriter','🏠','Write high-converting landing page copy.',
    [{key:'product',placeholder:'Product name'},{key:'headline',placeholder:'Main headline idea'},{key:'benefits',placeholder:'Key benefits',type:'textarea',rows:4}],'/api/marketing/landing-copy'),
  makeComponent('investorupdate104','Investor Update Writer','📊','Write professional investor updates.',
    [{key:'company',placeholder:'Company name'},{key:'highlights',placeholder:'Key highlights this month',type:'textarea',rows:4},{key:'asks',placeholder:'Current asks / needs'}],'/api/investor/update'),
  makeComponent('bugreport104','Bug Report Generator','🐛','Generate structured bug reports.',
    [{key:'issue',placeholder:'Describe the bug'},{key:'steps',placeholder:'Steps to reproduce',type:'textarea',rows:4},{key:'expected',placeholder:'Expected vs actual behavior'}],'/api/dev/bug-report'),
  makeComponent('datastory104','Data Storyteller','📈','Turn data into compelling narratives.',
    [{key:'data',placeholder:'Paste your data or metrics here...',type:'textarea',rows:5},{key:'audience',placeholder:'Who is this story for?'}],'/api/analytics/data-story'),
  // Wave 105
  makeComponent('personabuilder105','Customer Persona Builder','👤','Build detailed customer personas.',
    [{key:'product',placeholder:'Product / service'},{key:'targetMarket',placeholder:'Target market'},{key:'insights',placeholder:'Any existing customer insights',type:'textarea',rows:3}],'/api/marketing/persona'),
  makeComponent('sopwriter105','SOP Writer','📋','Write Standard Operating Procedures.',
    [{key:'process',placeholder:'Process name'},{key:'steps',placeholder:'Key steps involved',type:'textarea',rows:5}],'/api/ops/sop-writer'),
  makeComponent('okrgenerator105','OKR Generator','🎯','Generate OKRs aligned to your goals.',
    [{key:'goal',placeholder:'Company / team goal'},{key:'timeframe',placeholder:'Timeframe (e.g. Q3 2024)'},{key:'team',placeholder:'Team or department'}],'/api/product/okr-generator'),
  makeComponent('retrofacilitator105','Retro Facilitator','🔄','Generate retrospective formats and questions.',
    [{key:'team',placeholder:'Team name'},{key:'sprint',placeholder:'Sprint / period'},{key:'context',placeholder:'Any specific issues to address'}],'/api/ops/retro'),
  makeComponent('emailsequence105','Email Sequence Builder','📨','Build automated email sequences.',
    [{key:'goal',placeholder:'Sequence goal (onboarding / nurture / win-back)'},{key:'audience',placeholder:'Audience segment'},{key:'length',placeholder:'Number of emails in sequence'}],'/api/marketing/email-sequence'),
  // Wave 106
  makeComponent('churnpredictor106','Churn Predictor','📉','Predict churn and build retention playbooks.',
    [{key:'product',placeholder:'Product / service'},{key:'symptoms',placeholder:'Churn signals you are seeing',type:'textarea',rows:4}],'/api/retention/churn-analysis'),
  makeComponent('phlauncher106','Product Hunt Launch Kit','🚀','Generate a Product Hunt launch kit.',
    [{key:'product',placeholder:'Product name'},{key:'tagline',placeholder:'Product tagline'},{key:'features',placeholder:'Top 3 features',type:'textarea',rows:3}],'/api/marketing/ph-launch'),
  makeComponent('affiliateprog106','Affiliate Program Builder','🤝','Design an affiliate program.',
    [{key:'product',placeholder:'Product / service'},{key:'commission',placeholder:'Proposed commission rate'},{key:'audience',placeholder:'Target affiliates'}],'/api/growth/affiliate-program'),
  makeComponent('referralprog106','Referral Program Designer','🎁','Design a referral program.',
    [{key:'product',placeholder:'Product / service'},{key:'incentive',placeholder:'Referral incentive'},{key:'goal',placeholder:'Program goal'}],'/api/growth/referral-program'),
  makeComponent('partnershipgen106','Partnership Pitch Generator','🤝','Write partnership pitch proposals.',
    [{key:'yourCompany',placeholder:'Your company'},{key:'partner',placeholder:'Potential partner company'},{key:'synergy',placeholder:'Why this partnership makes sense'}],'/api/business/partnership-pitch'),
  // Wave 107
  makeComponent('grantwriter107','Grant Writer','📜','Write compelling grant applications.',
    [{key:'organization',placeholder:'Organization name'},{key:'project',placeholder:'Project description',type:'textarea',rows:4},{key:'funder',placeholder:'Grant funder / program'}],'/api/writing/grant'),
  makeComponent('boarddeck107','Board Deck Builder','📊','Build board deck content.',
    [{key:'company',placeholder:'Company name'},{key:'quarter',placeholder:'Quarter / period'},{key:'highlights',placeholder:'Key highlights and metrics',type:'textarea',rows:5}],'/api/exec/board-deck'),
  makeComponent('hiringfunnel107','Hiring Funnel Optimizer','👥','Optimize your hiring funnel.',
    [{key:'role',placeholder:'Role you are hiring for'},{key:'currentProcess',placeholder:'Current hiring process',type:'textarea',rows:4}],'/api/hr/hiring-funnel'),
  makeComponent('gtmplanner107','Go-to-Market Planner','🗺️','Build a go-to-market strategy.',
    [{key:'product',placeholder:'Product / service'},{key:'market',placeholder:'Target market'},{key:'differentiator',placeholder:'Key differentiator'}],'/api/strategy/gtm-plan'),
  makeComponent('moatanalyzer107','Competitive Moat Analyzer','🏰','Identify and strengthen your competitive moat.',
    [{key:'company',placeholder:'Company name'},{key:'product',placeholder:'Core product'},{key:'competitors',placeholder:'Key competitors'}],'/api/strategy/moat-analysis'),
  // Wave 108
  makeComponent('pitchscorer108','Pitch Deck Scorer','🎯','Score your pitch deck against investor criteria.',
    [{key:'pitch',placeholder:'Paste pitch deck content or summary...',type:'textarea',rows:6}],'/api/investor/score-pitch'),
  makeComponent('revenuemodel108','Revenue Model Builder','💰','Build a revenue model.',
    [{key:'product',placeholder:'Product / service'},{key:'segments',placeholder:'Customer segments'},{key:'streams',placeholder:'Revenue streams'}],'/api/finance/revenue-model'),
  makeComponent('journeymap108','Customer Journey Mapper','🗺️','Map your customer journey.',
    [{key:'product',placeholder:'Product / service'},{key:'persona',placeholder:'Customer persona'},{key:'touchpoints',placeholder:'Known touchpoints',type:'textarea',rows:4}],'/api/cx/journey-map'),
  makeComponent('crisiscomms108','Crisis Comms Writer','🚨','Write crisis communication statements.',
    [{key:'situation',placeholder:'Describe the crisis situation',type:'textarea',rows:4},{key:'audience',placeholder:'Target audience (customers / press / employees)'},{key:'tone',placeholder:'Tone (apologetic / informative / proactive)'}],'/api/comms/crisis'),
  makeComponent('duediligence108','Due Diligence Checklist','🔍','Generate due diligence checklists.',
    [{key:'dealType',placeholder:'Deal type (acquisition / investment / partnership)'},{key:'company',placeholder:'Target company'},{key:'focus',placeholder:'Focus areas'}],'/api/finance/due-diligence'),
  // Wave 109
  makeComponent('legalcontract109','Legal Contract Generator','⚖️','Generate legal contracts.',
    [{key:'type',placeholder:'Contract type (e.g. freelance, SaaS, NDA)'},{key:'parties',placeholder:'Parties involved'},{key:'terms',placeholder:'Key terms',type:'textarea',rows:4}],'/api/legal/contract'),
  makeComponent('captable109','Cap Table Modeler','📊','Model your cap table.',
    [{key:'founders',placeholder:'Founders and equity %'},{key:'investors',placeholder:'Investors and equity %'},{key:'scenario',placeholder:'Scenario (e.g. Series A raise of $2M at $10M pre)'}],'/api/finance/cap-table'),
  makeComponent('investorupd109','Investor Update Writer','📧','Write monthly investor updates.',
    [{key:'company',placeholder:'Company name'},{key:'month',placeholder:'Month / period'},{key:'highlights',placeholder:'Key highlights, metrics, and asks',type:'textarea',rows:5}],'/api/investor/update'),
  makeComponent('coldsequence109','Cold Email Sequence Builder','📨','Build cold email sequences.',
    [{key:'product',placeholder:'Product / service'},{key:'prospect',placeholder:'Target prospect profile'},{key:'emails',placeholder:'Number of emails in sequence'}],'/api/sales/cold-sequence'),
  makeComponent('podcastscript109','Podcast Scriptwriter','🎙️','Write podcast episode scripts.',
    [{key:'topic',placeholder:'Episode topic'},{key:'duration',placeholder:'Episode duration (minutes)'},{key:'guests',placeholder:'Guest name(s) and background'}],'/api/content/podcast-script'),
  // Wave 110
  makeComponent('newsletter110','Newsletter Builder','📰','Build engaging newsletters.',
    [{key:'topic',placeholder:'Newsletter topic / theme'},{key:'audience',placeholder:'Subscriber audience'},{key:'highlights',placeholder:'Key content to include',type:'textarea',rows:4}],'/api/content/newsletter'),
  makeComponent('adcopy110','Ad Copy Generator','📢','Generate ad copy for any platform.',
    [{key:'product',placeholder:'Product / service'},{key:'platform',placeholder:'Platform (Facebook, Google, LinkedIn)'},{key:'goal',placeholder:'Campaign goal'}],'/api/marketing/ad-copy'),
  makeComponent('abvariants110','Landing Page A/B Tester','🔀','Generate A/B test variants for landing pages.',
    [{key:'original',placeholder:'Original headline / copy',type:'textarea',rows:3},{key:'goal',placeholder:'Conversion goal'},{key:'variants',placeholder:'Number of variants to generate'}],'/api/marketing/ab-variants'),
  makeComponent('webinarscript110','Webinar Script Writer','🎤','Write webinar scripts.',
    [{key:'topic',placeholder:'Webinar topic'},{key:'duration',placeholder:'Duration (minutes)'},{key:'audience',placeholder:'Target audience'}],'/api/content/webinar-script'),
  makeComponent('casestudy110','Case Study Writer','📖','Write compelling case studies.',
    [{key:'customer',placeholder:'Customer name'},{key:'challenge',placeholder:'Challenge they faced'},{key:'results',placeholder:'Results achieved',type:'textarea',rows:3}],'/api/marketing/case-study'),
  // Wave 111
  makeComponent('techdoc111','Tech Doc Writer','📚','Write technical documentation.',
    [{key:'system',placeholder:'System or feature name'},{key:'audience',placeholder:'Target audience (developers/users)'},{key:'content',placeholder:'Key content to document',type:'textarea',rows:4}],'/api/dev/tech-doc'),
  makeComponent('apichangelog111','API Changelog Generator','📋','Generate API changelog entries.',
    [{key:'version',placeholder:'API version'},{key:'changes',placeholder:'Changes made (breaking/non-breaking)',type:'textarea',rows:5}],'/api/dev/changelog'),
  makeComponent('featureflag111','Feature Flag Planner','🚩','Plan feature flag rollout strategies.',
    [{key:'feature',placeholder:'Feature name'},{key:'rollout',placeholder:'Rollout strategy (% / segment / region)'},{key:'risks',placeholder:'Risks to mitigate'}],'/api/dev/feature-flag'),
  makeComponent('loadtest111','Load Test Designer','⚡','Design load testing scenarios.',
    [{key:'system',placeholder:'System / endpoint to test'},{key:'expectedLoad',placeholder:'Expected concurrent users'},{key:'scenario',placeholder:'Test scenario description'}],'/api/dev/load-test'),
  makeComponent('threatmodel111','Security Threat Modeler','🛡️','Model security threats for your system.',
    [{key:'system',placeholder:'System description'},{key:'assets',placeholder:'Assets to protect'},{key:'attackSurface',placeholder:'Attack surface (APIs, web, mobile)',type:'textarea',rows:3}],'/api/dev/threat-model'),
  // Wave 112
  makeComponent('prompteng112','Prompt Engineer','🤖','Engineer and optimize AI prompts.',
    [{key:'task',placeholder:'What task should the AI perform?'},{key:'context',placeholder:'Context and constraints'},{key:'format',placeholder:'Desired output format'}],'/api/ai/prompt-engineer'),
  makeComponent('modelsel112','AI Model Selector','🧠','Select the best AI model for your use case.',
    [{key:'useCase',placeholder:'Describe your use case'},{key:'requirements',placeholder:'Key requirements (speed/cost/accuracy)'},{key:'budget',placeholder:'Monthly budget estimate'}],'/api/ai/model-selector'),
  makeComponent('datapipe112','Data Pipeline Designer','🔧','Design data pipeline architectures.',
    [{key:'source',placeholder:'Data sources'},{key:'destination',placeholder:'Data destinations'},{key:'transformations',placeholder:'Required transformations',type:'textarea',rows:4}],'/api/data/pipeline-designer'),
  makeComponent('mlexp112','ML Experiment Tracker','🧪','Track and analyze ML experiments.',
    [{key:'model',placeholder:'Model type'},{key:'metrics',placeholder:'Key metrics to track'},{key:'hypothesis',placeholder:'Experiment hypothesis'}],'/api/ml/experiment-tracker'),
  makeComponent('vectordb112','Vector DB Designer','🗄️','Design vector database schemas.',
    [{key:'useCase',placeholder:'Use case (e.g. semantic search, RAG)'},{key:'dataType',placeholder:'Type of data to embed'},{key:'scale',placeholder:'Expected scale (records/queries)'}],'/api/ai/vector-db-designer'),
  // Wave 113
  makeComponent('cohortanalyzer113','Cohort Analyzer','📊','Analyze cohort data for retention insights.',
    [{key:'product',placeholder:'Product name'},{key:'cohortData',placeholder:'Paste cohort data or describe your cohorts',type:'textarea',rows:5}],'/api/analytics/cohort-analyzer'),
  makeComponent('funnelbuilder113','Funnel Builder','🔽','Build and analyze conversion funnels.',
    [{key:'product',placeholder:'Product name'},{key:'steps',placeholder:'Funnel steps (comma-separated)'},{key:'currentRates',placeholder:'Current conversion rates (if known)'}],'/api/analytics/funnel-builder'),
  makeComponent('retentiondash113','Retention Dashboard','📈','Build a retention metrics dashboard.',
    [{key:'product',placeholder:'Product name'},{key:'metrics',placeholder:'Key retention metrics to track'},{key:'timeframe',placeholder:'Timeframe for analysis'}],'/api/analytics/retention-dashboard'),
  makeComponent('abstats113','A/B Stats Calculator','🔀','Calculate statistical significance of A/B tests.',
    [{key:'control',placeholder:'Control: visitors and conversions (e.g. 1000 visitors, 50 conversions)'},{key:'variant',placeholder:'Variant: visitors and conversions'},{key:'confidence',placeholder:'Required confidence level (e.g. 95%)'}],'/api/analytics/ab-stats'),
  makeComponent('ltvpredictor113','LTV Predictor','💎','Predict customer lifetime value.',
    [{key:'arpu',placeholder:'Average revenue per user ($)'},{key:'churnRate',placeholder:'Monthly churn rate (%)'},{key:'cac',placeholder:'Customer acquisition cost ($)'}],'/api/analytics/ltv-predictor'),
  // Wave 114
  makeComponent('jtbd114','Jobs-to-be-Done Mapper','🎯','Map customer jobs-to-be-done.',
    [{key:'product',placeholder:'Product / service'},{key:'customer',placeholder:'Target customer'},{key:'context',placeholder:'Context in which they use your product'}],'/api/product/jtbd'),
  makeComponent('pricingstrat114','Pricing Strategy Builder','💰','Build a pricing strategy.',
    [{key:'product',placeholder:'Product / service'},{key:'market',placeholder:'Target market'},{key:'competitors',placeholder:'Competitive pricing landscape'}],'/api/product/pricing-strategy'),
  makeComponent('northstar114','North Star Metric Finder','⭐','Find your north star metric.',
    [{key:'product',placeholder:'Product name'},{key:'businessModel',placeholder:'Business model'},{key:'goal',placeholder:'Primary business goal'}],'/api/product/north-star'),
  makeComponent('okrgen114','OKR Generator','🎯','Generate OKRs for your team.',
    [{key:'goal',placeholder:'Strategic goal'},{key:'team',placeholder:'Team or department'},{key:'quarter',placeholder:'Quarter (e.g. Q3 2024)'}],'/api/product/okr-generator'),
  makeComponent('persona114','User Persona Creator','👤','Create detailed user personas.',
    [{key:'product',placeholder:'Product / service'},{key:'segment',placeholder:'User segment to define'},{key:'data',placeholder:'Any user research or data you have',type:'textarea',rows:4}],'/api/product/user-personas'),
  // Wave 115
  makeComponent('seooptimizer115','SEO Content Optimizer','🔍','Optimize content for search engines.',
    [{key:'content',placeholder:'Paste content to optimize...',type:'textarea',rows:6},{key:'keyword',placeholder:'Target keyword'},{key:'competitors',placeholder:'Competitor URLs (optional)'}],'/api/seo/content-optimizer'),
  makeComponent('headlineanalyzer115','Headline Analyzer','📰','Analyze and improve headlines.',
    [{key:'headline',placeholder:'Headline to analyze'},{key:'context',placeholder:'Context (blog post, ad, email subject)'},{key:'audience',placeholder:'Target audience'}],'/api/content/headline-analyzer'),
  makeComponent('contentcal115','Content Calendar Builder','📅','Build a content calendar.',
    [{key:'brand',placeholder:'Brand / company name'},{key:'channels',placeholder:'Channels (blog, social, email)'},{key:'period',placeholder:'Period (e.g. 30 days)'},{key:'themes',placeholder:'Content themes / pillars'}],'/api/content/calendar'),
  makeComponent('backlinkstrat115','Backlink Strategy Builder','🔗','Build a backlink acquisition strategy.',
    [{key:'domain',placeholder:'Your domain / site'},{key:'niche',placeholder:'Niche / industry'},{key:'goals',placeholder:'SEO goals'}],'/api/seo/backlink-strategy'),
  makeComponent('metatag115','Meta Tag Generator','🏷️','Generate SEO meta tags.',
    [{key:'page',placeholder:'Page title or topic'},{key:'content',placeholder:'Brief description of page content'},{key:'keyword',placeholder:'Target keyword'}],'/api/seo/meta-tags'),
  // Wave 116
  makeComponent('sopwriter116','SOP Writer','📋','Write Standard Operating Procedures.',
    [{key:'process',placeholder:'Process name'},{key:'team',placeholder:'Team responsible'},{key:'steps',placeholder:'Key process steps',type:'textarea',rows:5}],'/api/ops/sop-writer'),
  makeComponent('perfrev116','Performance Review Generator','⭐','Generate performance reviews.',
    [{key:'employee',placeholder:'Employee name'},{key:'role',placeholder:'Role / position'},{key:'highlights',placeholder:'Key highlights and achievements',type:'textarea',rows:4}],'/api/hr/performance-review'),
  makeComponent('jobdesc116','Job Description Builder','💼','Build comprehensive job descriptions.',
    [{key:'role',placeholder:'Job title'},{key:'company',placeholder:'Company name'},{key:'requirements',placeholder:'Key requirements and responsibilities',type:'textarea',rows:4}],'/api/hr/job-description'),
  makeComponent('onboarding116','Onboarding Checklist Generator','🚀','Generate employee onboarding checklists.',
    [{key:'role',placeholder:'New hire role'},{key:'department',placeholder:'Department'},{key:'startDate',placeholder:'Start date (optional)'}],'/api/hr/onboarding-checklist'),
  makeComponent('meetingai116','Meeting Agenda AI','📝','Generate meeting agendas.',
    [{key:'topic',placeholder:'Meeting topic / purpose'},{key:'attendees',placeholder:'Attendees and their roles'},{key:'duration',placeholder:'Meeting duration'}],'/api/ops/meeting-agenda'),
  // Wave 117
  makeComponent('contractrisk117','Contract Risk Scorer','⚖️','Analyze contracts for risky clauses.',
    [{key:'contract',placeholder:'Paste contract text here...',type:'textarea',rows:8}],'/api/legal/contract-risk'),
  makeComponent('gdprcheck117','GDPR Checker','🔒','Check your data practices for GDPR compliance.',
    [{key:'description',placeholder:'Describe your data collection and processing practices...',type:'textarea',rows:6}],'/api/legal/gdpr-check'),
  makeComponent('privacypol117','Privacy Policy Generator','📜','Generate a privacy policy.',
    [{key:'company',placeholder:'Company / product name'},{key:'dataTypes',placeholder:'Data collected (e.g. email, location, payment info)'}],'/api/legal/privacy-policy'),
  makeComponent('tosbuilder117','Terms of Service Builder','📄','Generate Terms of Service.',
    [{key:'company',placeholder:'Company name'},{key:'product',placeholder:'Product description'}],'/api/legal/tos-builder'),
  makeComponent('compliance117','Compliance Checklist Generator','✅','Generate compliance checklists.',
    [{key:'industry',placeholder:'Industry (e.g. healthcare, fintech, SaaS)'},{key:'region',placeholder:'Region (e.g. EU, US, Global)'}],'/api/legal/compliance-checklist'),
  // Wave 118
  makeComponent('cashflowfx118','Cash Flow Forecaster','💰','Forecast your cash flow.',
    [{key:'revenue',placeholder:'Monthly revenue ($)'},{key:'expenses',placeholder:'Monthly expenses ($)'},{key:'months',placeholder:'Months to forecast'}],'/api/finance/cash-flow-forecast'),
  makeComponent('invoicegen118','Invoice Generator','🧾','Generate professional invoices.',
    [{key:'client',placeholder:'Client name / company'},{key:'services',placeholder:'Services provided',type:'textarea',rows:3},{key:'amount',placeholder:'Total amount ($)'}],'/api/finance/invoice-generator'),
  makeComponent('taxestimator118','Tax Estimator','📊','Estimate your tax liability.',
    [{key:'income',placeholder:'Annual income / revenue ($)'},{key:'country',placeholder:'Country (e.g. US, UK)'},{key:'entityType',placeholder:'Entity type (LLC, S-Corp, Sole Proprietor)'}],'/api/finance/tax-estimator'),
  makeComponent('budgetplanner118','Budget Planner','📈','Create a startup budget plan.',
    [{key:'goal',placeholder:'Business goal'},{key:'runway',placeholder:'Available runway ($)'},{key:'teamSize',placeholder:'Team size'}],'/api/finance/budget-planner'),
  makeComponent('fundingcalc118','Funding Calculator','🏦','Calculate your funding range.',
    [{key:'stage',placeholder:'Funding stage (Pre-seed, Seed, Series A...)'},{key:'mrr',placeholder:'Current MRR ($)'},{key:'growth',placeholder:'Monthly growth rate (%)'}],'/api/finance/funding-calculator'),
].join('\n');

// Insert nav entries after navAnchorLine
lines.splice(navAnchorLine + 1, 0, ...NAV_ENTRIES.split('\n'));

// Recalculate render anchor line (shifted by nav insertion)
const newLines = lines;
const newRenderAnchorLine = newLines.findIndex(l => l.includes("mainTab as string) === 'brandstory98'") && l.includes('ForgeTab'));
newLines.splice(newRenderAnchorLine + 1, 0, ...RENDER_CASES.split('\n'));

// Find export default and insert components before it
const newExportLine = newLines.findIndex(l => l.includes('export default function ForgeApp()'));
newLines.splice(newExportLine, 0, ...ALL_COMPONENTS.split('\n'));

fs.writeFileSync(TSX, newLines.join('\n'), 'utf8');
console.log('DONE. Total lines:', newLines.length);
console.log('Last 3 lines:', newLines.slice(-3).join(' | '));
