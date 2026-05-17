'use client';

import React from 'react';
import Navigation from './Navigation';

interface LayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children, sidebar }) => {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Navigation />
      <div className="flex flex-1 overflow-hidden">
        {sidebar && (
          <aside className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
            {sidebar}
          </aside>
        )}
        <main className="flex-1 overflow-y-auto">
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
