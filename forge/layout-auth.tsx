import React from 'react';
import Link from 'next/link';

interface LayoutAuthProps {
  children: React.ReactNode;
}

export const LayoutAuth: React.FC<LayoutAuthProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: '📊' },
    { label: 'Projects', href: '/projects', icon: '📁' },
    { label: 'Agents', href: '/agents', icon: '🤖' },
    { label: 'Workspace', href: '/workspace', icon: '🏢' },
    { label: 'Settings', href: '/settings', icon: '⚙️' },
  ];

  const footerLinks = [
    {
      title: 'Product',
      links: [
        { label: 'Features', href: '/features' },
        { label: 'Pricing', href: '/pricing' },
        { label: 'Security', href: '/security' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About', href: '/about' },
        { label: 'Blog', href: '/blog' },
        { label: 'Careers', href: '/careers' },
      ],
    },
    {
      title: 'Support',
      links: [
        { label: 'Docs', href: '/docs' },
        { label: 'Contact', href: '/contact' },
        { label: 'Status', href: '/status' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Top Navigation Bar */}
      <nav className="bg-slate-800 border-b border-slate-700 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          {/* Logo and Sidebar Toggle */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden text-slate-300 hover:text-white p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition"
            >
              ☰
            </button>
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <div className="text-2xl">🔧</div>
              <div className="font-bold text-white text-lg hidden sm:inline">Forge</div>
            </Link>
          </div>

          {/* Center Nav (Hidden on mobile) */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-slate-300 hover:text-white text-sm font-medium transition flex items-center gap-2"
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right Side - User Menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition"
            >
              <span className="text-lg">👤</span>
              <span className="hidden sm:inline text-sm font-medium">User</span>
            </button>

            {/* User Dropdown Menu */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-700 border border-slate-600 rounded-lg shadow-lg z-50">
                <div className="px-4 py-3 border-b border-slate-600">
                  <div className="text-sm font-medium text-white">Scott</div>
                  <div className="text-xs text-slate-400">goldrusher9009@gmail.com</div>
                </div>
                <Link
                  href="/settings"
                  className="block px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-600 transition"
                >
                  ⚙️ Settings
                </Link>
                <Link
                  href="/settings?tab=account"
                  className="block px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-600 transition"
                >
                  👤 Account
                </Link>
                <Link
                  href="/settings?tab=billing"
                  className="block px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-600 transition"
                >
                  💳 Billing
                </Link>
                <Link
                  href="/settings?tab=notifications"
                  className="block px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-600 transition"
                >
                  🔔 Notifications
                </Link>
                <div className="border-t border-slate-600">
                  <button className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-slate-600 transition">
                    🚪 Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Nav */}
        {sidebarOpen && (
          <div className="md:hidden px-4 py-4 border-t border-slate-700 flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition flex items-center gap-3"
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 border-t border-slate-700 mt-16">
        <div className="px-4 sm:px-6 lg:px-8 py-12">
          {/* Footer Links Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand Column */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="text-2xl">🔧</div>
                <div className="font-bold text-white">Forge</div>
              </div>
              <p className="text-sm text-slate-400">
                Build, orchestrate, and scale AI agents effortlessly.
              </p>
            </div>

            {/* Footer Sections */}
            {footerLinks.map((section) => (
              <div key={section.title}>
                <h3 className="font-semibold text-white mb-4">{section.title}</h3>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-slate-400 hover:text-white transition"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Footer Bottom */}
          <div className="border-t border-slate-700 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} Forge. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-xs text-slate-400 hover:text-white transition">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-xs text-slate-400 hover:text-white transition">
                Terms of Service
              </Link>
              <div className="flex items-center gap-4">
                <a href="#" className="text-slate-400 hover:text-white transition">
                  𝕏
                </a>
                <a href="#" className="text-slate-400 hover:text-white transition">
                  💼
                </a>
                <a href="#" className="text-slate-400 hover:text-white transition">
                  🐙
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LayoutAuth;
