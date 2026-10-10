// File: frontend/src/components/Sidebar.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, AlertTriangle, Package, ClipboardList, Sparkles, ChevronLeft, Menu } from 'lucide-react';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname();

  return (
    <aside className={`${isOpen ? 'w-72' : 'w-20'} bg-[#f8fafd] dark:bg-[#1e1f20] flex flex-col transition-all duration-300 relative border-r border-transparent dark:border-gray-800/50`}>
      
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -right-3 top-7 bg-white dark:bg-[#333538] border border-gray-200 dark:border-gray-700 rounded-full p-1.5 shadow-sm text-gray-500 dark:text-gray-300 hover:text-blue-500 transition-colors z-10"
      >
        {isOpen ? <ChevronLeft className="w-4 h-4" strokeWidth={2} /> : <Menu className="w-4 h-4" strokeWidth={2} />}
      </button>

      {/* Logo Area */}
      <div className={`p-6 h-20 flex items-center ${isOpen ? 'gap-3' : 'justify-center'} overflow-hidden`}>
        <Sparkles className="w-6 h-6 text-blue-500 shrink-0" strokeWidth={1.5} />
        {isOpen && (
          <h1 className="text-2xl font-medium tracking-wide text-gray-800 dark:text-gray-100 whitespace-nowrap">
            Nexus AI
          </h1>
        )}
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-2 mt-2">
        <NavItem href="/" icon={<Activity strokeWidth={1.5} />} label="Command Center" isOpen={isOpen} active={pathname === '/'} />
        <NavItem href="/incidents" icon={<AlertTriangle strokeWidth={1.5} />} label="Incident History" isOpen={isOpen} active={pathname === '/incidents'} />
        <NavItem href="/inventory" icon={<Package strokeWidth={1.5} />} label="Inventory & Suppliers" isOpen={isOpen} active={pathname === '/inventory'} />
        <NavItem href="/audit" icon={<ClipboardList strokeWidth={1.5} />} label="Audit Trail" isOpen={isOpen} active={pathname === '/audit'} />
      </nav>
    </aside>
  );
}

// Reusable Navigation Item Component
function NavItem({ href, icon, label, isOpen, active }: any) {
  return (
    <Link 
      href={href} 
      className={`flex items-center ${isOpen ? 'justify-start px-4' : 'justify-center px-0'} py-3 rounded-full transition-all ${
        active 
          ? 'bg-blue-100 dark:bg-[#333538] text-blue-700 dark:text-blue-300 font-medium' 
          : 'hover:bg-gray-200 dark:hover:bg-[#2a2b2d] text-gray-700 dark:text-gray-400 font-medium'
      }`}
      title={!isOpen ? label : ''}
    >
      <div className="w-5 h-5 shrink-0 flex items-center justify-center">
        {icon}
      </div>
      {isOpen && <span className="ml-4 whitespace-nowrap">{label}</span>}
    </Link>
  );
}