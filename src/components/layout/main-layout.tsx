'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  FileText,
  Library,
  Home,
  Lightbulb,
} from 'lucide-react';

interface MainLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Idea Mission', href: '/idea-mission', icon: Lightbulb },
  { name: 'Research', href: '/research', icon: FileText },
  { name: 'Documents', href: '/documents', icon: Library },
  { name: 'Dashboard', href: '/dashboard', icon: Home },
];

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Simple Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200">
        <div className="flex h-16 items-center border-b border-gray-200 px-6">
          <h1 className="text-xl font-semibold text-gray-900">AI Research Assistant</h1>
        </div>
        <nav className="flex flex-col gap-1 p-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}