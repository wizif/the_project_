'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, FileText, FolderKanban, UsersIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function AdminNav() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setIsAdmin(user.role === 'admin');
    }
  }, []);

  if (!isAdmin) return null;

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/projects', label: 'Projects', icon: FolderKanban },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/teams', label: 'Teams', icon: UsersIcon }, // ✅ FIXED: Teams route
    { href: '/admin/audit-logs', label: 'Audit Logs', icon: FileText },
  ];

  return (
    <nav className="bg-white shadow-sm border-b dark:bg-gray-800 dark:border-gray-700"> {/* ✅ ADDED: Dark mode */}
      <div className="max-w-8xl mx-auto px-4">
        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  isActive
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400' // ✅ ADDED: Dark mode active
                    : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white' // ✅ ADDED: Dark mode hover
                }`}
              >
                <Icon size={18} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
