# PATH_PRE 环境变量配置指南

## 概述

`PATH_PRE` 环境变量用于为整个应用添加路径前缀支持。这在以下场景中非常有用：

- 部署在子路径下（如 `/app`, `/chatbot`, `/api/v1` 等）
- 多租户应用
- 反向代理配置
- 微服务架构中的路径隔离

## 配置方法

### 1. 环境变量设置

在您的 `.env.local` 文件中添加：

```bash
# 路径前缀配置
# 示例：PATH_PRE=/chatbot
# 示例：PATH_PRE=/api/v1
# 示例：PATH_PRE=/app
# 留空表示没有前缀（默认行为）
PATH_PRE=

# 其他必需的环境变量
POSTGRES_URL=your_postgres_url
AUTH_SECRET=your_auth_secret
NEXTAUTH_URL=http://localhost:3000
QWEN_API_KEY=your_qwen_api_key
```

### 2. 配置示例

#### 无前缀（默认）
```bash
PATH_PRE=
```
访问路径：
- 登录：`http://localhost:3000/login`
- 首页：`http://localhost:3000/`

#### 带前缀
```bash
PATH_PRE=/chatbot
```
访问路径：
- 登录：`http://localhost:3000/chatbot/login`
- 首页：`http://localhost:3000/chatbot/`

## 技术实现

### 1. 自动处理的组件

- **Next.js basePath**: 自动配置 `next.config.ts` 中的 `basePath`
- **认证路径**: NextAuth 的登录、注册路径自动添加前缀
- **中间件重定向**: 自动处理路径前缀的重定向逻辑
- **内部链接**: 使用 `PATH_CONFIG` 的所有链接自动包含前缀

### 2. 路径配置常量

```typescript
import { PATH_CONFIG } from '@/lib/path-config';

// 可用的路径常量
PATH_CONFIG.prefix    // 当前配置的前缀
PATH_CONFIG.login     // 登录页面路径
PATH_CONFIG.register  // 注册页面路径
PATH_CONFIG.home      // 首页路径
PATH_CONFIG.api       // API 路径
```

### 3. 工具函数

```typescript
import { 
  addPathPrefix, 
  removePathPrefix, 
  hasPathPrefix,
  getBaseUrl 
} from '@/lib/path-config';

// 为路径添加前缀
const fullPath = addPathPrefix('/dashboard'); // /chatbot/dashboard

// 移除路径前缀
const cleanPath = removePathPrefix('/chatbot/dashboard'); // /dashboard

// 检查路径是否包含前缀
const hasPrefix = hasPathPrefix('/chatbot/login'); // true

// 获取完整基础URL
const baseUrl = getBaseUrl(); // http://localhost:3000/chatbot
```

## 部署注意事项

### 1. Nginx 反向代理

```nginx
location /chatbot/ {
    proxy_pass http://localhost:3000/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### 2. Docker 部署

```dockerfile
ENV PATH_PRE=/chatbot
ENV NEXTAUTH_URL=https://yourdomain.com/chatbot
```

### 3. Vercel 部署

在 Vercel 环境变量中设置：
- `PATH_PRE`: `/chatbot`
- `NEXTAUTH_URL`: `https://yourdomain.vercel.app/chatbot`

## 故障排除

### 1. 重定向循环
确保 `NEXTAUTH_URL` 包含正确的前缀：
```bash
# 错误
NEXTAUTH_URL=http://localhost:3000
PATH_PRE=/chatbot

# 正确
NEXTAUTH_URL=http://localhost:3000/chatbot
PATH_PRE=/chatbot
```

### 2. 静态资源404
Next.js 会自动处理静态资源的前缀，无需额外配置。

### 3. API 路由问题
API 路由会自动包含前缀，确保客户端请求使用正确的路径：
```typescript
// 使用 PATH_CONFIG.api 而不是硬编码 '/api'
fetch(`${PATH_CONFIG.api}/chat`)
```

## 测试

启动开发服务器并测试不同的前缀配置：

```bash
# 测试无前缀
PATH_PRE= npm run dev

# 测试带前缀
PATH_PRE=/chatbot npm run dev
```

访问 `http://localhost:3000/chatbot` 验证配置是否正确。 