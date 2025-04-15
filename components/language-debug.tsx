'use client';

import { useState, useEffect } from 'react';
import { useLocale } from '@/lib/i18n/i18n-provider';

export function LanguageDebug() {
  const { locale } = useLocale();
  const [cookieValue, setCookieValue] = useState<string | null>(null);
  const [browserLanguage, setBrowserLanguage] = useState<string>('');
  
  useEffect(() => {
    // 获取Cookie的函数
    function getCookie(name: string): string | null {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith(name + '=')) {
          return cookie.substring(name.length + 1);
        }
      }
      return null;
    }
    
    // 获取浏览器语言
    if (typeof navigator !== 'undefined') {
      setBrowserLanguage(navigator.language || (navigator as any).userLanguage || '');
    }
    
    // 获取Cookie
    setCookieValue(getCookie('NEXT_LOCALE'));
  }, [locale]);
  
  // 强制刷新页面的函数
  const refreshPage = () => {
    window.location.reload();
  };
  
  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-3 text-xs z-50 rounded-lg shadow-lg">
      <h3 className="text-sm font-bold border-b border-gray-600 pb-1 mb-2">语言调试信息</h3>
      <div className="grid gap-1">
        <div><span className="font-bold">当前使用语言:</span> {locale}</div>
        <div><span className="font-bold">Cookie值:</span> {cookieValue || '未设置'}</div>
        <div><span className="font-bold">浏览器首选语言:</span> {browserLanguage}</div>
      </div>
      
      <div className="flex gap-2 mt-3 pt-2 border-t border-gray-600">
        <button 
          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white flex-1"
          onClick={refreshPage}
        >
          刷新页面
        </button>
      </div>
    </div>
  );
} 