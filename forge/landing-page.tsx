/**
 * Forge AI - Landing Page
 * Public-facing homepage showcasing platform capabilities and value proposition
 */

import React, { useState } from 'react';
import { Button } from './components-showcase';

// ============================================================================
// SECTION 1: HERO SECTION
// ============================================================================

interface HeroSectionProps {
  onGetStartedClick?: () => void;
  onDemoClick?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onGetStartedClick,
  onDemoClick,
}) => {
  return (
    <section className="relative min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      {/* Background animation elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-32 flex items-center justify-center min-h-screen flex-col">
        <div className="text-center space-y-6 mb-12">
          <h1 className="text-6xl md:text-7xl font-bold leading-tight">
            Your AI Infrastructure,
            <br />
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Fully Autonomous
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Deploy, monitor, and scale AI agents without the infrastructure headache. 
            Forge handles the complexity so you focus on innovation.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button 
              variant="primary" 
              size="lg"
              onClick={onGetStartedClick}
            >
              Get Started Free
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={onDemoClick}
            >
              Watch Demo
            </Button>
          </div>

          {/* Social proof */}
          <div className="pt-8">
            <p className="text-sm text-gray-400 mb-3">Trusted by forward-thinking teams</p>
            <div className="flex gap-6 justify-center items-center flex-wrap">
              {['TechCorp', 'InnovateLabs', 'FutureAI', 'DataFlow'].map((company) => (
                <span key={company} className="text-gray-500 font-medium">
                  {company}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Hero visualization placeholder */}
        <div className="w-full mt-16 aspect-video bg-gradient-to-b from-purple-500/20 to-transparent rounded-2xl border border-purple-500/30 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-purple-600/30 border border-purple-500/50 flex items-center justify-center">
              <span className="text-2xl">⚙️</span>
            </div>
            <p className="text-gray-400">AI Agent Orchestration Visualization</p>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    </section>
  );
};

// ============================================================================
// SECTION 2: FEATURES OVERVIEW
// ============================================================================

interface Feature {
  icon: string;
  title: string;
  description: string;
  learnMore?: string;
}

const FEATURES: Feature[] = [
  {
    icon: '🚀',
    title: 'Deploy Instantly',
    description: 'Get your AI agents running in minutes, not months. Pre-configured infrastructure handles scaling automatically.',
    learnMore: '#features',
  },
  {
    icon: '📊',
    title: 'Real-time Monitoring',
    description: 'Track agent performance, logs, and metrics in a beautiful dashboard. Spot issues before they become problems.',
    learnMore: '#features',
  },
  {
    icon: '🔄',
    title: 'Seamless Integration',
    description: 'Connect to your existing APIs, databases, and services. No vendor lock-in, full control.',
    learnMore: '#features',
  },
  {
    icon: '🛡️',
    title: 'Enterprise Security',
    description: 'Bank-level encryption, audit trails, and compliance frameworks. Your data, your rules.',
    learnMore: '#features',
  },
  {
    icon: '⚡',
    title: 'Auto-Scaling',
    description: 'Handle millions of requests without manual intervention. Performance at any scale.',
    learnMore: '#features',
  },
  {
    icon: '🤖',
    title: 'Agent Orchestration',
    description: 'Coordinate multiple agents, manage dependencies, and optimize workflows automatically.',
    learnMore: '#features',
  },
];

export const FeaturesOverview: React.FC = () => {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Everything You Need for AI Success
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Built with the hard-earned lessons from thousands of production deployments
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map((feature, idx) => (
            <div
              key={idx}
              className="p-8 rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300 group cursor-pointer"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                {feature.description}
              </p>
              {feature.learnMore && (
                <a
                  href={feature.learnMore}
                  className="inline-flex items-center gap-2 text-purple-600 font-semibold hover:gap-3 transition-all"
                >
                  Learn More
                  <span>→</span>
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ============================================================================
// SECTION 3: HOW IT WORKS
// ============================================================================

interface Step {
  number: number;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    number: 1,
    title: 'Define Your Agent',
    description: 'Specify agent behavior, capabilities, and constraints in simple YAML or Python.',
  },
  {
    number: 2,
    title: 'Connect Your Tools',
    description: 'Link to APIs, databases, and services your agent needs to operate.',
  },
  {
    number: 3,
    title: 'Deploy & Test',
    description: 'Push to production with one click. Test in sandbox mode before going live.',
  },
  {
    number: 4,
    title: 'Monitor & Optimize',
    description: 'Watch your agent perform in real-time. Get AI-powered optimization suggestions.',
  },
  {
    number: 5,
    title: 'Scale Confidently',
    description: 'Serve millions of requests. Forge handles infrastructure scaling automatically.',
  },
];

export const HowItWorks: React.FC = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Five simple steps from idea to production AI
          </p>
        </div>

        <div className="space-y-8">
          {STEPS.map((step) => (
            <div key={step.number} className="flex gap-8 items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-gradient-primary text-white font-bold text-xl">
                  {step.number}
                </div>
              </div>
              <div className="flex-1 pt-2">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-lg text-gray-600">
                  {step.description}
                </p>
              </div>
              {step.number < STEPS.length && (
                <div className="hidden lg:block absolute left-1/2 transform -translate-x-1/2 w-1 h-12 bg-gradient-to-b from-purple-400 to-transparent -mb-8"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ============================================================================
// SECTION 4: PRICING TIERS
// ============================================================================

interface PricingTier {
  name: string;
  price: number;
  description: string;
  features: string[];
  isPopular?: boolean;
  cta: string;
}

const PRICING_TIERS: PricingTier[] = [
  {
    name: 'Starter',
    price: 29,
    description: 'Perfect for individuals and small projects',
    features: [
      'Up to 3 agents',
      '1M API calls/month',
      'Community support',
      'Basic monitoring',
      'Standard security',
    ],
    cta: 'Get Started',
  },
  {
    name: 'Professional',
    price: 99,
    description: 'For teams building production AI systems',
    features: [
      'Unlimited agents',
      '50M API calls/month',
      'Priority support',
      'Advanced monitoring & alerts',
      'Team collaboration',
      'Custom integrations',
      'SLA guarantee',
    ],
    isPopular: true,
    cta: 'Start Free Trial',
  },
  {
    name: 'Enterprise',
    price: 0,
    description: 'Custom solutions for large-scale deployments',
    features: [
      'Unlimited everything',
      'Dedicated support team',
      'Custom SLA',
      'On-premise deployment',
      'Advanced compliance',
      'Technical onboarding',
    ],
    cta: 'Contact Sales',
  },
];

interface PricingState {
  isYearly: boolean;
}

export const PricingSection: React.FC = () => {
  const [state, setState] = useState<PricingState>({ isYearly: false });

  const getPrice = (basePrice: number) => {
    if (basePrice === 0) return 'Custom';
    return `$${state.isYearly ? Math.floor(basePrice * 12 * 0.2) : basePrice}`;
  };

  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Start free, scale as you grow. No surprise charges.
          </p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={state.isYearly ? 'text-gray-600' : 'text-gray-900 font-semibold'}>
              Monthly
            </span>
            <button
              onClick={() => setState(s => ({ ...s, isYearly: !s.isYearly }))}
              className="relative inline-flex h-8 w-14 items-center rounded-full bg-gray-300 transition-colors focus:outline-none"
            >
              <span
                className={`${
                  state.isYearly ? 'translate-x-7' : 'translate-x-1'
                } inline-block h-6 w-6 transform rounded-full bg-white transition-transform`}
              />
            </button>
            <span className={state.isYearly ? 'text-gray-900 font-semibold' : 'text-gray-600'}>
              Yearly
              <span className="text-sm text-green-600 font-semibold ml-2">(20% off)</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-2xl p-8 transition-all duration-300 ${
                tier.isPopular
                  ? 'border-2 border-purple-600 shadow-2xl scale-105 bg-purple-50'
                  : 'border border-gray-200 bg-white hover:shadow-lg'
              }`}
            >
              {tier.isPopular && (
                <div className="inline-block bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-semibold mb-4">
                  Most Popular
                </div>
              )}

              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {tier.name}
              </h3>
              <p className="text-gray-600 mb-6 text-sm">
                {tier.description}
              </p>

              <div className="mb-6">
                <span className="text-5xl font-bold text-gray-900">
                  {getPrice(tier.price)}
                </span>
                {tier.price > 0 && (
                  <span className="text-gray-600 ml-2">
                    /{state.isYearly ? 'year' : 'month'}
                  </span>
                )}
              </div>

              <Button
                variant={tier.isPopular ? 'primary' : 'outline'}
                size="md"
                className="w-full mb-8"
              >
                {tier.cta}
              </Button>

              <div className="space-y-4">
                {tier.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="text-green-600 font-bold text-lg mt-1">✓</span>
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ============================================================================
// SECTION 5: TESTIMONIALS
// ============================================================================

interface Testimonial {
  avatar: string;
  name: string;
  role: string;
  company: string;
  content: string;
  rating: number;
}

const TESTIMONIALS: Testimonial[] = [
  {
    avatar: '👨‍💼',
    name: 'Alex Chen',
    role: 'CTO',
    company: 'TechCorp AI',
    content: 'Forge reduced our AI deployment time from weeks to days. The monitoring dashboard alone saved us countless debugging sessions.',
    rating: 5,
  },
  {
    avatar: '👩‍💻',
    name: 'Sarah Rodriguez',
    role: 'Engineering Lead',
    company: 'InnovateLabs',
    content: 'Finally, AI infrastructure that doesn\'t require a PhD. The developer experience is incredible, and scaling is truly automatic.',
    rating: 5,
  },
  {
    avatar: '👨‍🔬',
    name: 'James Park',
    role: 'Founder',
    company: 'FutureAI Startup',
    content: 'We went from MVP to production serving 10K daily users in 3 weeks. Forge\'s reliability has been exceptional.',
    rating: 5,
  },
];

export const TestimonialsSection: React.FC = () => {
  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Trusted by Industry Leaders
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            See what teams are building with Forge
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((testimonial, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl p-8 shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <span key={i} className="text-yellow-400">★</span>
                ))}
              </div>

              <p className="text-gray-700 mb-6 leading-relaxed italic">
                "{testimonial.content}"
              </p>

              <div className="flex items-center gap-3">
                <div className="text-3xl">{testimonial.avatar}</div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {testimonial.role}, {testimonial.company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ============================================================================
// SECTION 6: CTA BANNER
// ============================================================================

export const CTABanner: React.FC = () => {
  return (
    <section className="py-16 bg-gradient-primary text-white">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          Ready to Deploy AI at Scale?
        </h2>
        <p className="text-xl mb-8 text-blue-100">
          Join hundreds of teams already using Forge to power their AI infrastructure
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <span>Get started in minutes</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔒</span>
            <span>Enterprise security included</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📞</span>
            <span>Expert support available</span>
          </div>
        </div>

        <Button variant="secondary" size="lg">
          Start Your Free Trial Now
        </Button>
        <p className="text-sm text-blue-200 mt-4">
          No credit card required. 14-day free trial with full access.
        </p>
      </div>
    </section>
  );
};

// ============================================================================
// SECTION 7: FOOTER
// ============================================================================

export const Footer: React.FC = () => {
  const footerLinks = {
    Product: [
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Documentation', href: '/docs' },
      { label: 'API Reference', href: '/docs/api' },
    ],
    Company: [
      { label: 'About', href: '/about' },
      { label: 'Blog', href: '/blog' },
      { label: 'Careers', href: '/careers' },
      { label: 'Contact', href: '/contact' },
    ],
    Legal: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
      { label: 'Security', href: '/security' },
    ],
    Social: [
      { label: 'Twitter', href: 'https://twitter.com/forgeai' },
      { label: 'GitHub', href: 'https://github.com/forgeai' },
      { label: 'LinkedIn', href: 'https://linkedin.com/company/forgeai' },
    ],
  };

  return (
    <footer className="bg-gray-900 text-gray-300 py-16 border-t border-gray-800">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div>
            <h4 className="font-semibold text-white mb-4">Forge</h4>
            <p className="text-sm text-gray-400">
              AI infrastructure for the modern world
            </p>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold text-white mb-4">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm hover:text-white transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">
              © 2026 Forge AI. All rights reserved.
            </p>
            <div className="flex gap-6 mt-4 md:mt-0">
              {['Twitter', 'GitHub', 'LinkedIn'].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  {social}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

// ============================================================================
// MAIN LANDING PAGE COMPONENT
// ============================================================================

export const LandingPage: React.FC = () => {
  const handleGetStarted = () => {
    console.log('Get Started clicked');
    // Navigate to signup
  };

  const handleViewDemo = () => {
    console.log('Demo clicked');
    // Open demo video or redirect to demo page
  };

  return (
    <main className="min-h-screen">
      <HeroSection
        onGetStartedClick={handleGetStarted}
        onDemoClick={handleViewDemo}
      />
      <FeaturesOverview />
      <HowItWorks />
      <PricingSection />
      <TestimonialsSection />
      <CTABanner />
      <Footer />
    </main>
  );
};

export default LandingPage;
