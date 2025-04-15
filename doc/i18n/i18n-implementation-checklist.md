# AI聊天机器人国际化实施清单

## 依赖安装

- [x] 安装必要的依赖: `pnpm add next-intl`

## 配置文件创建/修改

- [x] 创建 `lib/i18n/i18n-provider.tsx` 文件
- [x] 修改 `middleware.ts` 支持语言检测和Cookie存储
- [x] 创建 `lib/i18n/utils.ts` 用于语言检测工具函数

## 翻译文件准备

- [x] 创建 `messages/en.json` 文件
- [x] 创建 `messages/zh.json` 文件
- [x] 创建 `messages/es.json` 文件 (可选)
- [x] 创建 `messages/ja.json` 文件 (可选)

## 应用结构调整

- [x] 修改 `app/layout.tsx` 添加国际化提供者
- [x] 保持现有路由结构不变，无需添加 `[locale]` 参数

## 组件国际化

### 通用组件

- [x] 创建 `components/language-switcher.tsx`
- [ ] 修改 `components/theme-provider.tsx`

### 核心UI组件

- [x] 修改 `components/greeting.tsx`
- [x] 修改 `components/chat-header.tsx`
- [x] 修改 `components/auth-form.tsx`
- [x] 修改 `components/model-selector.tsx`
- [x] 修改 `components/message.tsx`
- [x] 修改 `components/messages.tsx`
- [x] 修改 `components/sidebar-history.tsx`
- [x] 修改 `components/sidebar-history-item.tsx`
- [x] 修改 `components/sidebar-user-nav.tsx`
- [ ] 修改 `components/submitted-actions.tsx`
- [ ] 修改 `components/suggestion.tsx`

### 界面消息组件

- [ ] 修改 `components/toast.tsx`
- [ ] 修改错误消息显示组件

## 功能组件

- [x] 修改 `components/message-actions.tsx`
- [ ] 修改 `components/multimodal-input.tsx`
- [ ] 修改 `components/toolbar.tsx`
- [ ] 修改 `components/weather.tsx`
- [x] 修改 `components/visibility-selector.tsx`

## 测试和验证

- [x] 创建语言切换测试
- [x] 验证Cookie持久化机制
- [x] 验证浏览器语言自动检测功能
- [ ] 测试各个关键页面和组件在不同语言下的显示效果

## 文档更新

- [ ] 更新 README.md，添加国际化支持说明
- [x] 为开发人员创建国际化指南文档
- [ ] 为翻译人员创建翻译指南文档

## 部署前检查

- [ ] 确保所有语言的翻译文件完整
- [ ] 检查所有组件是否正确使用翻译函数
- [ ] 验证语言切换功能在各个页面是否正常工作
- [ ] 测试Cookie存储和恢复机制 