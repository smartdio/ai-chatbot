import type { NextConfig } from 'next';

// 获取路径前缀
const getPathPrefix = (): string => {
  const pathPre = process.env.PATH_PRE || '';
  
  if (!pathPre) {
    return '';
  }
  
  // 去除首尾斜杠，然后添加前导斜杠
  const cleanPath = pathPre.replace(/^\/+|\/+$/g, '');
  return cleanPath ? `/${cleanPath}` : '';
};

const nextConfig: NextConfig = {
  // 添加 basePath 支持
  basePath: getPathPrefix(),
  
  experimental: {
    ppr: true,
  },
  images: {
    remotePatterns: [
      {
        hostname: 'avatar.vercel.sh',
      },
    ],
  },
};

export default nextConfig;
