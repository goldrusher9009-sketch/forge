import React, { useState } from 'react';
import Link from 'next/link';

interface Feature {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  icon: string;
  benefits: string[];
  screenshot: string;
}

interface FeatureDetailState {
  selectedFeature: Feature | null;
  expandedBenefits: string[];
}

const FeaturesDetailPage: React.FC = () => {
  const [state, setState] = useState<FeatureDetailState>({
    selectedFeature: null,
    expandedBenefits: []
  });

  const features: Feature[] = [
    {
      id: 'visual-builder',
      title: 'Visual Agent Builder',
      description: 'Build agents without code using our intuitive drag-and-drop interface.',
      longDescription: 'Design complex AI workflows visually. Combine pre-built components, define logic flows, and test in real-time.',
      icon: '🎨',
      benefits: [
        'No coding required – perfect for non-technical teams',
        'Real-time preview of agent behavior',
        'Component library with 100+ pre-built nodes',
        'Version control and rollback capabilities'
      ],
      screenshot: '📊'
    },
    {
      id: 'multi-agent-orchestration',
      title: 'Multi-Agent Orchestration',
      description: 'Deploy and coordinate multiple AI agents working together seamlessly.',
      longDescription: 'Build complex systems where agents collaborate, delegate, and achieve goals together.',
      icon: '🤖',
      benefits: [
        'Deploy up to 100 agents per project',
        'Automatic conflict resolution and coordination',
        'Real-time communication between agents',
        'Distributed execution across 5+ regions'
      ],
      screenshot: '🌐'
    },
    {
      id: 'real-time-monitoring',
      title: 'Real-Time Monitoring & Logs',
      description: 'Track agent performance and behavior with comprehensive monitoring tools.',
      longDescription: 'Get complete visibility into what your agents are doing, when they're doing it, and how well they're performing.',
      icon: '📊',
      benefits: [
        '99.9% uptime guarantee with SLA monitoring',
        'Real-time performance dashboards',
        'Complete audit logs of all agent actions',
        'Custom alerts for anomalies and failures'
      ],
      screenshot: '📈'
    },
    {
      id: 'api-marketplace',
      title: 'API & Tool Marketplace',
      description: 'Connect agents to 500+ integrations and custom APIs.',
      longDescription: 'Access pre-built integrations or create custom connections to your business systems.',
      icon: '🔌',
      benefits: [
        '500+ pre-built integrations',
        'Custom API connector builder',
        'OAuth and API key management',
        'Rate limiting and quota controls'
      ],
      screenshot: '🔧'
    },
    {
      id: 'knowledge-base',
      title: 'Knowledge Base & RAG',
      description: 'Equip agents with domain knowledge and retrieval-augmented generation.',
      longDescription: 'Upload documents, PDFs, and data. Agents retrieve and use relevant knowledge in real-time.',
      icon: '📚',
      benefits: [
        'Support for 20+ document formats',
        'Automatic vector embedding and indexing',
        'Semantic search across knowledge base',
        'Up to 100GB storage per workspace'
      ],
      screenshot: '🔍'
    },
    {
      id: 'advanced-analytics',
      title: 'Advanced Analytics',
      description: 'Understand agent behavior through detailed analytics and reports.',
      longDescription: 'Generate custom reports, analyze trends, and optimize agent performance.',
      icon: '📈',
      benefits: [
        'Custom dashboard builder',
        'Weekly and monthly performance reports',
        'Cost tracking by agent and project',
        'Trend analysis and forecasting'
      ],
      screenshot: '📉'
    }
  ];

  const toggleBenefit = (benefitId: string) => {
    setState(prev => ({
      ...prev,
      expandedBenefits: prev.expandedBenefits.includes(benefitId)
        ? prev.expandedBenefits.filter(id => id !== benefitId)
        : [...prev.expandedBenefits, benefitId]
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="px-6 py-16 sm:px-8 lg:px-12 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-6xl mx-auto text-center text-white space-y-4">
          <h1 className="text-5xl font-bold">Powerful Features</h1>
          <p className="text-xl text-blue-100">Everything you need to build, deploy, and scale AI agents</p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 py-16 sm:px-8 lg:px-12 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div key={feature.id} className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-lg transition cursor-pointer"
              onClick={() => setState(prev => ({ ...prev, selectedFeature: feature }))}>
              <div className="p-6 space-y-4">
                <div className="text-5xl">{feature.icon}</div>
                <h3 className="text-xl font-bold text-slate-900">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
                <button className="text-blue-600 font-medium hover:text-blue-700">Learn More →</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Details Modal */}
      {state.selectedFeature && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4 items-start flex-1">
                  <div className="text-5xl">{state.selectedFeature.icon}</div>
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900">{state.selectedFeature.title}</h2>
                    <p className="text-slate-600 mt-2">{state.selectedFeature.longDescription}</p>
                  </div>
                </div>
                <button onClick={() => setState(prev => ({ ...prev, selectedFeature: null }))}
                  className="text-slate-400 hover:text-slate-600 text-2xl">✕</button>
              </div>

              {/* Benefits */}
              <div className="space-y-3">
                <h3 className="font-bold text-slate-900">Key Benefits</h3>
                {state.selectedFeature.benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded">
                    <span className="text-green-600 font-bold">✓</span>
                    <span className="text-slate-700">{benefit}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="flex gap-3 pt-4 border-t">
                <Link href="/signup" className="flex-1 px-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 text-center">
                  Get Started
                </Link>
                <button onClick={() => setState(prev => ({ ...prev, selectedFeature: null }))}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded hover:bg-slate-50">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Table */}
      <section className="px-6 py-16 sm:px-8 lg:px-12 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-8">Feature Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-300">
                  <th className="text-left py-3 px-4 font-bold text-slate-900">Feature</th>
                  <th className="text-center py-3 px-4 font-bold text-slate-900">Starter</th>
                  <th className="text-center py-3 px-4 font-bold text-slate-900">Pro</th>
                  <th className="text-center py-3 px-4 font-bold text-slate-900">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Visual Builder', starter: '✓', pro: '✓', enterprise: '✓' },
                  { name: 'API Integrations', starter: '50', pro: '500', enterprise: 'Unlimited' },
                  { name: 'Agents per Project', starter: '5', pro: '100', enterprise: 'Unlimited' },
                  { name: 'Knowledge Base Size', starter: '1GB', pro: '50GB', enterprise: '500GB' },
                  { name: 'Real-Time Monitoring', starter: '✓', pro: '✓', enterprise: '✓' },
                  { name: 'Analytics & Reports', starter: 'Basic', pro: 'Advanced', enterprise: 'Custom' }
                ].map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-200">
                    <td className="py-3 px-4 text-slate-900">{row.name}</td>
                    <td className="py-3 px-4 text-center text-slate-600">{row.starter}</td>
                    <td className="py-3 px-4 text-center text-blue-600 font-medium">{row.pro}</td>
                    <td className="py-3 px-4 text-center text-slate-600">{row.enterprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16 sm:px-8 lg:px-12 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto text-center space-y-6">
          <h2 className="text-4xl font-bold">Ready to Get Started?</h2>
          <p className="text-xl text-slate-300">All features available in free trial. No credit card required.</p>
          <Link href="/signup" className="inline-block px-8 py-3 bg-blue-600 font-bold rounded-lg hover:bg-blue-700">
            Start Free Trial
          </Link>
        </div>
      </section>
    </div>
  );
};

export default FeaturesDetailPage;
