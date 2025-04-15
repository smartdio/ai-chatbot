# AI聊天机器人国际化指南

## 概述

本项目实现了完整的国际化（i18n）支持，使应用能够以多种语言显示内容。我们使用了以下技术栈来实现国际化：

- **next-intl**: 用于React组件中的翻译支持
- **Next.js Middleware**: 用于语言检测和路由处理
- **Cookie持久化**: 用于保存用户语言偏好

目前支持的语言包括：
- 英语 (en) - 默认语言
- 中文 (zh)
- 西班牙语 (es)
- 日语 (ja)

## 项目结构

项目中与国际化相关的主要文件和目录：

```
- lib/
  - i18n/
    - i18n-provider.tsx  # 提供国际化上下文
    - utils.ts           # 语言检测工具函数
- messages/
  - en.json             # 英语翻译文件
  - zh.json             # 中文翻译文件
  - es.json             # 西班牙语翻译文件
  - ja.json             # 日语翻译文件
- middleware.ts          # 处理语言检测和设置
- components/
  - language-switcher.tsx # 语言切换组件
  - language-debug.tsx    # 语言调试组件（仅开发环境）
```

## 实现机制

### 语言检测和设置

1. 当用户首次访问应用时，`middleware.ts`会检测浏览器语言（Accept-Language头）
2. 检测到的语言会与支持的语言列表(`locales`数组)进行匹配
3. 匹配的语言会被设置到Cookie中（`NEXT_LOCALE`）
4. 后续请求会优先使用Cookie中存储的语言设置

### 国际化提供者

`I18nProvider`组件在客户端提供了国际化支持：

1. 组件初始化时会从服务器传递的`initialLocale`和翻译数据开始
2. 客户端渲染时会检查Cookie中是否有语言设置，并优先使用它
3. 提供`useLocale` hook，让组件可以访问当前语言和翻译消息
4. 允许通过`setLocale`函数动态切换语言

### 翻译文件

翻译文件组织为JSON格式，按功能区域分组：

```json
{
  "Common": { ... },  // 通用翻译
  "Auth": { ... },    // 认证相关
  "Chat": { ... },    // 聊天界面
  "Settings": { ... } // 设置界面
  // 其他功能区域...
}
```

## 开发指南

### 为组件添加国际化支持

1. 导入useLocale hook:
```tsx
import { useLocale } from '@/lib/i18n/i18n-provider';
```

2. 在组件中使用hook获取翻译和当前语言:
```tsx
const { locale, messages: t, setLocale } = useLocale();
```

3. 使用翻译消息代替硬编码的文本:
```tsx
// 替换前
<Button>Send</Button>

// 替换后
<Button>{t.Common.send}</Button>
```

### 添加新的翻译键

1. 首先在默认语言文件 (`messages/en.json`) 中添加新的翻译键
2. 然后在其他语言文件中添加相应的翻译

### 语言切换

使用`LanguageSwitcher`组件可以让用户手动切换语言:

```tsx
import { LanguageSwitcher } from '@/components/language-switcher';

// 在组件中渲染
<LanguageSwitcher />
```

也可以直接在代码中通过setLocale函数切换语言:

```tsx
const { setLocale } = useLocale();

// 切换到中文
setLocale('zh');
```

## 添加新语言支持

要添加新的语言支持，需要执行以下步骤：

1. 在`lib/i18n/utils.ts`中的`locales`数组中添加新的语言代码
2. 创建新的翻译文件，例如`messages/fr.json`（法语）
3. 确保翻译文件包含与默认语言文件相同的所有键
4. 在`LanguageSwitcher`组件中添加新语言的选项

## 调试

在开发环境中，应用底部会显示一个语言调试组件，显示：

- 当前使用的语言
- Cookie中存储的语言值
- 浏览器首选语言

此组件可用于快速验证语言设置是否正确。

## 注意事项

- 添加新翻译键时，请确保所有语言文件都添加相应的翻译
- 文本中包含变量时，请使用占位符格式：`{variableName}`
- 确保翻译文本不会破坏UI布局（考虑文本长度变化）
- 测试不同语言下的UI显示效果

## 相关资源

- [Next.js 国际化文档](https://nextjs.org/docs/advanced-features/i18n-routing)
- [next-intl 文档](https://next-intl-docs.vercel.app/)
- [国际化最佳实践](https://phrase.com/blog/posts/i18n-best-practices/) 