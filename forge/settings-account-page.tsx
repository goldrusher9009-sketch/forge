'use client';

import React, { useState } from 'react';
import { COLORS, SPACING, TYPOGRAPHY } from './components-showcase';

// TypeScript Interfaces
interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string;
  phone: string;
  company: string;
  timezone: string;
  language: string;
}

interface SettingsState {
  activeTab: 'profile' | 'security' | 'notifications' | 'billing' | 'api' | 'danger';
  isSaving: boolean;
  saveSuccess: boolean;
  showPasswordModal: boolean;
  showDeleteModal: boolean;
}

// Sample User Data
const SAMPLE_USER: UserProfile = {
  id: 'user-001',
  email: 'goldrusher9009@gmail.com',
  firstName: 'Scott',
  lastName: 'Developer',
  avatar: '👨‍💻',
  phone: '+1 (555) 123-4567',
  company: 'Tech Innovations Inc',
  timezone: 'America/Los_Angeles',
  language: 'English',
};

// Settings Tab Button
const TabButton: React.FC<{
  label: string;
  isActive: boolean;
  onClick: () => void;
  icon: string;
}> = ({ label, isActive, onClick, icon }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
        isActive
          ? 'bg-purple-100 text-purple-700'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      <span className="text-lg">{icon}</span>
      {label}
    </button>
  );
};

