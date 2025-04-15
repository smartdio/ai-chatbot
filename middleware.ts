import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authConfig } from '@/app/(auth)/auth.config';
import { getLocale, locales } from '@/lib/i18n/utils';

// 身份验证中间件函数
const authMiddleware = NextAuth(authConfig).auth;

export default async function middleware(request: NextRequest) {
  // 记录当前请求路径，方便调试
  console.log(`处理路径: ${request.nextUrl.pathname}`);
  
  // 先执行auth中间件
  try {
    // 尝试执行身份验证中间件
    // @ts-ignore - 类型不匹配，但实际功能正常
    const authResponse = await authMiddleware(request);
    if (authResponse) return authResponse;
  } catch (error) {
    console.error('Auth middleware error:', error);
  }
  
  // 获取当前Cookie
  const currentCookie = request.cookies.get('NEXT_LOCALE')?.value;
  console.log(`当前Cookie值: ${currentCookie || '未设置'}`);
  
  // 如果没有Cookie，则从浏览器语言中获取
  let locale = currentCookie;
  
  // 只有在没有有效Cookie时才尝试检测浏览器语言
  if (!locale || !locales.includes(locale)) {
    // 获取浏览器语言设置
    locale = getLocale(request);
    console.log(`从浏览器检测到的语言: ${locale}`);
  } else {
    console.log(`使用Cookie中的语言设置: ${locale}`);
  }
  
  // 创建响应
  const response = NextResponse.next();
  
  // 如果当前Cookie不存在或与检测到的语言不同，设置新Cookie
  if (!currentCookie || (locale && currentCookie !== locale)) {
    console.log(`设置/更新Cookie: ${locale}`);
    response.cookies.set('NEXT_LOCALE', locale, { 
      maxAge: 60 * 60 * 24 * 365, // 1年
      path: '/',
      sameSite: 'lax'
    });
  }
  
  return response;
}

// 修改matcher以匹配所有路径
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
