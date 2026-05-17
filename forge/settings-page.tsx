import React from 'react';

interface SettingsState {
  activeTab: 'account' | 'billing' | 'notifications' | 'api-keys';
  formData: {
    fullName: string;
    email: string;
    company: string;
    timezone: string;
    theme: 'light' | 'dark' | 'system';
  };
  billingData: {
    plan: 'starter' | 'pro' | 'enterprise';
    status: 'active' | 'cancelled';
    nextBillingDate: string;
    monthlySpend: number;
  };
  notificationSettings: {
    emailNotifications: boolean;
    slackIntegration: boolean;
    weeklyDigest: boolean;
    agentAlerts: boolean;
  };
  apiKeys: Array<{ id: string; name: string; created: string; lastUsed: string; isActive: boolean }>;
  errors: Record<string, string>;
  successMessage: string;
}

export const SettingsPage: React.FC = () => {
  const [state, setState] = React.useState<SettingsState>({
    activeTab: 'account',
    formData: {
      fullName: 'Scott Chen',
      email: 'goldrusher9009@gmail.com',
      company: 'Forge Labs',
      timezone: 'America/Los_Angeles',
      theme: 'dark',
    },
    billingData: {
      plan: 'pro',
      status: 'active',
      nextBillingDate: '2026-06-04',
      monthlySpend: 299,
    },
    notificationSettings: {
      emailNotifications: true,
      slackIntegration: false,
      weeklyDigest: true,
      agentAlerts: true,
    },
    apiKeys: [
      { id: 'key_1', name: 'Production API', created: '2025-12-01', lastUsed: '2026-05-03', isActive: true },
      { id: 'key_2', name: 'Development API', created: '2026-01-15', lastUsed: '2026-05-02', isActive: true },
      { id: 'key_3', name: 'Testing Key', created: '2026-02-20', lastUsed: '2026-04-15', isActive: false },
    ],
    errors: {},
    successMessage: '',
  });

  const handleFormChange = (field: string, value: any) => {
    setState({
      ...state,
      formData: { ...state.formData, [field]: value },
      errors: { ...state.errors, [field]: '' },
    });
  };

  const handleNotificationChange = (setting: string) => {
    setState({
      ...state,
      notificationSettings: { ...state.notificationSettings, [setting]: !state.notificationSettings[setting as keyof typeof state.notificationSettings] },
    });
  };

  const handleSaveSettings = () => {
    setState({ ...state, successMessage: 'Settings saved successfully!' });
    setTimeout(() => setState({ ...state, successMessage: '' }), 3000);
  };

  const handleUpgradePlan = (newPlan: string) => {
    setState({
      ...state,
      billingData: { ...state.billingData, plan: newPlan as any },
      successMessage: `Upgraded to ${newPlan.toUpperCase()} plan!`,
    });
    setTimeout(() => setState({ ...state, successMessage: '' }), 3000);
  };

  const handleCancelPlan = () => {
    setState({
      ...state,
      billingData: { ...state.billingData, status: 'cancelled' },
      successMessage: 'Plan cancelled. You can reactivate anytime.',
    });
    setTimeout(() => setState({ ...state, successMessage: '' }), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">⚙️ Settings</h1>
          <p className="text-slate-400">Manage your account, billing, and preferences</p>
        </div>

        {/* Success Message */}
        {state.successMessage && (
          <div className="mb-6 p-4 bg-green-900/20 border border-green-500/30 rounded-lg text-green-400 flex items-center gap-3">
            <span className="text-xl">✓</span>
            {state.successMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Sidebar Tabs */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 rounded-lg p-4 space-y-2 sticky top-24">
              {[
                { id: 'account', label: 'Account', icon: '👤' },
                { id: 'billing', label: 'Billing', icon: '💳' },
                { id: 'notifications', label: 'Notifications', icon: '🔔' },
                { id: 'api-keys', label: 'API Keys', icon: '🔑' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setState({ ...state, activeTab: tab.id as any })}
                  className={`w-full text-left px-4 py-3 rounded-lg transition font-medium flex items-center gap-3 ${
                    state.activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-4">
            {/* Account Settings */}
            {state.activeTab === 'account' && (
              <div className="bg-slate-800/50 rounded-lg p-8 space-y-6">
                <h2 className="text-2xl font-bold text-white mb-6">Account Settings</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={state.formData.fullName}
                      onChange={(e) => handleFormChange('fullName', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={state.formData.email}
                      onChange={(e) => handleFormChange('email', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Company</label>
                    <input
                      type="text"
                      value={state.formData.company}
                      onChange={(e) => handleFormChange('company', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                      placeholder="Company name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Timezone</label>
                    <select
                      value={state.formData.timezone}
                      onChange={(e) => handleFormChange('timezone', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                    >
                      <option>America/Los_Angeles</option>
                      <option>America/Denver</option>
                      <option>America/Chicago</option>
                      <option>America/New_York</option>
                      <option>Europe/London</option>
                      <option>Europe/Paris</option>
                      <option>Asia/Tokyo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Theme</label>
                    <div className="flex gap-4">
                      {['light', 'dark', 'system'].map((theme) => (
                        <label key={theme} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="theme"
                            value={theme}
                            checked={state.formData.theme === theme}
                            onChange={(e) => handleFormChange('theme', e.target.value)}
                            className="w-4 h-4 rounded-full"
                          />
                          <span className="text-sm text-slate-300 capitalize">{theme}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSaveSettings}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition flex items-center justify-center gap-2 mt-6"
                >
                  💾 Save Changes
                </button>
              </div>
            )}

            {/* Billing Settings */}
            {state.activeTab === 'billing' && (
              <div className="bg-slate-800/50 rounded-lg p-8 space-y-6">
                <h2 className="text-2xl font-bold text-white mb-6">Billing & Subscription</h2>

                {/* Current Plan */}
                <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-slate-400">Current Plan</p>
                      <p className="text-2xl font-bold text-white capitalize">{state.billingData.plan} Plan</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-400">Status</p>
                      <p className={`text-lg font-semibold ${state.billingData.status === 'active' ? 'text-green-400' : 'text-red-400'}`}>
                        {state.billingData.status === 'active' ? '✓ Active' : '✗ Cancelled'}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-400">Next billing date: {state.billingData.nextBillingDate}</p>
                  <p className="text-sm text-slate-400">Monthly spend: ${state.billingData.monthlySpend}</p>
                </div>

                {/* Plan Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { name: 'starter', price: 99, features: ['Up to 5 agents', '100K API calls', 'Basic analytics'] },
                    { name: 'pro', price: 299, features: ['Unlimited agents', '1M API calls', 'Advanced analytics', 'Priority support'] },
                    { name: 'enterprise', price: 'Custom', features: ['Everything in Pro', 'Custom integrations', 'Dedicated support', 'SLA guarantee'] },
                  ].map((plan) => (
                    <div key={plan.name} className={`p-6 rounded-lg border transition ${
                      state.billingData.plan === plan.name
                        ? 'bg-blue-600/20 border-blue-500'
                        : 'bg-slate-700/30 border-slate-600 hover:border-slate-500'
                    }`}>
                      <h3 className="text-lg font-semibold text-white capitalize mb-2">{plan.name}</h3>
                      <p className="text-2xl font-bold text-white mb-4">
                        {typeof plan.price === 'number' ? `$${plan.price}` : plan.price}
                        {typeof plan.price === 'number' && <span className="text-sm text-slate-400">/month</span>}
                      </p>
                      <ul className="space-y-2 mb-6">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="text-sm text-slate-300 flex items-center gap-2">
                            <span className="text-green-400">✓</span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                      {state.billingData.plan !== plan.name ? (
                        <button
                          onClick={() => handleUpgradePlan(plan.name)}
                          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition text-sm"
                        >
                          {state.billingData.plan === 'starter' && plan.name === 'pro' ? '⬆️ Upgrade' : 'Switch'}
                        </button>
                      ) : (
                        <p className="text-sm text-green-400 text-center font-medium">✓ Current Plan</p>
                      )}
                    </div>
                  ))}
                </div>

                {state.billingData.status === 'active' && (
                  <button
                    onClick={handleCancelPlan}
                    className="w-full px-4 py-3 bg-red-900/20 hover:bg-red-900/30 text-red-400 border border-red-500/30 font-medium rounded-lg transition"
                  >
                    ✕ Cancel Subscription
                  </button>
                )}
              </div>
            )}

            {/* Notifications */}
            {state.activeTab === 'notifications' && (
              <div className="bg-slate-800/50 rounded-lg p-8 space-y-6">
                <h2 className="text-2xl font-bold text-white mb-6">Notification Preferences</h2>

                <div className="space-y-4">
                  {[
                    { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive updates via email' },
                    { key: 'slackIntegration', label: 'Slack Integration', description: 'Send alerts to your Slack workspace' },
                    { key: 'weeklyDigest', label: 'Weekly Digest', description: 'Get a summary of activity every week' },
                    { key: 'agentAlerts', label: 'Agent Alerts', description: 'Get notified when agents encounter errors' },
                  ].map((notif) => (
                    <div key={notif.key} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                      <div>
                        <p className="font-medium text-white">{notif.label}</p>
                        <p className="text-sm text-slate-400">{notif.description}</p>
                      </div>
                      <button
                        onClick={() => handleNotificationChange(notif.key)}
                        className={`relative w-14 h-8 rounded-full transition ${
                          state.notificationSettings[notif.key as keyof typeof state.notificationSettings]
                            ? 'bg-blue-600'
                            : 'bg-slate-600'
                        }`}
                      >
                        <span
                          className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition transform ${
                            state.notificationSettings[notif.key as keyof typeof state.notificationSettings] ? 'translate-x-6' : ''
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleSaveSettings}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
                >
                  💾 Save Preferences
                </button>
              </div>
            )}

            {/* API Keys */}
            {state.activeTab === 'api-keys' && (
              <div className="bg-slate-800/50 rounded-lg p-8 space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">API Keys</h2>
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition text-sm">
                    + Create New
                  </button>
                </div>

                <div className="space-y-4">
                  {state.apiKeys.map((key) => (
                    <div key={key.id} className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium text-white">{key.name}</p>
                          <p className="text-xs text-slate-400">Created {key.created}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          key.isActive ? 'bg-green-900/30 text-green-400' : 'bg-gray-900/30 text-gray-400'
                        }`}>
                          {key.isActive ? '✓ Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mb-3">Last used: {key.lastUsed}</p>
                      <div className="flex gap-2">
                        <button className="flex-1 px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white font-medium rounded text-xs transition">
                          👁️ View
                        </button>
                        <button className="flex-1 px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white font-medium rounded text-xs transition">
                          📋 Copy
                        </button>
                        <button className="flex-1 px-3 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 font-medium rounded text-xs transition">
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
