import { NextRequest } from 'next/server';
import { match } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';

// 支持的语言列表
export const locales = ['en', 'zh', 'es', 'ja'];
// 默认语言
export const defaultLocale = 'en';

// 获取首选语言
export function getLocale(request: NextRequest): string {
  console.log('--- 开始语言检测 ---');
  
  // 1. 检查cookie中是否已有语言设置
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  
  // 如果有cookie且是有效的语言，直接返回
  if (cookieLocale && locales.includes(cookieLocale)) {
    console.log('从Cookie中检测到语言设置:', cookieLocale);
    return cookieLocale;
  }
  
  // 2. 获取Accept-Language头并处理
  const acceptLanguage = request.headers.get('accept-language');
  console.log('Accept-Language 头:', acceptLanguage);
  
  if (!acceptLanguage) {
    console.log('未找到 Accept-Language 头，使用默认语言:', defaultLocale);
    return defaultLocale;
  }
  
  // 3. 解析Accept-Language, 格式通常是: zh-CN,zh;q=0.9,en;q=0.8
  const parsedLanguages = acceptLanguage.split(',')
    .map(lang => {
      const [language, qValue] = lang.trim().split(';q=');
      // 正确处理语言代码，例如从zh-CN中提取zh
      let mainLang = language;
      if (language.includes('-')) {
        mainLang = language.split('-')[0].toLowerCase();
      }
      return {
        language: mainLang,
        originalLanguage: language,
        q: qValue ? parseFloat(qValue) : 1
      };
    })
    .sort((a, b) => b.q - a.q);
  
  console.log('解析后的语言列表:', parsedLanguages);
  
  // 4. 从解析的语言中找第一个匹配的
  for (const lang of parsedLanguages) {
    if (locales.includes(lang.language)) {
      console.log('找到匹配的语言:', lang.language, '(源自:', lang.originalLanguage, ')');
      return lang.language;
    }
  }
  
  // 5. 如果直接匹配失败，尝试使用intl-localematcher
  try {
    const languages = parsedLanguages.map(l => l.language);
    const matchedLocale = match(languages, locales, defaultLocale);
    console.log('通过intl-localematcher匹配的语言:', matchedLocale);
    return matchedLocale;
  } catch (e) {
    console.error('语言匹配失败:', e);
    return defaultLocale;
  }
} 