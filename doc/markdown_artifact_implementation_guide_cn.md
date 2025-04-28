# Markdown Artifact 实现指南

本文档提供了如何在现有的 Artifact 系统中添加 Markdown 文档支持的详细指引。

## 1. 架构概述

根据 Artifact 系统的架构，添加一个新的 Markdown Artifact 类型需要实现以下几个主要部分：

1. **客户端 Artifact 定义**：定义 Markdown Artifact 的类型、界面和行为
2. **服务端文档处理器**：处理 Markdown 文档的创建和更新
3. **内容编辑器组件**：提供 Markdown 编辑和预览功能
4. **特定工具和操作按钮**：如 Markdown 格式化、预览切换等

## 2. 实现步骤

### 2.1 创建 Markdown Artifact 客户端定义

在 `artifacts/markdown/client.ts` 文件中定义 Markdown Artifact：

```typescript
// artifacts/markdown/client.ts
import { Artifact } from '@/components/create-artifact';
import { MarkdownContent } from './content';
import { UIArtifact } from '@/components/artifact';
import { DataStreamDelta } from '@/components/data-stream-handler';
import { MarkdownIcon, CopyIcon, DownloadIcon } from '@/components/icons';
import { toast } from 'sonner';
import { copyToClipboard, downloadAsFile } from '@/lib/utils';

export const markdownArtifact = new Artifact<'markdown'>({
  kind: 'markdown',
  description: 'Markdown document',
  content: MarkdownContent,
  actions: [
    // 复制操作
    {
      icon: <CopyIcon size={16} />,
      description: 'copy',
      label: 'copy',
      onClick: async ({ content }) => {
        await copyToClipboard(content);
        toast.success('已复制到剪贴板');
      },
    },
    // 下载操作
    {
      icon: <DownloadIcon size={16} />,
      description: 'download',
      label: 'download',
      onClick: async ({ content }) => {
        downloadAsFile({
          content,
          fileName: 'document.md',
          contentType: 'text/markdown',
        });
      },
    },
    // 可以添加其他特定于Markdown的操作...
  ],
  // Markdown专用工具栏项
  toolbar: [
    // 可以添加Markdown相关的工具，如插入表格、链接等
  ],
  // 处理流式内容更新
  onStreamPart: ({ streamPart, setArtifact }) => {
    if (streamPart.type === 'text-delta') {
      setArtifact((draftArtifact) => {
        if (!draftArtifact) return draftArtifact;

        return {
          ...draftArtifact,
          content: draftArtifact.content + (streamPart.content as string),
        };
      });
    }
  },
});
```

### 2.2 创建 Markdown 内容组件

创建 `artifacts/markdown/content.tsx` 文件，实现 Markdown 编辑和预览功能：

```typescript
// artifacts/markdown/content.tsx
import React, { useState, useEffect } from 'react';
import { ArtifactContent } from '@/components/create-artifact';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export const MarkdownContent: React.FC<ArtifactContent<unknown>> = ({
  content,
  onSaveContent,
  mode,
  status,
  isCurrentVersion,
  isLoading,
}) => {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('preview');
  const [markdownContent, setMarkdownContent] = useState(content);

  // 当接收到新内容时更新状态
  useEffect(() => {
    setMarkdownContent(content);
  }, [content]);

  // 当编辑内容变化时
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setMarkdownContent(newContent);
    
    // 保存内容（带防抖）
    if (isCurrentVersion && mode === 'edit') {
      onSaveContent(newContent, true);
    }
  };

  // 如果正在加载，显示加载状态
  if (isLoading) {
    return <div className="p-4">正在加载 Markdown 文档...</div>;
  }

  // 在对比模式下显示纯文本
  if (mode === 'diff') {
    return (
      <div className="p-4 font-mono whitespace-pre-wrap">{markdownContent}</div>
    );
  }

  return (
    <div className="p-4 h-full">
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as 'edit' | 'preview')}
        className="w-full h-full"
      >
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="edit">编辑</TabsTrigger>
            <TabsTrigger value="preview">预览</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="edit" className="h-[calc(100%-50px)]">
          <Textarea
            className="w-full h-full font-mono p-4 resize-none"
            value={markdownContent}
            onChange={handleContentChange}
            disabled={!isCurrentVersion || status === 'streaming'}
            placeholder="输入 Markdown 内容..."
          />
        </TabsContent>

        <TabsContent value="preview" className="h-[calc(100%-50px)] overflow-auto">
          <div className="prose dark:prose-invert max-w-none p-4">
            <ReactMarkdown
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={vscDarkPlus}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {markdownContent}
            </ReactMarkdown>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
```

