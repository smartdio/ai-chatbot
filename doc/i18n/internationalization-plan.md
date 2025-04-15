# AI聊天机器人国际化方案设计

## 项目概况

本项目是一个基于 Next.js 的 AI 聊天机器人应用，当前仅支持英文界面。根据项目结构和技术栈，我们可以看到：

- 使用 Next.js 15+ 框架
- React 19 RC版本
- TypeScript 作为开发语言
- 使用 Tailwind CSS 进行样式设计
- next-auth 处理身份验证
- 已经存在 messages 目录，但没有内容

## 推荐的国际化解决方案

根据项目需求和技术栈，我推荐使用 **next-intl** 作为基础国际化工具，但采用基于Cookie的方案而非URL路由参数。这种方案更加简洁，保持URL结构不变，同时提供完整的国际化支持。

### 安装依赖

```bash
pnpm add next-intl
```

## 实施步骤

### 1. 设置消息文件

利用已有的 messages 目录，为每种语言创建消息文件：

- `messages/en.json` - 英文（默认）
- `messages/zh.json` - 中文
- `messages/es.json` - 西班牙语（可选）
- `messages/ja.json` - 日语（可选）

### 2. 配置国际化中间件

修改 `middleware.ts` 文件以支持语言检测和Cookie存储：

```typescript
import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authConfig } from '@/app/(auth)/auth.config';
import { match } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';

// 支持的语言列表
const locales = ['en', 'zh', 'es', 'ja'];
// 默认语言
const defaultLocale = 'en';

// 获取首选语言
function getLocale(request: NextRequest): string {
  // 1. 检查cookie中是否已有语言设置
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (cookieLocale && locales.includes(cookieLocale)) {
    return cookieLocale;
  }
  
  // 2. 否则从请求头中获取浏览器语言
  const negotiatorHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => (negotiatorHeaders[key] = value));

  // @ts-ignore - negotiator类型定义问题
  const languages = new Negotiator({ headers: negotiatorHeaders }).languages();
  
  // 3. 使用intl-localematcher匹配最佳语言
  try {
    return match(languages, locales, defaultLocale);
  } catch (e) {
    return defaultLocale;
  }
}

// 身份验证中间件
const authMiddleware = NextAuth(authConfig).auth;

export default function middleware(request: NextRequest) {
  // 先执行auth中间件
  const authResponse = authMiddleware(request);
  if (authResponse) return authResponse;
  
  // 获取语言设置
  const locale = getLocale(request);
  
  // 将语言保存到请求头中，供后续使用
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-locale', locale);
  
  // 返回修改后的请求头
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    }
  });
  
  // 如果还没有语言cookie，设置cookie以记住语言偏好
  if (!request.cookies.has('NEXT_LOCALE')) {
    response.cookies.set('NEXT_LOCALE', locale, { 
      maxAge: 60 * 60 * 24 * 365, // 1年
      path: '/' 
    });
  }
  
  return response;
}

export const config = {
  matcher: ['/', '/:id', '/api/:path*', '/login', '/register'],
};
```

### 3. 创建国际化Provider

创建 `lib/i18n/i18n-provider.tsx` 文件：

```typescript
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

// Provider组件
export function I18nProvider({ children, messages, initialLocale }: { 
  children: ReactNode; 
  messages: Record<string, Record<string, string>>;
  initialLocale: string;
}) {
  const [locale, setLocaleState] = useState<string>(initialLocale);
  const [currentMessages, setCurrentMessages] = useState(messages[locale] || messages['en']);
  
  // 切换语言并保存到Cookie
  const setLocale = (newLocale: string) => {
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=${60 * 60 * 24 * 365}`;
    setLocaleState(newLocale);
    
    // 动态加载所选语言的消息
    if (messages[newLocale]) {
      setCurrentMessages(messages[newLocale]);
    } else {
      // 如果没有找到语言资源，动态导入
      import(`@/messages/${newLocale}.json`)
        .then((module) => {
          const newMessages = { ...messages, [newLocale]: module.default };
          setCurrentMessages(module.default);
        })
        .catch(() => {
          // 如果导入失败，使用默认语言
          setCurrentMessages(messages['en']);
        });
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
```

### 4. 修改项目根布局

修改 `app/layout.tsx` 以支持国际化：

```typescript
import { I18nProvider } from '@/lib/i18n/i18n-provider';
import { headers } from 'next/headers';

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  // 从请求头获取语言设置
  const headersList = headers();
  const locale = headersList.get('x-locale') || 'en';
  
  // 预加载默认语言和当前语言的翻译
  const messages: Record<string, any> = {};
  
  // 加载英语（始终加载作为后备）
  messages['en'] = (await import('@/messages/en.json')).default;
  
  // 如果当前语言不是英语，加载当前语言
  if (locale !== 'en') {
    try {
      messages[locale] = (await import(`@/messages/${locale}.json`)).default;
    } catch (e) {
      // 如果加载失败，使用英语作为后备
      console.error(`Failed to load messages for ${locale}`);
    }
  }

  return (
    <html lang={locale}>
      <I18nProvider initialLocale={locale} messages={messages}>
        {/* 现有布局内容 */}
        {children}
      </I18nProvider>
    </html>
  );
}
```

### 5. 创建语言切换组件

创建 `components/language-switcher.tsx` 组件：

```typescript
'use client';

