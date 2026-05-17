import React from 'react';
import Link from 'next/link';

interface TeamMember {
  name: string;
  role: string;
  bio: string;
  avatar: string;
}

const AboutPage: React.FC = () => {
  const teamMembers: TeamMember[] = [
    {
      name: 'Sarah Chen',
      role: 'CEO & Co-founder',
      bio: 'Former VP of Product at TechCorp. Passionate about AI accessibility.',
      avatar: '👨‍💼'
    },
    {
      name: 'Alex Rodriguez',
      role: 'CTO & Co-founder',
      bio: 'ML engineer with 15+ years experience. Built systems for 10M+ users.',
      avatar: '👨‍💻'
    },
    {
      name: 'Jordan Smith',
      role: 'VP of Product',
      bio: 'Product leader focused on user-centric design and market fit.',
      avatar: '👩‍🔬'
    },
    {
      name: 'Maya Patel',
      role: 'VP of Engineering',
      bio: 'Infrastructure expert. Loves solving scalability challenges.',
      avatar: '🧑‍🔧'
    }
  ];

  const stats = [
    { number: '500+', label: 'Active Projects' },
    { number: '50K+', label: 'Agents Deployed' },
    { number: '99.9%', label: 'Uptime SLA' },
    { number: '40+', label: 'Countries' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="px-6 py-20 sm:px-8 lg:px-12 max-w-6xl mx-auto">
        <div className="text-center space-y-6">
          <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 leading-tight">
            We're Building the Future of AI Agents
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Forge empowers teams to create, deploy, and scale AI agents that actually get work done. We're making autonomous AI accessible to everyone.
          </p>
        </div>
      </section>

      {/* Mission, Vision, Values */}
      <section className="px-6 py-16 sm:px-8 lg:px-12 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">Our Foundation</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Mission */}
            <div className="bg-white rounded-lg p-8 border border-slate-200 hover:shadow-lg transition">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Our Mission</h3>
              <p className="text-slate-600">
                Democratize AI agent development so teams of any size can build intelligent automation that multiplies productivity.
              </p>
            </div>

            {/* Vision */}
            <div className="bg-white rounded-lg p-8 border border-slate-200 hover:shadow-lg transition">
              <div className="text-4xl mb-4">💡</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Our Vision</h3>
              <p className="text-slate-600">
                A world where intelligent AI agents handle routine work, freeing humans to focus on creativity and strategy.
              </p>
            </div>

            {/* Values */}
            <div className="bg-white rounded-lg p-8 border border-slate-200 hover:shadow-lg transition">
              <div className="text-4xl mb-4">✨</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Our Values</h3>
              <p className="text-slate-600">
                Transparency, reliability, and user-first thinking guide every decision we make.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Company Story */}
      <section className="px-6 py-16 sm:px-8 lg:px-12 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-slate-900 mb-8">Our Story</h2>
        <div className="space-y-6 text-lg text-slate-600 leading-relaxed">
          <p>
            Founded in 2024, Forge was born from a simple observation: building AI agents shouldn't require a PhD in machine learning. Sarah and Alex met at a conference frustrated with existing tools and decided to build something better.
          </p>
          <p>
            What started as a weekend project quickly gained traction. Early users in the startup and enterprise space loved how intuitive and powerful the platform was. Within months, we went from zero to hundreds of active projects using Forge to automate everything from customer support to data analysis.
          </p>
          <p>
            Today, teams across 40+ countries use Forge daily to deploy AI agents that handle millions of tasks. We're just getting started.
          </p>
        </div>
      </section>

      {/* Leadership Team */}
      <section className="px-6 py-16 sm:px-8 lg:px-12 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">Meet the Team</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamMembers.map((member) => (
              <div key={member.name} className="bg-white rounded-lg p-6 border border-slate-200 text-center hover:shadow-lg transition">
                <div className="text-5xl mb-4">{member.avatar}</div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">{member.name}</h3>
                <p className="text-sm font-medium text-blue-600 mb-3">{member.role}</p>
                <p className="text-sm text-slate-600">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="px-6 py-16 sm:px-8 lg:px-12 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2">{stat.number}</div>
              <div className="text-slate-600 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-16 sm:px-8 lg:px-12 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-6xl mx-auto text-center space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-white mb-4">Ready to Transform Your Workflows?</h2>
            <p className="text-xl text-blue-100">Join hundreds of teams using Forge to build AI agents.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="px-8 py-3 bg-white text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition inline-block">
              Get Started Free
            </Link>
            <Link href="/features" className="px-8 py-3 border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transition inline-block">
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