### 2.3 创建服务端文档处理器

在 `artifacts/markdown/server.ts` 文件中实现服务端文档处理器：

```typescript
// artifacts/markdown/server.ts
import { smoothStream, streamText } from 'ai';
import { myProvider } from '@/lib/ai/providers';
import { createDocumentHandler } from '@/lib/artifacts/server';
import { updateDocumentPrompt } from '@/lib/ai/prompts';

// Markdown 文档生成系统提示词
const markdownSystemPrompt = `
你是一个专业的 Markdown 文档生成助手。请基于主题创建清晰、结构良好的 Markdown 文档。

确保遵循以下 Markdown 格式规范:
1. 使用 # 到 ###### 表示不同级别的标题
2. 使用 * 或 - 创建无序列表，使用数字创建有序列表
3. 使用 **文本** 表示粗体，*文本* 表示斜体
4. 使用 \`代码\` 表示行内代码，使用 \`\`\` 表示代码块
5. 使用 > 创建引用块
6. 使用 [链接文本](URL) 创建链接
7. 使用 ![alt文本](图片URL) 插入图片
8. 使用 --- 创建水平线分隔符
9. 使用 | 创建表格

生成的文档应当结构清晰，信息丰富，易于阅读和理解。
`;

export const markdownDocumentHandler = createDocumentHandler<'markdown'>({
  kind: 'markdown',
  onCreateDocument: async ({ title, dataStream }) => {
    let draftContent = '';

    const { fullStream } = streamText({
      model: myProvider.languageModel('artifact-model'),
      system: markdownSystemPrompt,
      experimental_transform: smoothStream({ chunking: 'word' }),
      prompt: title,
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === 'text-delta') {
        const { textDelta } = delta;

        draftContent += textDelta;

        dataStream.writeData({
          type: 'text-delta',
          content: textDelta,
        });
      }
    }

    return draftContent;
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
    let draftContent = '';

    const { fullStream } = streamText({
      model: myProvider.languageModel('artifact-model'),
      system: updateDocumentPrompt(document.content, 'markdown'),
      experimental_transform: smoothStream({ chunking: 'word' }),
      prompt: description,
      experimental_providerMetadata: {
        openai: {
          prediction: {
            type: 'content',
            content: document.content,
          },
        },
      },
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === 'text-delta') {
        const { textDelta } = delta;

        draftContent += textDelta;
        dataStream.writeData({
          type: 'text-delta',
          content: textDelta,
        });
      }
    }

    return draftContent;
  },
});
```

### 2.4 更新 Artifact 定义列表

在 `components/artifact.tsx` 文件中导入并添加 Markdown Artifact：

```typescript
// components/artifact.tsx
import { markdownArtifact } from '@/artifacts/markdown/client';

// 更新 artifactDefinitions 数组
export const artifactDefinitions = [
  textArtifact,
  codeArtifact,
  imageArtifact,
  sheetArtifact,
  markdownArtifact, // 添加 Markdown Artifact
];
```

### 2.5 更新服务端文档处理器列表

在 `lib/artifacts/server.ts` 文件中导入并添加 Markdown 文档处理器：

```typescript
// lib/artifacts/server.ts
import { markdownDocumentHandler } from '@/artifacts/markdown/server';

// 更新 artifactKinds 数组
export const artifactKinds = [
  'text',
  'code',
  'image',
  'sheet',
  'markdown', // 添加 markdown 类型
] as const;

