'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  BarChart3, 
  FileText, 
  Settings, 
  Zap,
  Library,
  Home,
  MessageSquare,
  Lightbulb
} from 'lucide-react';

const navigation = [
  { name: 'Idea Mission', href: '/idea-mission', icon: Lightbulb },
  { name: 'Research', href: '/research', icon: FileText },
  { name: 'Documents', href: '/documents', icon: Library },
  { name: 'Dashboard', href: '/dashboard', icon: Home },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-2 p-4">
      {navigation.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}