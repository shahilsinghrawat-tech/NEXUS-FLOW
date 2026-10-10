// File: frontend/src/app/layout.tsx
import './globals.css';
import { Outfit } from 'next/font/google';
import { Providers } from './providers';
import ThemeToggle from '@/components/ThemeToggle';
import Sidebar from '@/components/Sidebar';
import { Search } from 'lucide-react';

const outfit = Outfit({ subsets: ['latin'], display: 'swap' });

export const metadata = {
  title: 'Nexus AI Control Tower',
  description: 'AI-driven supply chain exception management',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.className} bg-[#f0f4f9] dark:bg-[#131314] text-gray-900 dark:text-gray-100 min-h-screen flex transition-colors duration-300`}>
        <Providers>
          
          {/* Interactive Client-Side Sidebar */}
          <Sidebar />

          {/* Main Content Area */}
          <main className="flex-1 flex flex-col h-screen overflow-hidden">
            
            {/* Global Header with Light/Dark Mode Toggle */}
            <header className="h-20 px-8 flex items-center justify-between">
              <div className="flex items-center bg-white dark:bg-[#1e1f20] rounded-full px-4 py-2.5 w-[450px] shadow-sm dark:shadow-none transition-colors border border-transparent dark:border-gray-800/50">
                <Search className="w-5 h-5 text-gray-400 mr-3 shrink-0" strokeWidth={1.5} />
                <input 
                  type="text" 
                  placeholder="Ask Nexus AI to search operations..." 
                  className="bg-transparent border-none outline-none text-base w-full text-gray-800 dark:text-gray-200 placeholder-gray-400"
                />
              </div>
              
              <div className="flex items-center gap-5">
                <ThemeToggle />
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-md">
                  SP
                </div>
              </div>
            </header>
            
            {/* Scrollable Dashboard Viewport */}
            <div className="p-8 overflow-y-auto flex-1 pb-24">
              {children}
            </div>

          </main>
        </Providers>
      </body>
    </html>
  );
}