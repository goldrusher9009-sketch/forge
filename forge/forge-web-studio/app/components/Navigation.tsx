import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { classNames } from '@/lib/utils';

const navItems = [
  { name: 'Dashboard', href: '/' },
  { name: 'Agents', href: '/agents' },
  { name: 'Workflows', href: '/workflows' },
  { name: 'Queue', href: '/queue' },
  { name: 'History', href: '/history' },
];

export const Navigation: React.FC = () => {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-blue-600">Forge</h1>
            </div>
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                {navItems.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={classNames(
                      'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      pathname === item.href
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors">
              <span className="text-sm font-medium">Settings</span>
            </button>
            <button className="p-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors">
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
