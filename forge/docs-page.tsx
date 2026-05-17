import React, { useState } from 'react';
import Link from 'next/link';

interface DocSection {
  id: string;
  title: string;
  description: string;
  icon: string;
  articles: DocArticle[];
}

interface DocArticle {
  id: string;
  title: string;
  description: string;
}

interface DocsState {
  selectedSection: DocSection | null;
  searchQuery: string;
  expandedArticle: string | null;
}

const DocsPage: React.FC = () => {
  const [state, setState] = useState<DocsState>({
    selectedSection: null,
    searchQuery: '',
    expandedArticle: null
  });

  const docSections: DocSection[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      description: 'Learn the basics and set up your first agent in minutes.',
      icon: '🚀',
      articles: [
        { id: 'intro', title: 'Introduction to Forge', description: 'Understand what Forge is and how it works' },
        { id: 'signup', title: 'Create Your Account', description: 'Sign up and set up your workspace' },
        { id: 'first-agent', title: 'Build Your First Agent', description: 'Step-by-step guide to creating an agent' },
        { id: 'deploy', title: 'Deploy Your Agent', description: 'Move your agent to production' }
      ]
    },
    {
      id: 'core-concepts',
      title: 'Core Concepts',
      description: 'Understand agents, workflows, and execution models.',
      icon: '🧠',
      articles: [
        { id: 'agents', title: 'What Are Agents?', description: 'Detailed explanation of AI agents in Forge' },
        { id: 'workflows', title: 'Workflows & Nodes', description: 'Build complex agent behavior with workflows' },
        { id: 'state', title: 'State Management', description: 'Managing agent state and memory' },
        { id: 'execution', title: 'Execution Models', description: 'Sync, async, and scheduled execution' }
      ]
    },
    {
      id: 'api-reference',
      title: 'API Reference',
      description: 'Complete reference for REST API and WebSocket connections.',
      icon: '📚',
      articles: [
        { id: 'rest-api', title: 'REST API', description: 'HTTP endpoints for managing agents' },
        { id: 'webhooks', title: 'Webhooks', description: 'Real-time event notifications' },
        { id: 'websocket', title: 'WebSocket API', description: 'Real-time bidirectional communication' },
        { id: 'errors', title: 'Error Handling', description: 'Understanding error codes and responses' }
      ]
    },
    {
      id: 'integrations',
      title: 'Integrations',
      description: 'Connect agents to external services and APIs.',
      icon: '🔗',
      articles: [
        { id: 'slack', title: 'Slack Integration', description: 'Connect agents to Slack workspaces' },
        { id: 'database', title: 'Database Connectors', description: 'Query and update databases' },
        { id: 'email', title: 'Email Integration', description: 'Send and receive emails with agents' },
        { id: 'custom-api', title: 'Custom API Connector', description: 'Build connectors for any API' }
      ]
    },
    {
      id: 'advanced',
      title: 'Advanced Topics',
      description: 'Scale agents, optimize performance, and build complex systems.',
      icon: '⚡',
      articles: [
        { id: 'multi-agent', title: 'Multi-Agent Systems', description: 'Coordinate multiple agents' },
        { id: 'rag', title: 'RAG & Knowledge Bases', description: 'Use knowledge bases with agents' },
        { id: 'prompting', title: 'Prompt Engineering', description: 'Write better prompts for better results' },
        { id: 'performance', title: 'Performance Optimization', description: 'Optimize agent speed and cost' }
      ]
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      description: 'Debug issues and get help when something goes wrong.',
      icon: '🔧',
      articles: [
        { id: 'common-errors', title: 'Common Errors', description: 'Solutions to frequent issues' },
        { id: 'debugging', title: 'Debugging Agents', description: 'Tools and techniques for debugging' },
        { id: 'performance-issues', title: 'Performance Issues', description: 'Diagnose and fix slow agents' },
        { id: 'support', title: 'Getting Support', description: 'Contact our support team' }
      ]
    }
  ];

  const filteredSections = docSections.filter(section =>
    section.title.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
    section.description.toLowerCase().includes(state.searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <section className="px-6 py-16 sm:px-8 lg:px-12 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Documentation</h1>
          <p className="text-lg text-slate-600 mb-8">Everything you need to build and deploy AI agents with Forge.</p>

          {/* Search */}
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search documentation..."
              value={state.searchQuery}
              onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="absolute right-3 top-2.5 text-slate-400">🔍</span>
          </div>
        </div>
      </section>

      {/* Doc Sections Grid */}
      <section className="px-6 py-16 sm:px-8 lg:px-12 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSections.map((section) => (
            <div key={section.id}
              onClick={() => setState(prev => ({ ...prev, selectedSection: section }))}
              className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-lg transition cursor-pointer">
              <div className="text-4xl mb-3">{section.icon}</div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{section.title}</h3>
              <p className="text-slate-600 mb-4">{section.description}</p>
              <div className="text-blue-600 font-medium flex items-center gap-2">
                Read {section.articles.length} articles →
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Links */}
      <section className="px-6 py-16 sm:px-8 lg:px-12 bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Quick Links</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: 'API Documentation', href: '#', emoji: '📖' },
              { title: 'Code Examples', href: '#', emoji: '💻' },
              { title: 'Video Tutorials', href: '#', emoji: '🎥' },
              { title: 'Community Forum', href: '#', emoji: '💬' }
            ].map((link) => (
              <Link key={link.title} href={link.href}
                className="p-4 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition">
                <div className="text-3xl mb-2">{link.emoji}</div>
                <div className="font-medium text-slate-900">{link.title}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Section Detail Modal */}
      {state.selectedSection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-5xl mb-2">{state.selectedSection.icon}</div>
                  <h2 className="text-3xl font-bold text-slate-900">{state.selectedSection.title}</h2>
                  <p className="text-slate-600 mt-2">{state.selectedSection.description}</p>
                </div>
                <button onClick={() => setState(prev => ({ ...prev, selectedSection: null }))}
                  className="text-slate-400 hover:text-slate-600 text-2xl flex-shrink-0">✕</button>
              </div>

              {/* Articles */}
              <div className="space-y-3">
                <h3 className="font-bold text-slate-900 text-lg">Articles</h3>
                {state.selectedSection.articles.map((article) => (
                  <div key={article.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 cursor-pointer">
                    <h4 className="font-bold text-slate-900">{article.title}</h4>
                    <p className="text-slate-600 text-sm mt-1">{article.description}</p>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="flex gap-3 pt-4 border-t">
                <button onClick={() => setState(prev => ({ ...prev, selectedSection: null }))}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700">
                  Start Reading
                </button>
                <button onClick={() => setState(prev => ({ ...prev, selectedSection: null }))}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded hover:bg-slate-50">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer CTA */}
      <section className="px-6 py-16 sm:px-8 lg:px-12 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-6xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold">Can't find what you're looking for?</h2>
          <p className="text-lg text-blue-100">Contact our support team or join our community forum for help.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" className="px-6 py-2 bg-white text-blue-600 font-bold rounded hover:bg-blue-50">
              Contact Support
            </Link>
            <Link href="#" className="px-6 py-2 border-2 border-white text-white font-bold rounded hover:bg-white/10">
              Join Community
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DocsPage;
