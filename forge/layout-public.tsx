import React from 'react';
import Link from 'next/link';

interface LayoutProps {
  children: React.ReactNode;
}

const PublicLayout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="px-6 py-4 sm:px-8 lg:px-12 max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-blue-600 flex items-center gap-2">
            ⚡ Forge
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/features" className="text-slate-600 hover:text-slate-900 font-medium">Features</Link>
            <Link href="/about" className="text-slate-600 hover:text-slate-900 font-medium">About</Link>
            <Link href="/docs" className="text-slate-600 hover:text-slate-900 font-medium">Docs</Link>
            <Link href="/blog" className="text-slate-600 hover:text-slate-900 font-medium">Blog</Link>
            <Link href="/contact" className="text-slate-600 hover:text-slate-900 font-medium">Contact</Link>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 text-blue-600 font-medium hover:text-blue-700">
              Login
            </Link>
            <Link href="/signup" className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700">
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white">
        <div className="px-6 py-16 sm:px-8 lg:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8 mb-12">
              {/* Brand */}
              <div>
                <div className="text-2xl font-bold mb-4">⚡ Forge</div>
                <p className="text-slate-400 text-sm">Build, deploy, and scale AI agents.</p>
              </div>

              {/* Product */}
              <div>
                <h3 className="font-bold mb-4">Product</h3>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li><Link href="/features" className="hover:text-white">Features</Link></li>
                  <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                  <li><Link href="/docs" className="hover:text-white">Documentation</Link></li>
                  <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
                </ul>
              </div>

              {/* Company */}
              <div>
                <h3 className="font-bold mb-4">Company</h3>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li><Link href="/about" className="hover:text-white">About</Link></li>
                  <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                  <li><Link href="/careers" className="hover:text-white">Careers</Link></li>
                  <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
                </ul>
              </div>

              {/* Connect */}
              <div>
                <h3 className="font-bold mb-4">Connect</h3>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li><a href="#" className="hover:text-white">Twitter</a></li>
                  <li><a href="#" className="hover:text-white">GitHub</a></li>
                  <li><a href="#" className="hover:text-white">Discord</a></li>
                  <li><a href="mailto:hello@forge.ai" className="hover:text-white">Email</a></li>
                </ul>
              </div>
            </div>

            {/* Bottom */}
            <div className="border-t border-slate-800 pt-8">
              <p className="text-slate-400 text-sm">© 2024 Forge AI. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
