// File: frontend/src/app/providers.tsx
'use client';

import { ThemeProvider } from 'next-themes';
import { useEffect, useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  
  // Prevent hydration mismatch on first render
  useEffect(() => setMounted(true), []);
  if (!mounted) return <>{children}</>;

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      {children}
    </ThemeProvider>
  );
}