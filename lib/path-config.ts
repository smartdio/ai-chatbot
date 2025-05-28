/**
 * 路径配置工具
 * 用于处理 PATH_PRE 环境变量，为应用添加路径前缀支持
 */

// 获取路径前缀，去除首尾斜杠并确保格式正确
export const getPathPrefix = (): string => {
  const pathPre = process.env.PATH_PRE || '';
  
  if (!pathPre) {
    return '';
  }
  
  // 去除首尾斜杠，然后添加前导斜杠
  const cleanPath = pathPre.replace(/^\/+|\/+$/g, '');
  return cleanPath ? `/${cleanPath}` : '';
};

// 为路径添加前缀
export const addPathPrefix = (path: string): string => {
  const prefix = getPathPrefix();
  
  if (!prefix) {
    return path;
  }
  
  // 确保路径以斜杠开头
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // 避免重复添加前缀
  if (cleanPath.startsWith(prefix)) {
    return cleanPath;
  }
  
  return `${prefix}${cleanPath}`;
};

// 从路径中移除前缀
export const removePathPrefix = (path: string): string => {
  const prefix = getPathPrefix();
  
  if (!prefix || !path.startsWith(prefix)) {
    return path;
  }
  
  const pathWithoutPrefix = path.slice(prefix.length);
  return pathWithoutPrefix.startsWith('/') ? pathWithoutPrefix : `/${pathWithoutPrefix}`;
};

// 检查路径是否包含前缀
export const hasPathPrefix = (path: string): boolean => {
  const prefix = getPathPrefix();
  return prefix ? path.startsWith(prefix) : true;
};

// 获取完整的基础URL（包含前缀）
export const getBaseUrl = (): string => {
  const prefix = getPathPrefix();
  const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
  
  return `${baseUrl}${prefix}`;
};

// 路径配置常量
export const PATH_CONFIG = {
  prefix: getPathPrefix(),
  login: addPathPrefix('/login'),
  register: addPathPrefix('/register'),
  home: addPathPrefix('/'),
  api: addPathPrefix('/api'),
} as const; 