export const API = '/api';

export const BACKEND = '';

export const API_BASE = BACKEND;

export function getToken(): string { return typeof window !== 'undefined' ? (localStorage.getItem('forge_token') || '') : ''; }

export async function saveToolHistory(toolId: string, toolName: string, input: any, output: string) {
  try { await fetch(`${BACKEND}/api/tool-history`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }, body: JSON.stringify({ tool_id: toolId, tool_name: toolName, input, output }) }); } catch {}
}

export const INTEGRATION_CATALOG = [
  // Dev Tools
  { id:'github',      icon:'🐙', label:'GitHub',      cat:'Dev Tools',   color:'#238636', desc:'Repos, PRs, issues, Actions' },
  { id:'linear',      icon:'📐', label:'Linear',      cat:'Dev Tools',   color:'#5e6ad2', desc:'Issues, sprints, roadmap' },
  { id:'jira',        icon:'🎯', label:'Jira',         cat:'Dev Tools',   color:'#0052cc', desc:'Tickets, boards, epics' },
  { id:'sentry',      icon:'🛡️', label:'Sentry',      cat:'Dev Tools',   color:'#362d59', desc:'Errors, issues, releases' },
  { id:'datadog',     icon:'🐶', label:'Datadog',     cat:'Dev Tools',   color:'#632ca6', desc:'Monitors, metrics, logs' },
  { id:'pagerduty',   icon:'🚨', label:'PagerDuty',   cat:'Dev Tools',   color:'#06ac38', desc:'Incidents, services, on-call' },
  { id:'cloudflare',  icon:'☁️', label:'Cloudflare',  cat:'Dev Tools',   color:'#f38020', desc:'Zones, workers, DNS' },
  { id:'vercel',      icon:'▲',  label:'Vercel',      cat:'Dev Tools',   color:'#fff',    desc:'Deployments, logs, domains' },
  { id:'supabase',    icon:'⚡', label:'Supabase',    cat:'Dev Tools',   color:'#3ecf8e', desc:'Database, auth, storage' },
  // Productivity
  { id:'notion',      icon:'📝', label:'Notion',      cat:'Productivity',color:'#fff',    desc:'Pages, databases, docs' },
  { id:'confluence',  icon:'📚', label:'Confluence',  cat:'Productivity',color:'#0052cc', desc:'Spaces, pages, wikis' },
  { id:'asana',       icon:'🗂️', label:'Asana',       cat:'Productivity',color:'#f06a6a', desc:'Tasks, projects, timelines' },
  { id:'airtable',    icon:'🟡', label:'Airtable',    cat:'Productivity',color:'#fcb400', desc:'Bases, tables, records' },
  { id:'figma',       icon:'🎨', label:'Figma',       cat:'Productivity',color:'#a259ff', desc:'Projects, files, designs' },
  { id:'loom',        icon:'🎬', label:'Loom',        cat:'Productivity',color:'#625df5', desc:'Videos, folders' },
  { id:'calendly',    icon:'📅', label:'Calendly',    cat:'Productivity',color:'#0069ff', desc:'Events, event types' },
  { id:'zoom',        icon:'📹', label:'Zoom',        cat:'Productivity',color:'#2d8cff', desc:'Meetings, recordings' },
  // CRM & Support
  { id:'hubspot',     icon:'🟠', label:'HubSpot',     cat:'CRM & Support',color:'#ff7a59', desc:'Contacts, deals, companies' },
  { id:'zendesk',     icon:'🎫', label:'Zendesk',     cat:'CRM & Support',color:'#03363d', desc:'Tickets, users, orgs' },
  // Analytics
  { id:'amplitude',   icon:'📈', label:'Amplitude',   cat:'Analytics',   color:'#1a71e5', desc:'Events, funnels, cohorts' },
  { id:'mixpanel',    icon:'🔮', label:'Mixpanel',    cat:'Analytics',   color:'#7856ff', desc:'Events, funnels, people' },
  { id:'segment',     icon:'🔌', label:'Segment',     cat:'Analytics',   color:'#52bd94', desc:'Sources, destinations' },
  { id:'posthog',     icon:'🦔', label:'PostHog',     cat:'Analytics',   color:'#f76b15', desc:'Insights, events, persons' },
  // Finance
  { id:'stripe_mgmt', icon:'💳', label:'Stripe',      cat:'Finance',     color:'#635bff', desc:'Payments, customers, subs' },
];

export const INTEGRATION_CATS = ['All','Dev Tools','Productivity','CRM & Support','Analytics','Finance'];

export const CHAINABLE_TOOLS = [
  { id:'resumebuilder', name:'Resume Builder', inputLabel:'Experience / Job Description', outputKey:'resume' },
  { id:'pitchcoach93', name:'Pitch Coach', inputLabel:'Pitch text', outputKey:'feedback' },
  { id:'coldloom94', name:'Cold Email Sequence', inputLabel:'Product description', outputKey:'emails' },
  { id:'seowriter94', name:'SEO Blog Post', inputLabel:'Keyword / Topic', outputKey:'post' },
  { id:'salespage96', name:'Sales Page', inputLabel:'Product description', outputKey:'page' },
  { id:'productlaunch95', name:'Product Launch Plan', inputLabel:'Product description', outputKey:'plan' },
  { id:'viralideagen93', name:'Viral Idea Generator', inputLabel:'Topic', outputKey:'ideas' },
  { id:'storygen2', name:'Story Generator', inputLabel:'Story premise', outputKey:'story' },
  { id:'hermes', name:'Hermes Agent', inputLabel:'Goal (Hermes will execute)', outputKey:'summary' },
];