// 更新文档处理器数组
export const documentHandlersByArtifactKind = [
  textDocumentHandler,
  codeDocumentHandler,
  imageDocumentHandler,
  sheetDocumentHandler,
  markdownDocumentHandler, // 添加 markdown 文档处理器
];
```

### 2.6 创建 Markdown 图标组件

如果需要，在 `components/icons.tsx` 中添加 Markdown 图标：

```typescript
// components/icons.tsx
export const MarkdownIcon = ({ size = 24 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M20.56 18H3.44C2.65 18 2 17.37 2 16.59V7.41C2 6.63 2.65 6 3.44 6H20.56C21.35 6 22 6.63 22 7.41V16.59C22 17.37 21.35 18 20.56 18Z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M6 12V9M6 15V12M10 9L10 15M15 9V15L18 12L15 9Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
```

### 2.7 更新 AI 提示词

更新 `lib/ai/prompts.ts` 文件中的提示词，添加对 Markdown 类型的说明：

```typescript
// lib/ai/prompts.ts
export const artifactsPrompt = `
... 现有提示词 ...

以下是可用的文档类型:
- text: 通用文本文档
- code: 代码文档，支持语法高亮
- image: 图像生成
- sheet: 表格数据
- markdown: Markdown 格式文档，支持编辑和预览模式

当用户请求创建笔记、博客文章、文档大纲或结构化文档时，请使用 markdown 类型。
当需要创建带有标题、列表、表格等格式化内容的文档时，markdown 是理想选择。

... 其余提示词 ...
`;
```

### 2.8 添加 Markdown 更新文档提示词

在 `lib/ai/prompts.ts` 文件中添加针对 Markdown 的更新文档提示词：

```typescript
// lib/ai/prompts.ts
export const updateDocumentPrompt = (content: string, kind: ArtifactKind) => {
  // ... 现有代码 ...
  
  if (kind === 'markdown') {
    return `
你是一个专业的 Markdown 文档编辑助手。用户将提供现有的 Markdown 文档和修改请求。
你的任务是根据用户的要求修改文档，同时保持文档的 Markdown 格式和结构。

以下是当前的 Markdown 文档内容:
\`\`\`markdown
${content}
\`\`\`

请根据用户的描述修改文档。返回完整的修改后文档，保持良好的 Markdown 格式。
不要添加任何额外的解释或注释，只返回修改后的 Markdown 内容。
`;
  }
  
  // ... 其余代码 ...
};
```

### 2.9 安装必要的依赖

添加所需的依赖包：

```bash
npm install react-markdown react-syntax-highlighter
```

## 3. 测试 Markdown Artifact

完成上述实现后，您可以通过以下方式测试 Markdown Artifact 功能：

1. 启动应用服务器
2. 在聊天界面中，向 AI 请求创建一个 Markdown 文档，例如：
   ```
   请帮我创建一个关于人工智能发展历史的 Markdown 文档
   ```
3. AI 应该会选择 Markdown 类型，并创建具有适当格式的 Markdown 文档
4. 验证以下功能是否正常工作：
   - 文档创建和内容生成
   - 编辑和预览切换
   - Markdown 格式渲染
   - 复制和下载操作

## 4. 优化与扩展

实现基本功能后，您可以考虑以下优化和扩展：

### 4.1 添加更多 Markdown 工具栏功能

在 Markdown 编辑器中添加格式化工具栏，例如：

- 插入标题
- 添加列表
- 创建表格
- 插入链接
- 添加图片引用
- 插入代码块

### 4.2 支持更多 Markdown 扩展语法

扩展对 Markdown 语法的支持，如：

- 数学公式（使用 KaTeX 或 MathJax）
- 任务列表（checkbox）
- 脚注
- 高亮标记

### 4.3 添加导出功能

添加将 Markdown 导出为其他格式的功能：

- HTML
- PDF
- Word 文档

### 4.4 版本历史差异比较

改进 Markdown 文档的版本比较功能，实现更友好的差异显示：

- 行级差异高亮
- 结构化差异（标题、列表等）
- 合并版本功能

## 5. 注意事项

1. **性能考虑**：对于长篇 Markdown 文档，实时预览可能会影响性能，考虑实现延迟渲染或虚拟滚动
2. **安全性**：确保 Markdown 渲染时防止 XSS 攻击，特别是在允许内嵌 HTML 的情况下
3. **移动适配**：确保 Markdown 编辑器在移动设备上也有良好的体验
4. **无障碍性**：实现键盘导航和屏幕阅读器支持

## 总结

通过以上步骤，您可以在现有的 Artifact 系统中添加对 Markdown 文档的完整支持。这将大大增强用户的文档创建和编辑体验，特别是对于需要结构化内容的场景。

Markdown Artifact 实现后，用户可以利用 AI 来创建格式丰富的文档，同时保持对内容的完全控制。编辑和预览模式的切换让用户能够直观地看到最终效果，大大提高了文档创建的效率和质量。 