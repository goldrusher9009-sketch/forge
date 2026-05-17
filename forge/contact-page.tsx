import React, { useState } from 'react';

interface ContactFormState {
  name: string;
  email: string;
  subject: string;
  message: string;
  category: string;
  submitted: boolean;
  isSubmitting: boolean;
  errors: Record<string, string>;
}

const ContactPage: React.FC = () => {
  const [state, setState] = useState<ContactFormState>({
    name: '',
    email: '',
    subject: '',
    message: '',
    category: 'general',
    submitted: false,
    isSubmitting: false,
    errors: {}
  });

  const categories = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'support', label: 'Technical Support' },
    { value: 'sales', label: 'Sales & Pricing' },
    { value: 'partnership', label: 'Partnership' },
    { value: 'feedback', label: 'Product Feedback' }
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!state.name.trim()) newErrors.name = 'Name is required';
    if (!state.email.trim()) newErrors.email = 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email)) newErrors.email = 'Invalid email format';
    if (!state.subject.trim()) newErrors.subject = 'Subject is required';
    if (!state.message.trim()) newErrors.message = 'Message is required';
    if (state.message.length < 10) newErrors.message = 'Message must be at least 10 characters';

    setState(prev => ({ ...prev, errors: newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setState(prev => ({ ...prev, isSubmitting: true }));

    // Simulate API call
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        isSubmitting: false,
        submitted: true,
        name: '',
        email: '',
        subject: '',
        message: '',
        category: 'general'
      }));

      // Reset success message after 3 seconds
      setTimeout(() => {
        setState(prev => ({ ...prev, submitted: false }));
      }, 3000);
    }, 800);
  };

  const handleChange = (field: string, value: string) => {
    setState(prev => ({
      ...prev,
      [field]: value,
      errors: { ...prev.errors, [field]: '' }
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero */}
      <section className="px-6 py-16 sm:px-8 lg:px-12 max-w-6xl mx-auto">
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-5xl font-bold text-slate-900">Get in Touch</h1>
          <p className="text-xl text-slate-600">We're here to help. Reach out with any questions or feedback.</p>
        </div>
      </section>

      {/* Contact Grid */}
      <section className="px-6 py-8 sm:px-8 lg:px-12 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* Support */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 text-center">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Support</h3>
            <p className="text-slate-600 mb-4">Get technical help from our team</p>
            <a href="mailto:support@forge.ai" className="text-blue-600 font-medium hover:text-blue-700">
              support@forge.ai
            </a>
          </div>

          {/* Sales */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 text-center">
            <div className="text-4xl mb-4">💼</div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Sales</h3>
            <p className="text-slate-600 mb-4">Discuss pricing and enterprise plans</p>
            <a href="mailto:sales@forge.ai" className="text-blue-600 font-medium hover:text-blue-700">
              sales@forge.ai
            </a>
          </div>

          {/* Partnership */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 text-center">
            <div className="text-4xl mb-4">🤝</div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Partnership</h3>
            <p className="text-slate-600 mb-4">Explore collaboration opportunities</p>
            <a href="mailto:partners@forge.ai" className="text-blue-600 font-medium hover:text-blue-700">
              partners@forge.ai
            </a>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="px-6 py-16 sm:px-8 lg:px-12 bg-white border-t">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-8">Send us a Message</h2>

          {state.submitted && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              ✓ Thank you for your message! We'll get back to you within 24 hours.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Name</label>
              <input
                type="text"
                value={state.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  state.errors.name ? 'border-red-500' : 'border-slate-300'
                }`}
                placeholder="Your name"
              />
              {state.errors.name && <p className="text-red-600 text-sm mt-1">{state.errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Email</label>
              <input
                type="email"
                value={state.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  state.errors.email ? 'border-red-500' : 'border-slate-300'
                }`}
                placeholder="your@email.com"
              />
              {state.errors.email && <p className="text-red-600 text-sm mt-1">{state.errors.email}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Category</label>
              <select
                value={state.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Subject</label>
              <input
                type="text"
                value={state.subject}
                onChange={(e) => handleChange('subject', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  state.errors.subject ? 'border-red-500' : 'border-slate-300'
                }`}
                placeholder="How can we help?"
              />
              {state.errors.subject && <p className="text-red-600 text-sm mt-1">{state.errors.subject}</p>}
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Message</label>
              <textarea
                value={state.message}
                onChange={(e) => handleChange('message', e.target.value)}
                rows={6}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  state.errors.message ? 'border-red-500' : 'border-slate-300'
                }`}
                placeholder="Tell us more about your inquiry..."
              />
              {state.errors.message && <p className="text-red-600 text-sm mt-1">{state.errors.message}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={state.isSubmitting}
              className="w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {state.isSubmitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-6 py-16 sm:px-8 lg:px-12 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { q: 'What is the response time?', a: 'We typically respond to inquiries within 24 hours.' },
              { q: 'Do you offer phone support?', a: 'Phone support is available for enterprise customers.' },
              { q: 'How can I become a partner?', a: 'Email partners@forge.ai to discuss partnership opportunities.' },
              { q: 'What formats do you accept?', a: 'We accept all standard inquiry formats via email and web form.' }
            ].map((item, idx) => (
              <div key={idx} className="bg-white rounded-lg p-6 border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-2">{item.q}</h3>
                <p className="text-slate-600">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
