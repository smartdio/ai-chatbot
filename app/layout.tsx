import { Toaster } from 'sonner';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { I18nProvider } from '@/lib/i18n/i18n-provider';
import { cookies } from 'next/headers';
import { LanguageDebug } from '@/components/language-debug';
import { locales, defaultLocale } from '@/lib/i18n/utils';

import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://chat.vercel.ai'),
  title: 'Next.js Chatbot Template',
  description: 'Next.js chatbot template using the AI SDK.',
};

export const viewport = {
  maximumScale: 1, // Disable auto-zoom on mobile Safari
};

const geist = Geist({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist-mono',
});

const LIGHT_THEME_COLOR = 'hsl(0 0% 100%)';
const DARK_THEME_COLOR = 'hsl(240deg 10% 3.92%)';
const THEME_COLOR_SCRIPT = `\
(function() {
  var html = document.documentElement;
  var meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  function updateThemeColor() {
    var isDark = html.classList.contains('dark');
    meta.setAttribute('content', isDark ? '${DARK_THEME_COLOR}' : '${LIGHT_THEME_COLOR}');
  }
  var observer = new MutationObserver(updateThemeColor);
  observer.observe(html, { attributes: true, attributeFilter: ['class'] });
  updateThemeColor();
})();`;

// 判断是否为开发环境
const isDevelopment = process.env.NODE_ENV === 'development';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 直接从Cookie中获取语言设置
  const cookieStore = cookies();
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;
  
  // 确保locale是受支持的语言，否则使用默认语言
  const locale = cookieLocale && locales.includes(cookieLocale) 
    ? cookieLocale 
    : defaultLocale;
    
  console.log(`[layout] 使用语言: ${locale} (从Cookie: ${cookieLocale || '未设置'})`);
  
  // 预加载默认语言和当前语言的翻译
  const messages: Record<string, any> = {};
  
  try {
    // 加载英语（始终加载作为后备）
    messages['en'] = (await import('@/messages/en.json')).default;
    
    // 如果当前语言不是英语，加载当前语言
    if (locale !== 'en') {
      try {
        messages[locale] = (await import(`@/messages/${locale}.json`)).default;
      } catch (e) {
        console.error(`Failed to load messages for ${locale}`);
      }
    }
  } catch (error) {
    console.error('Error loading translation files:', error);
  }

  return (
    <html
      lang={locale}
      // `next-themes` injects an extra classname to the body element to avoid
      // visual flicker before hydration. Hence the `suppressHydrationWarning`
      // prop is necessary to avoid the React hydration mismatch warning.
      // https://github.com/pacocoursey/next-themes?tab=readme-ov-file#with-app
      suppressHydrationWarning
      className={`${geist.variable} ${geistMono.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: THEME_COLOR_SCRIPT,
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <I18nProvider initialLocale={locale} messages={messages}>
            <Toaster position="top-center" />
            {children}
            {isDevelopment && <LanguageDebug />}
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
