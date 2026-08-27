import type { Metadata } from 'next';
import LegalDocument, { type LegalSection } from '../legal/LegalDocument';

export const metadata: Metadata = {
  title: 'Privacy Policy — Forge',
  description: 'How Forge collects, uses, protects, and deletes personal information and Google user data.',
};

const sections: LegalSection[] = [
  {
    id: 'scope',
    title: 'Scope and our role',
    content: (
      <>
        <p>This Privacy Policy explains how Forge collects and processes information when you use the Forge website, agent workspace, sandbox execution tools, integrations, and related support services (the “Service”). “Forge,” “we,” and “us” refer to the operator of the Service.</p>
        <p>If an organization gives you access to Forge, that organization may control the workspace and its content. In that case, its own privacy notices and instructions may also apply.</p>
      </>
    ),
  },
  {
    id: 'information',
    title: 'Information we process',
    content: (
      <>
        <p>We process information you provide, including account details, workspace content, prompts, uploaded files, agent instructions, approvals, feedback, generated Artifacts, and support communications.</p>
        <p>We also process operational information needed to run and secure the Service, such as authentication events, device and browser information, IP address, request timing, usage records, sandbox tool events, error logs, cost and quota records, and evidence used to verify agent actions.</p>
        <p>If you connect a third-party service or model provider, we process the authorization information and selected content needed to perform the action you requested. Provider credentials and OAuth tokens are treated as confidential credentials and are not intentionally included in model prompts or sandbox output.</p>
      </>
    ),
  },
  {
    id: 'use',
    title: 'How we use information',
    content: (
      <>
        <p>We use information to authenticate users, provide Workspaces and agent runs, execute user-directed tools, create and preserve Artifacts, obtain human approval for sensitive actions, operate integrations, provide support, prevent abuse, investigate failures, measure reliability, and comply with applicable law.</p>
        <p>We do not sell personal information. We do not use Google user data for advertising. Forge does not use selected Google Drive content to train a generalized or shared AI model.</p>
      </>
    ),
  },
  {
    id: 'google',
    title: 'Google Drive data',
    content: (
      <>
        <p>Forge requests the Google Drive <code>drive.file</code> permission. This lets Forge access only files and folders you select for use with Forge, together with files Forge creates at your direction. Ordinary users do not need to create a Google Cloud project or manage Google credentials.</p>
        <p>When you select a Drive file, Forge verifies its file identifier with Google and may copy the selected content into your Forge Workspace so the agent can complete your task. If the task requires an AI model, selected content may be sent to the model provider you or your organization configured, solely to perform that task. Approved write-back creates a new file in the folder you selected; the current integration does not expose overwrite, move, share, permission-change, or delete actions.</p>
        <p>Disconnecting Google Drive removes stored OAuth credentials from Forge and requests token revocation. Disconnecting does not automatically delete Workspace copies you previously imported, files already created in Drive, or minimal security and transfer-audit records. You may separately request deletion of Forge-held content as described below.</p>
        <p>Forge’s use and transfer of information received from Google APIs adheres to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer">Google API Services User Data Policy</a>, including its Limited Use requirements.</p>
      </>
    ),
  },
  {
    id: 'sharing',
    title: 'Service providers and disclosure',
    content: (
      <>
        <p>We disclose information only as needed to operate the Service, follow your instructions, protect users, or satisfy legal requirements. Recipients may include hosting and infrastructure providers, the AI model provider selected for a task, connected services such as Google Drive, security and monitoring providers, and professional advisers subject to confidentiality obligations.</p>
        <p>We may disclose information if required by law or if reasonably necessary to protect the rights, safety, and integrity of Forge, our users, or the public. If the Service is reorganized or transferred, information may move with the relevant business subject to this Policy and applicable law.</p>
      </>
    ),
  },
  {
    id: 'retention',
    title: 'Retention and deletion',
    content: (
      <>
        <p>We retain account and workspace information while the account or applicable customer relationship remains active and for as long as reasonably necessary to provide the Service. Some records may be retained longer for security, fraud prevention, dispute resolution, backup recovery, legal compliance, and an auditable history of approved agent actions.</p>
        <p>To request access, correction, export, or deletion of Forge-held personal information, contact <a href="mailto:support@forge.ai">support@forge.ai</a>. We may need to verify your identity and may retain information where required or permitted by law. Requests concerning an organization-managed workspace may be referred to that organization.</p>
      </>
    ),
  },
  {
    id: 'security',
    title: 'Security and control boundaries',
    content: (
      <>
        <p>Forge uses safeguards designed to protect information, including transport encryption, authenticated APIs, encrypted storage for supported integration credentials, isolated task environments, restricted network egress, immutable Artifact evidence, and explicit approval for sensitive external actions.</p>
        <p>No system is completely secure. You are responsible for protecting your login credentials, using appropriately scoped provider keys, reviewing requested actions, and notifying us if you suspect unauthorized access.</p>
      </>
    ),
  },
  {
    id: 'choices',
    title: 'Your choices and rights',
    content: (
      <>
        <p>You can choose what content to upload, which third-party services to connect, which Drive files or folders to select, whether to approve a sensitive action, and when to disconnect an integration. You may also have privacy rights under local law, including rights to access, correct, delete, restrict, object to, or obtain a copy of certain personal information.</p>
        <p>Forge is not directed to children under 13, and we do not knowingly collect personal information from children under 13. Users must also meet any higher minimum age required where they live.</p>
      </>
    ),
  },
  {
    id: 'changes',
    title: 'Changes and contact',
    content: (
      <>
        <p>We may update this Policy as the Service changes. We will publish the revised version here and change the effective date. If a change materially affects how we use personal information, we will provide additional notice where reasonably required.</p>
        <p>Questions or privacy requests may be sent to <a href="mailto:support@forge.ai">support@forge.ai</a>.</p>
      </>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalDocument
      eyebrow="PRIVACY POLICY"
      title="Your work stays yours."
      summary="This policy describes the information Forge needs to run human-directed agents, the boundaries around connected services such as Google Drive, and the controls available to you."
      effectiveDate="August 27, 2026"
      sections={sections}
    />
  );
}
