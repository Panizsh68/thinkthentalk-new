'use client';
import { usePathname } from 'next/navigation';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from '@/components/theme-provider';
import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
import { LanguageProvider, useLanguage } from '@/lib/i18n/language-provider';
import { QueryProvider } from '@/components/query-provider';
import { AuthProvider } from '@/lib/auth/auth-provider';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { initializeFirebase, FirebaseClientProvider } from '@/firebase';

const firebase = initializeFirebase();

function AppShell({ children }: { children: React.ReactNode }) {
  const { language } = useLanguage();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  
  const isAdminRoute = pathname?.startsWith('/admin') ?? false;
  const isDashboardRoute = pathname?.startsWith('/dashboard') ?? false;
  const isProfileRoute = pathname?.startsWith('/profile') ?? false;
  const isWalletRoute = pathname?.startsWith('/wallet') ?? false;
  const isPanelRoute = isAdminRoute || isDashboardRoute || isProfileRoute || isWalletRoute;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const dir = isAdminRoute ? 'ltr' : language === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = isAdminRoute ? 'en' : (language || 'en');
  }, [language, isAdminRoute, mounted]);

  return (
    <div className={cn(
      "flex min-h-screen flex-col",
      !isAdminRoute && language === 'fa' && "font-vazir"
    )}>
      {!isPanelRoute && <AppHeader />}
      <main id="main-content" className="flex-grow">
        {children}
      </main>
      {!isPanelRoute && <AppFooter />}
      <Toaster />
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Think Then Talk Community</title>
        <meta name="description" content="An event platform for thoughtful conversations." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Vazirmatn:wght@400;500;700&display=swap" rel="stylesheet" />
        <link rel="icon" href="/static-images/logo.png" />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <QueryProvider>
            <FirebaseClientProvider firebaseApp={firebase.firebaseApp} firestore={firebase.firestore} auth={firebase.auth}>
              <AuthProvider>
                <LanguageProvider>
                  <AppShell>
                    {children}
                  </AppShell>
                </LanguageProvider>
              </AuthProvider>
            </FirebaseClientProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
