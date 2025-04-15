'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { IntlProvider } from 'next-intl';

// 语言上下文类型
type LocaleContextType = {
  locale: string;
  setLocale: (locale: string) => void;
};

// 创建上下文
const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

// 设置Cookie的函数
function setCookie(name: string, value: string, days: number) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

// 读取Cookie的函数
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith(name + '=')) {
      return cookie.substring(name.length + 1);
    }
  }
  return null;
}

// Provider组件
export function I18nProvider({ 
  children, 
  messages, 
  initialLocale 
}: { 
  children: ReactNode; 
  messages: Record<string, Record<string, string>>;
  initialLocale: string;
}) {
  // 检查是否在客户端
  const isClient = typeof window !== 'undefined';
  
  // 首次渲染时，在服务器端使用initialLocale，在客户端优先使用Cookie
  const getInitialState = () => {
    if (isClient) {
      const cookieLocale = getCookie('NEXT_LOCALE');
      if (cookieLocale && messages[cookieLocale]) {
        console.log('初始化时使用Cookie中的语言:', cookieLocale);
        return cookieLocale;
      }
    }
    return initialLocale;
  };
  
  const [locale, setLocaleState] = useState<string>(getInitialState());
  const [currentMessages, setCurrentMessages] = useState(
    messages[locale] || messages['en']
  );
  
  // 客户端渲染时检查Cookie
  useEffect(() => {
    if (!isClient) return;
    
    const cookieLocale = getCookie('NEXT_LOCALE');
    
    // 确保Cookie值存在，与当前locale不同，并且消息资源可用
    if (
      cookieLocale && 
      cookieLocale !== locale && 
      messages[cookieLocale]
    ) {
      console.log('从Cookie中恢复语言设置:', cookieLocale);
      setLocaleState(cookieLocale);
      setCurrentMessages(messages[cookieLocale]);
      
      // 强制页面刷新以应用新语言
      if (process.env.NODE_ENV === 'development') {
        window.location.reload();
      }
    }
  }, [locale, messages, isClient]);
  
  // 切换语言并保存到Cookie
  const setLocale = (newLocale: string) => {
    if (!isClient) return;
    
    console.log('切换语言:', newLocale);
    
    // 只有在新语言与当前语言不同时才执行
    if (newLocale !== locale) {
      // 设置Cookie
      setCookie('NEXT_LOCALE', newLocale, 365);
      
      setLocaleState(newLocale);
      
      // 动态加载所选语言的消息
      if (messages[newLocale]) {
        setCurrentMessages(messages[newLocale]);
      } else {
        // 如果没有找到语言资源，动态导入
        import(`@/messages/${newLocale}.json`)
          .then((module) => {
            setCurrentMessages(module.default);
          })
          .catch(() => {
            // 如果导入失败，使用默认语言
            setCurrentMessages(messages['en']);
          });
      }
      
      // 强制页面刷新以应用新语言
      window.location.reload();
    }
  };
  
  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <IntlProvider locale={locale} messages={currentMessages}>
        {children}
      </IntlProvider>
    </LocaleContext.Provider>
  );
}

// 使用上下文的Hook
export function useLocale() {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error('useLocale must be used within an I18nProvider');
  }
  return context;
} 