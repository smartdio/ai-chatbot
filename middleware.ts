import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authConfig } from '@/app/(auth)/auth.config';
import { getLocale, locales } from '@/lib/i18n/utils';
import { getPathPrefix, removePathPrefix, hasPathPrefix } from '@/lib/path-config';

// 身份验证中间件函数
const authMiddleware = NextAuth(authConfig).auth;

export default async function middleware(request: NextRequest) {
  const pathPrefix = getPathPrefix();
  const originalPath = request.nextUrl.pathname;
  
  // 记录当前请求路径，方便调试
  console.log(`处理路径: ${originalPath}, 前缀: ${pathPrefix || '无'}`);
  
  // 检查是否是静态资源或Next.js内部路径
  const isStaticFile = originalPath.startsWith('/_next/') || 
                      originalPath.startsWith('/static/') ||
                      originalPath.includes('.') && !originalPath.endsWith('/');
  
  // 如果是静态资源，直接通过，不做任何处理
  if (isStaticFile) {
    console.log(`静态资源，直接通过: ${originalPath}`);
    return NextResponse.next();
  }
  
  // 如果有路径前缀，检查请求是否包含前缀
  if (pathPrefix) {
    // 如果请求路径不包含前缀，重定向到包含前缀的路径
    if (!hasPathPrefix(originalPath)) {
      const redirectUrl = new URL(`${pathPrefix}${originalPath}`, request.url);
      console.log(`重定向到: ${redirectUrl.pathname}`);
      return NextResponse.redirect(redirectUrl);
    }
    
    // 为了让 NextAuth 正确处理，我们需要临时移除前缀
    const pathWithoutPrefix = removePathPrefix(originalPath);
    const modifiedRequest = new Request(request.url.replace(originalPath, pathWithoutPrefix), {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });
    
    // 更新 nextUrl 以便 NextAuth 正确处理
    Object.defineProperty(modifiedRequest, 'nextUrl', {
      value: {
        ...request.nextUrl,
        pathname: pathWithoutPrefix,
      },
      writable: false,
    });
  }
  
  // 先执行auth中间件
  try {
    // 尝试执行身份验证中间件
    // @ts-ignore - 类型不匹配，但实际功能正常
    const authResponse = await authMiddleware(pathPrefix ? modifiedRequest : request);
    if (authResponse) {
      // 检查是否是 Response 对象（重定向响应）
      if (authResponse instanceof Response) {
        // 如果有重定向响应，确保包含路径前缀
        if (authResponse.status >= 300 && authResponse.status < 400) {
          const location = authResponse.headers.get('location');
          if (location && pathPrefix && !location.includes(pathPrefix)) {
            const url = new URL(location);
            if (url.pathname && !url.pathname.startsWith(pathPrefix)) {
              url.pathname = `${pathPrefix}${url.pathname}`;
              return NextResponse.redirect(url.toString());
            }
          }
        }
      }
      return authResponse;
    }
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

// 更新matcher，明确排除静态资源和Next.js内部路径
export const config = {
  matcher: [
    /*
     * 匹配所有请求路径，除了：
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - 任何包含文件扩展名的路径
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
