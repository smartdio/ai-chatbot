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

const basePath = getPathPrefix();

const nextConfig: NextConfig = {
  // 添加 basePath 支持
  basePath,
  
  // 确保静态资源使用正确的路径
  assetPrefix: basePath,
  
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
  
  // 添加重写规则以处理静态资源
  async rewrites() {
    if (!basePath) return [];
    
    return [
      {
        source: '/_next/:path*',
        destination: '/_next/:path*',
      },
    ];
  },
};

export default nextConfig;