import { useLocale } from '@/lib/i18n/i18n-provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <Select value={locale} onValueChange={setLocale}>
      <SelectTrigger className="w-[120px]">
        <SelectValue placeholder="Language" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">English</SelectItem>
        <SelectItem value="zh">中文</SelectItem>
        <SelectItem value="es">Español</SelectItem>
        <SelectItem value="ja">日本語</SelectItem>
      </SelectContent>
    </Select>
  );
}
```

### 6. 使用翻译函数

在组件中使用翻译：

```typescript
// 客户端组件
'use client';
import { useTranslations } from 'next-intl';

export function MyComponent() {
  const t = useTranslations('Common');
  
  return <h1>{t('title')}</h1>;
}

// 服务器组件
import { getTranslations } from 'next-intl/server';

export async function MyServerComponent() {
  const t = await getTranslations('Common');
  
  return <h1>{t('title')}</h1>;
}
```

### 7. 创建示例翻译文件

`messages/en.json`:

```json
{
  "Common": {
    "title": "AI Chatbot",
    "newChat": "New Chat",
    "send": "Send",
    "clear": "Clear"
  },
  "Auth": {
    "login": "Log In",
    "register": "Register",
    "email": "Email",
    "password": "Password",
    "forgotPassword": "Forgot password?"
  },
  "Chat": {
    "placeholder": "Type a message...",
    "thinking": "AI is thinking...",
    "modelSelector": "Select a model"
  }
}
```

`messages/zh.json`:

```json
{
  "Common": {
    "title": "AI 聊天机器人",
    "newChat": "新对话",
    "send": "发送",
    "clear": "清除"
  },
  "Auth": {
    "login": "登录",
    "register": "注册",
    "email": "电子邮箱",
    "password": "密码",
    "forgotPassword": "忘记密码？"
  },
  "Chat": {
    "placeholder": "输入消息...",
    "thinking": "AI 正在思考...",
    "modelSelector": "选择模型"
  }
}
```

## 需要修改的关键文件

1. `middleware.ts` - 添加语言检测和Cookie存储
2. `lib/i18n/i18n-provider.tsx` - 创建国际化上下文提供者
3. `app/layout.tsx` - 添加国际化提供者
4. 所有包含文本的组件文件 - 使用翻译函数替换硬编码文本

### 主要组件修改列表

根据项目结构，以下是需要优先修改的组件列表：

1. `components/chat-header.tsx`
2. `components/greeting.tsx`
3. `components/auth-form.tsx`
4. `components/message.tsx`
5. `components/sidebar-history.tsx`
6. `components/model-selector.tsx`
7. `components/suggested-actions.tsx`

## 国际化测试计划

1. 测试浏览器语言自动检测功能
2. 测试Cookie存储和恢复机制
3. 验证手动语言切换功能
4. 验证所有文本元素在各种语言下的显示

## 该方案的优势

1. **保持URL简洁**：不添加额外的路由参数，保持现有URL结构不变
2. **自动语言检测**：基于浏览器设置自动选择初始语言
3. **持久化设置**：用户选择的语言会被保存到Cookie中
4. **无需路由重构**：不需要修改现有的路由结构，减少改动范围
5. **与现有代码集成简单**：降低集成复杂度和潜在错误

## 总结

通过使用 next-intl 库和基于Cookie的语言检测方案，我们可以为应用添加完整的国际化支持，包括：

- 自动语言检测和持久化存储
- 客户端和服务器端翻译支持
- 用户语言偏好设置
- 保持现有URL结构不变

该方案与 Next.js 的最新特性兼容，包括 App Router 和 Server Components，同时保持了应用的简洁性和性能优势。 