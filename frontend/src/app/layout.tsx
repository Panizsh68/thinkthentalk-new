
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
import { useEffect } from 'react';
import { cn } from '@/lib/utils';


function LayoutWithDirection({ children }: { children: React.ReactNode }) {
  const { language } = useLanguage();
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');

  useEffect(() => {
    const dir = isAdminRoute ? 'ltr' : language === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = isAdminRoute ? 'en' : language;
    if (!isAdminRoute && language === 'fa') {
      document.documentElement.classList.add('font-vazir');
    } else {
      document.documentElement.classList.remove('font-vazir');
    }
  }, [language, isAdminRoute]);

  return <>{children}</>;
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Think Then Talk Community</title>
        <meta name="description" content="An event platform for thoughtful conversations." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Vazirmatn:wght@400;500;700&display=swap" rel="stylesheet" />
        <link rel="icon" href="/static-images/logo.png" />
        <link rel="apple-touch-icon" href="/static-images/logo.png" />
      </head>
      <body>
         <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[9999] focus:p-4 focus:bg-background focus:text-foreground">
          Skip to main content
        </a>
        <LanguageProvider>
          <LayoutWithDirection>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <QueryProvider>
                {isAdminRoute ? (
                  <>{children}</>
                ) : (
                  <AuthProvider>
                      <div className="flex min-h-screen flex-col">
                      <AppHeader />
                      <main id="main-content" className="flex-grow">{children}</main>
                      <AppFooter />
                      </div>
                      <Toaster />
                  </AuthProvider>
                )}
              </QueryProvider>
            </ThemeProvider>
          </LayoutWithDirection>
        </LanguageProvider>
      </body>
    </html>
  );
}
