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
- **静态资源前缀**: 自动配置 `assetPrefix` 确保JS/CSS等资源正确加载
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

### 1. 构建和启动

**重要**: 设置 PATH_PRE 后必须重新构建项目：

```bash
# 清理并重新构建
rm -rf .next
PATH_PRE=/chat npm run build

# 启动生产服务器
PATH_PRE=/chat npm start

# 或者开发模式
PATH_PRE=/chat npm run dev
```

### 2. Nginx 反向代理

```nginx
location /chatbot/ {
    proxy_pass http://localhost:3000/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### 3. Docker 部署

```dockerfile
ENV PATH_PRE=/chatbot
ENV NEXTAUTH_URL=https://yourdomain.com/chatbot
RUN npm run build
```

### 4. Vercel 部署

在 Vercel 环境变量中设置：
- `PATH_PRE`: `/chatbot`
- `NEXTAUTH_URL`: `https://yourdomain.vercel.app/chatbot`

## 故障排除

### 1. 静态资源404错误

**问题**: 设置前缀后，JS/CSS文件返回404错误

**解决方案**:
```bash
# 1. 清理构建缓存
rm -rf .next

# 2. 重新构建（必须带前缀）
PATH_PRE=/chat npm run build

# 3. 启动服务器（必须带前缀）
PATH_PRE=/chat npm start
```

**验证**: 使用测试脚本检查静态资源：
```bash
node scripts/test-static-assets.js
```

### 2. 重定向循环
确保 `NEXTAUTH_URL` 包含正确的前缀：
```bash
# 错误
NEXTAUTH_URL=http://localhost:3000
PATH_PRE=/chatbot

# 正确
NEXTAUTH_URL=http://localhost:3000/chatbot
PATH_PRE=/chatbot
```

### 3. API 路由问题
API 路由会自动包含前缀，确保客户端请求使用正确的路径：
```typescript
// 使用 PATH_CONFIG.api 而不是硬编码 '/api'
fetch(`${PATH_CONFIG.api}/chat`)
```

### 4. 中间件配置问题
确保中间件正确排除静态资源：
```typescript
// middleware.ts 中的 matcher 配置
matcher: [
  '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
]
```

## 测试

### 1. 基本功能测试
```bash
# 测试无前缀
PATH_PRE= npm run dev

# 测试带前缀
PATH_PRE=/chatbot npm run dev
```

### 2. 静态资源测试
```bash
# 启动服务器
PATH_PRE=/chat npm run build && PATH_PRE=/chat npm start

# 运行静态资源测试
node scripts/test-static-assets.js
```

### 3. 路径配置测试
```bash
# 运行路径配置测试
node scripts/test-path-config.js
```

访问 `http://localhost:3000/chatbot` 验证配置是否正确。

## 常见问题

### Q: 为什么设置前缀后静态资源404？
A: Next.js 需要在构建时知道 basePath，必须在构建时设置 PATH_PRE 环境变量。

### Q: 开发模式下工作，生产模式下不工作？
A: 确保生产构建时也设置了 PATH_PRE 环境变量。

### Q: 部分页面工作，部分页面不工作？
A: 检查是否所有内部链接都使用了 PATH_CONFIG 而不是硬编码路径。 