// Profile Settings Tab
const ProfileTab: React.FC<{ user: UserProfile; onSave: () => void }> = ({
  user,
  onSave,
}) => {
  const [profile, setProfile] = useState(user);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>

        {/* Avatar Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="text-6xl">{profile.avatar}</div>
            <div>
              <p className="text-sm font-medium text-gray-700">Profile Photo</p>
              <p className="text-xs text-gray-500 mt-1">JPG, PNG up to 10MB</p>
              <button className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">
                Change Photo
              </button>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Name
            </label>
            <input
              type="text"
              value={profile.firstName}
              onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Name
            </label>
            <input
              type="text"
              value={profile.lastName}
              onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            value={profile.phone}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company
          </label>
          <input
            type="text"
            value={profile.company}
            onChange={(e) => setProfile({ ...profile, company: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timezone
            </label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Language
            </label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
              <option>English</option>
              <option>Spanish</option>
              <option>French</option>
              <option>German</option>
              <option>Japanese</option>
              <option>Chinese</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
        <button className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50">
          Cancel
        </button>
        <button
          onClick={onSave}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

// Security Settings Tab
const SecurityTab: React.FC<{ onChangePassword: () => void }> = ({
  onChangePassword,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Security</h3>

        {/* Password Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium text-gray-900">Password</p>
              <p className="text-sm text-gray-500 mt-1">Last changed 3 months ago</p>
            </div>
            <button
              onClick={onChangePassword}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
            >
              Change Password
            </button>
          </div>
        </div>

        {/* Two-Factor Authentication */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium text-gray-900">Two-Factor Authentication</p>
              <p className="text-sm text-gray-500 mt-1">Add an extra layer of security</p>
            </div>
            <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              Enabled
            </div>
          </div>
        </div>

        {/* Active Sessions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="font-medium text-gray-900 mb-4">Active Sessions</p>
          <div className="space-y-3">
            <div className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 text-sm">MacBook Pro</p>
                <p className="text-xs text-gray-500">Safari • Los Angeles, CA</p>
                <p className="text-xs text-gray-400 mt-1">Current session</p>
              </div>
              <button className="text-red-600 text-xs font-medium hover:text-red-700">
                Sign Out
              </button>
            </div>

            <div className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 text-sm">iPhone 14</p>
                <p className="text-xs text-gray-500">Safari • Los Angeles, CA</p>
                <p className="text-xs text-gray-400 mt-1">Last active 2 days ago</p>
              </div>
              <button className="text-red-600 text-xs font-medium hover:text-red-700">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Notifications Settings Tab
const NotificationsTab: React.FC = () => {
  const [notifications, setNotifications] = useState({
    emailUpdates: true,
    emailReports: true,
    emailSecurity: true,
    smsAlerts: false,
    inAppNotifications: true,
    digestEmail: true,
  });

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>

        {/* Email Notifications */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <p className="font-medium text-gray-900 mb-4">Email Notifications</p>
          <div className="space-y-3">
            {[
              { key: 'emailUpdates', label: 'Project Updates', desc: 'Notify about new projects and tasks' },
              { key: 'emailReports', label: 'Weekly Reports', desc: 'Receive weekly performance reports' },
              { key: 'emailSecurity', label: 'Security Alerts', desc: 'Important security-related messages' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
                <button
                  onClick={() => toggleNotification(item.key as keyof typeof notifications)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications[item.key as keyof typeof notifications]
                      ? 'bg-purple-600'
                      : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications[item.key as keyof typeof notifications]
                        ? 'translate-x-6'
                        : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* SMS & Push Notifications */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="font-medium text-gray-900 mb-4">Other Notifications</p>
          <div className="space-y-3">
            {[
              { key: 'smsAlerts', label: 'SMS Alerts', desc: 'Urgent notifications via text message' },
              { key: 'inAppNotifications', label: 'In-App Notifications', desc: 'Show notifications in the app' },
              { key: 'digestEmail', label: 'Digest Email', desc: 'Daily or weekly digest summary' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
                <button
                  onClick={() => toggleNotification(item.key as keyof typeof notifications)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications[item.key as keyof typeof notifications]
                      ? 'bg-purple-600'
                      : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications[item.key as keyof typeof notifications]
                        ? 'translate-x-6'
                        : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Change Password Modal
const ChangePasswordModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              placeholder="Enter current password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              placeholder="Enter new password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-2">
              At least 8 characters with uppercase, lowercase, and numbers
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              placeholder="Confirm new password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700"
            >
              Update Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Settings Header
const SettingsHeader: React.FC = () => {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
      <p className="text-gray-500 mt-2">Manage your account and preferences</p>
    </div>
  );
};

// Main Component
export default function SettingsAccountPage() {
  const [state, setState] = useState<SettingsState>({
    activeTab: 'profile',
    isSaving: false,
    saveSuccess: false,
    showPasswordModal: false,
    showDeleteModal: false,
  });

  const handleSave = () => {
    setState({ ...state, isSaving: true });
    setTimeout(() => {
      setState({ ...state, isSaving: false, saveSuccess: true });
      setTimeout(() => {
        setState({ ...state, saveSuccess: false });
      }, 3000);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <SettingsHeader />

        {/* Success Message */}
        {state.saveSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 font-medium text-sm">
              ✓ Settings saved successfully
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="bg-white rounded-lg border border-gray-200 p-3 space-y-2">
              <TabButton
                label="Profile"
                icon="👤"
                isActive={state.activeTab === 'profile'}
                onClick={() => setState({ ...state, activeTab: 'profile' })}
              />
              <TabButton
                label="Security"
                icon="🔒"
                isActive={state.activeTab === 'security'}
                onClick={() => setState({ ...state, activeTab: 'security' })}
              />
              <TabButton
                label="Notifications"
                icon="🔔"
                isActive={state.activeTab === 'notifications'}
                onClick={() => setState({ ...state, activeTab: 'notifications' })}
              />
              <TabButton
                label="Billing"
                icon="💳"
                isActive={state.activeTab === 'billing'}
                onClick={() => setState({ ...state, activeTab: 'billing' })}
              />
              <TabButton
                label="API Keys"
                icon="🔑"
                isActive={state.activeTab === 'api'}
                onClick={() => setState({ ...state, activeTab: 'api' })}
              />
              <TabButton
                label="Danger Zone"
                icon="⚠️"
                isActive={state.activeTab === 'danger'}
                onClick={() => setState({ ...state, activeTab: 'danger' })}
              />
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 bg-white rounded-lg border border-gray-200 p-8">
            {state.activeTab === 'profile' && (
              <ProfileTab user={SAMPLE_USER} onSave={handleSave} />
            )}
            {state.activeTab === 'security' && (
              <SecurityTab
                onChangePassword={() =>
                  setState({ ...state, showPasswordModal: true })
                }
              />
            )}
            {state.activeTab === 'notifications' && <NotificationsTab />}
          </div>
        </div>
      </div>

      {/* Modals */}
      {state.showPasswordModal && (
        <ChangePasswordModal
          onClose={() => setState({ ...state, showPasswordModal: false })}
        />
      )}
    </div>
  );
}
