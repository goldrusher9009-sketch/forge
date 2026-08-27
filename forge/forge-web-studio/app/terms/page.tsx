import type { Metadata } from 'next';
import LegalDocument, { type LegalSection } from '../legal/LegalDocument';

export const metadata: Metadata = {
  title: 'Terms of Service — Forge',
  description: 'Terms governing access to the Forge AI agent platform and its connected services.',
};

const sections: LegalSection[] = [
  {
    id: 'agreement',
    title: 'Agreement and eligibility',
    content: (
      <>
        <p>These Terms of Service (“Terms”) govern access to the Forge website, agent workspace, sandbox execution tools, integrations, and related services (the “Service”). By creating an account, accepting an invitation, or using the Service, you agree to these Terms and the <a href="/privacy">Privacy Policy</a>.</p>
        <p>You must be legally able to enter this agreement and meet the minimum age required where you live. If you use Forge for an organization, you represent that you are authorized to accept these Terms on its behalf.</p>
      </>
    ),
  },
  {
    id: 'service',
    title: 'The Forge service',
    content: (
      <>
        <p>Forge provides tools for creating and directing AI-assisted Workspaces, running tasks in isolated environments, reviewing evidence, approving sensitive actions, connecting third-party services, and exporting results. Features may be experimental, invitation-only, or identified as beta, and may change as we improve reliability and safety.</p>
        <p>Forge does not guarantee that an agent will complete every task, that output will be accurate, or that every third-party integration will remain available. We may impose reasonable usage, cost, file-size, tool, or concurrency limits to protect the Service and its users.</p>
      </>
    ),
  },
  {
    id: 'accounts',
    title: 'Accounts and credentials',
    content: (
      <>
        <p>You are responsible for accurate account information, safeguarding credentials, limiting access to authorized users, and activity performed through your account. Tell us promptly if you believe an account, provider key, or connected service has been compromised.</p>
        <p>If you bring your own model or service credentials, you remain responsible for the provider account, permissions, charges, rate limits, and provider terms. Do not place credentials, access tokens, or secrets inside prompts or files intended for agent execution.</p>
      </>
    ),
  },
  {
    id: 'content',
    title: 'Your content and instructions',
    content: (
      <>
        <p>You retain ownership of content you submit and results generated for you, subject to third-party rights and applicable law. You give Forge the limited permission needed to host, copy, process, transmit, and display that content solely to operate, secure, and support the Service and carry out your instructions.</p>
        <p>You represent that you have the rights and permissions needed to submit content, connect data sources, instruct the agent, and authorize external actions. You are responsible for reviewing output and approval evidence before relying on it or sending it outside Forge.</p>
      </>
    ),
  },
  {
    id: 'agent-actions',
    title: 'Agent actions and human approval',
    content: (
      <>
        <p>Forge may distinguish between actions that can run automatically, actions that require exact human approval, and actions that are blocked. You must review the described target, scope, and evidence before approving a sensitive action. An approval authorizes only the action presented; it does not authorize materially different or future actions.</p>
        <p>Cancellation and sandbox controls reduce risk but cannot always reverse an action already completed by a third-party service. You remain responsible for confirming final external results.</p>
      </>
    ),
  },
  {
    id: 'integrations',
    title: 'Google Drive and other services',
    content: (
      <>
        <p>Third-party services are governed by their own terms and privacy policies. When you connect Google Drive, Forge requests access only to files and folders you select for use with Forge and to files Forge creates at your direction. You may disconnect Google Drive from Forge and may also revoke access in your Google Account.</p>
        <p>The current Google Drive write-back flow creates a new file only after approval; it does not offer overwrite, move, share, permission-change, or delete operations. Third-party outages, policy changes, account restrictions, or revoked permissions may interrupt an integration.</p>
      </>
    ),
  },
  {
    id: 'acceptable-use',
    title: 'Acceptable use',
    content: (
      <>
        <p>You may not use Forge to violate law or third-party rights; access systems, accounts, or data without permission; distribute malware; evade security controls; facilitate fraud or deception; harass or exploit people; create unlawful surveillance; or perform prohibited high-impact decisions without appropriate authorization and human review.</p>
        <p>You may not probe, overload, resell, or reverse engineer the Service except where law expressly permits it, nor may you use sandbox tools to reach private infrastructure or cloud metadata services. We may block an instruction or suspend access when reasonably necessary to protect users, providers, or the Service.</p>
      </>
    ),
  },
  {
    id: 'ai-limitations',
    title: 'AI limitations',
    content: (
      <>
        <p>AI output can be incomplete, inaccurate, outdated, or unsuitable for your situation. Forge is a productivity tool and is not a substitute for qualified legal, medical, financial, accounting, employment, cybersecurity, or other professional advice. Do not use output as the sole basis for decisions that materially affect a person’s rights, safety, employment, credit, housing, health, or legal position.</p>
        <p>You must independently review important facts, calculations, citations, files, and external actions before use.</p>
      </>
    ),
  },
  {
    id: 'fees',
    title: 'Plans and payment',
    content: (
      <>
        <p>If you purchase a paid plan, the price, billing interval, included usage, renewal terms, and cancellation process shown at checkout or in a written order will apply. Provider charges associated with bring-your-own credentials are separate from Forge fees.</p>
        <p>Testing credits, demo balances, rewards, or internal economic units are not cash, deposits, securities, guaranteed income, or promises of payout unless a separate written agreement expressly says otherwise.</p>
      </>
    ),
  },
  {
    id: 'termination',
    title: 'Suspension and termination',
    content: (
      <>
        <p>You may stop using Forge at any time and may request account deletion. We may suspend or terminate access for material breach, security risk, non-payment, unlawful use, or conduct that threatens the Service or others. Where practical, we will provide notice and an opportunity to resolve the issue.</p>
        <p>Terms that by their nature should survive termination—including ownership, payment obligations, disclaimers, liability limitations, and dispute provisions—will continue to apply.</p>
      </>
    ),
  },
  {
    id: 'warranty',
    title: 'Warranties and liability',
    content: (
      <>
        <p>To the maximum extent permitted by law, the Service is provided “as is” and “as available,” without warranties not expressly stated in a signed agreement. We do not guarantee uninterrupted operation, particular business results, or the accuracy of AI output.</p>
        <p>To the maximum extent permitted by law, Forge will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages, or for lost profits, revenue, data, goodwill, or business opportunities arising from the Service. Nothing in these Terms excludes liability that cannot lawfully be excluded.</p>
      </>
    ),
  },
  {
    id: 'changes',
    title: 'Changes and contact',
    content: (
      <>
        <p>We may update the Service and these Terms. We will publish revised Terms here and update the effective date. If a change materially affects your rights, we will provide additional notice where reasonably required. Continued use after the revised Terms take effect constitutes acceptance to the extent permitted by law.</p>
        <p>Questions about these Terms may be sent to <a href="mailto:support@forge.ai">support@forge.ai</a>. Any signed order or customer agreement controls if it expressly conflicts with these Terms.</p>
      </>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalDocument
      eyebrow="TERMS OF SERVICE"
      title="Build boldly. Approve deliberately."
      summary="These terms define the operating boundary between your instructions, Forge’s agent tools, connected services, and the human approval required before sensitive actions."
      effectiveDate="August 27, 2026"
      sections={sections}
    />
  );
}
