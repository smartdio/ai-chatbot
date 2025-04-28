# Artifact 实现指南

## 介绍

Artifact 是一种特殊的用户界面模式，用于帮助用户进行写作、编辑和其他内容创建任务。当 Artifact 打开时，它位于屏幕的右侧，而对话则位于左侧。通过 Artifact 功能，AI 助手可以创建各种类型的文档（如文本、代码、图表等）并实时显示给用户。

## Artifact 架构

### 核心组件

1. **`Artifact`组件** (`artifact.tsx`)
   - 主要展示界面，包含文档内容和操作按钮
   - 处理文档的版本控制和差异对比
   - 管理文档状态和元数据

2. **`ArtifactMessages`组件** (`artifact-messages.tsx`)
   - 在 Artifact 界面左侧显示对话消息
   - 与主对话区域同步消息内容
   - 支持国际化(i18n)

3. **`ArtifactActions`组件** (`artifact-actions.tsx`)
   - 提供对 Artifact 的各种操作按钮
   - 支持复制、下载、编辑和视图切换等功能
   - 支持版本控制（上一版本、下一版本、最新版本）

4. **`DataStreamHandler`组件** (`data-stream-handler.tsx`)
   - 处理AI生成的实时数据流
   - 更新 Artifact 的内容、状态和元数据

### 状态管理

项目使用 `useArtifact` hook 进行状态管理：

```typescript
// 位于 hooks/use-artifact.ts
export function useArtifact() {
  const { data: localArtifact, mutate: setLocalArtifact } = useSWR<UIArtifact>(
    'artifact',
    null,
    {
      fallbackData: initialArtifactData,
    },
  );

  // ...

  return useMemo(
    () => ({
      artifact,
      setArtifact,
      metadata: localArtifactMetadata,
      setMetadata: setLocalArtifactMetadata,
    }),
    [artifact, setArtifact, localArtifactMetadata, setLocalArtifactMetadata],
  );
}
```

此 hook 提供以下状态：
- `artifact`: 当前 artifact 的状态
- `setArtifact`: 更新 artifact 状态的函数
- `metadata`: artifact 相关的元数据
- `setMetadata`: 更新元数据的函数

## Artifact 类型

项目支持多种 Artifact 类型：

```typescript
export const artifactDefinitions = [
  textArtifact,
  codeArtifact,
  imageArtifact,
  sheetArtifact,
];
```

每种 Artifact 类型都定义了特定的行为和内容渲染方式。

## 在对话中显示 Artifact 界面

### 基本流程

1. 在应用的主要布局中，`Chat` 组件和 `Artifact` 组件并列存在：

```tsx
// 在 app/(chat)/page.tsx 中
return (
  <>
    <Chat
      key={id}
      id={id}
      initialMessages={[]}
      selectedChatModel={modelIdFromCookie.value}
      selectedVisibilityType="private"
      isReadonly={false}
    />
    <DataStreamHandler id={id} />
  </>
);
```

2. `Artifact` 组件通过 `artifact.isVisible` 状态决定是否显示：

```tsx
return (
  <AnimatePresence>
    {artifact.isVisible && (
      <motion.div
        data-testid="artifact"
        className="flex flex-row h-dvh w-dvw fixed top-0 left-0 z-50 bg-transparent"
        // ...动画属性
      >
        {/* Artifact 内容 */}
      </motion.div>
    )}
  </AnimatePresence>
);
```

3. 渲染 Artifact 使用了 Framer Motion 动画库，提供流畅的过渡效果

### 响应式设计

Artifact 界面支持移动设备和桌面设备：

```tsx
const { width: windowWidth, height: windowHeight } = useWindowSize();
const isMobile = windowWidth ? windowWidth < 768 : false;

// 不同设备下的动画和布局处理
<motion.div
  className="fixed dark:bg-muted bg-background h-dvh flex flex-col overflow-y-scroll md:border-l dark:border-zinc-700 border-zinc-200"
  initial={
    isMobile
      ? { /* 移动端初始状态 */ }
      : { /* 桌面端初始状态 */ }
  }
  animate={
    isMobile
      ? { /* 移动端动画 */ }
      : { /* 桌面端动画 */ }
  }
  // ...
>
```

## Artifact 文档创建流程

### 1. AI 触发文档创建

AI 通过 `createDocument` 工具创建文档：

```typescript
// lib/ai/tools/create-document.ts
export const createDocument = ({ session, dataStream }: CreateDocumentProps) =>
  tool({
    // ...
    execute: async ({ title, kind }) => {
      const id = generateUUID();
      
      // 发送文档类型到数据流
      dataStream.writeData({
        type: 'kind',
        content: kind,
      });
      
      // 发送文档ID到数据流
      dataStream.writeData({
        type: 'id',
        content: id,
      });
      
      // 发送文档标题到数据流
      dataStream.writeData({
        type: 'title',
        content: title,
      });
      
      // 清空内容
      dataStream.writeData({
        type: 'clear',
        content: '',
      });
      
      // 查找匹配的文档处理器
      const documentHandler = documentHandlersByArtifactKind.find(
        (documentHandlerByArtifactKind) =>
          documentHandlerByArtifactKind.kind === kind,
      );
      
      // 使用文档处理器创建文档
      await documentHandler.onCreateDocument({
        id,
        title,
        dataStream,
        session,
      });
      
      // 结束流处理
      dataStream.writeData({ type: 'finish', content: '' });
      
      return {
        id,
        title,
        kind,
        content: 'A document was created and is now visible to the user.',
      };
    },
  });
```

### 2. 数据流处理

`DataStreamHandler` 组件监听数据流并更新 Artifact 状态：

```tsx
// components/data-stream-handler.tsx
useEffect(() => {
  if (!dataStream?.length) return;

  const newDeltas = dataStream.slice(lastProcessedIndex.current + 1);
  lastProcessedIndex.current = dataStream.length - 1;

  (newDeltas as DataStreamDelta[]).forEach((delta: DataStreamDelta) => {
    // 调用特定 Artifact 类型的流处理方法
    const artifactDefinition = artifactDefinitions.find(
      (artifactDefinition) => artifactDefinition.kind === artifact.kind,
    );

    if (artifactDefinition?.onStreamPart) {
      artifactDefinition.onStreamPart({
        streamPart: delta,
        setArtifact,
        setMetadata,
      });
    }

    // 根据数据类型更新 Artifact 状态
    setArtifact((draftArtifact) => {
      // ...
      switch (delta.type) {
        case 'id': 
          return { ...draftArtifact, documentId: delta.content as string, status: 'streaming' };
        case 'title':
          return { ...draftArtifact, title: delta.content as string, status: 'streaming' };
        // ...其他类型处理
      }
    });
  });
}, [dataStream, setArtifact, setMetadata, artifact]);
```

### 3. 文档处理器

每种 Artifact 类型都有自己的文档处理器：

```typescript
// artifacts/text/server.ts 示例
export const textDocumentHandler = createDocumentHandler<'text'>({
  kind: 'text',
  onCreateDocument: async ({ title, dataStream }) => {
    let draftContent = '';

    const { fullStream } = streamText({
      model: myProvider.languageModel('artifact-model'),
      system: '...',
      prompt: title,
    });

    for await (const delta of fullStream) {
      if (delta.type === 'text-delta') {
        const { textDelta } = delta;
        draftContent += textDelta;
        
        // 发送内容增量到数据流
        dataStream.writeData({
          type: 'text-delta',
          content: textDelta,
        });
      }
    }

    return draftContent;
  },
  // ...
});
```

## 在对话中创建 Artifact

### 1. AI 决策何时创建 Artifact

AI 基于 `artifactsPrompt` 的指导决定何时创建 Artifact：

```
**When to use \`createDocument\`:**
- For substantial content (>10 lines) or code
- For content users will likely save/reuse (emails, code, essays, etc.)
- When explicitly requested to create a document
- For when content contains a single code snippet

**When NOT to use \`createDocument\`:**
- For informational/explanatory content
- For conversational responses
- When asked to keep it in chat
```

### 2. 用户交互流程

1. 用户发送消息（例如："帮我写一篇关于人工智能的文章"）
2. AI 决定创建一个文档并调用 `createDocument` 工具
3. `DataStreamHandler` 接收数据流并更新 Artifact 状态
4. Artifact 组件显示在界面上，包含 AI 生成的内容
5. 用户可以查看、编辑或关闭 Artifact

### 3. 在消息中显示创建结果

创建 Artifact 后，在消息流中显示一个可点击的组件：

```tsx
// components/document.tsx
function PureDocumentToolResult({
  type,
  result,
  isReadonly,
}: DocumentToolResultProps) {
  const { setArtifact } = useArtifact();

  return (
    <button
      type="button"
      className="bg-background cursor-pointer border py-2 px-3 rounded-xl w-fit flex flex-row gap-3 items-start"
      onClick={(event) => {
        // ...
        setArtifact({
          documentId: result.id,
          kind: result.kind,
          content: '',
          title: result.title,
          isVisible: true,
          status: 'idle',
          boundingBox,
        });
      }}
    >
      {/* 按钮内容 */}
    </button>
  );
}
```

## 总结

Artifact 功能是一个复杂而强大的系统，允许 AI 创建和管理各种类型的文档，并提供实时反馈和交互。它的核心优势包括：

1. **实时文档生成**：AI 可以创建各种类型的文档并实时更新
2. **版本控制**：支持文档的版本历史和差异对比
3. **丰富的交互**：提供复制、下载、编辑等多种操作
4. **响应式设计**：同时支持移动和桌面设备
5. **流式数据处理**：通过数据流处理实现流畅的内容生成体验

通过上述架构和流程，Artifact 功能为用户提供了一种高效的方式来与 AI 协作创建和编辑内容。 

## 常见问题解答

### 1. Artifact 提示词是如何包装进发送的消息中的？

Artifact 的提示词通过系统提示（system prompt）包装进发送给 AI 模型的消息中。具体实现如下：

```typescript
// lib/ai/prompts.ts
export const systemPrompt = ({
  selectedChatModel,
}: {
  selectedChatModel: string;
}) => {
  if (selectedChatModel === 'chat-model-reasoning') {
    return regularPrompt;
  } else {
    return `${regularPrompt}\n\n${artifactsPrompt}`;
  }
};
```

其中 `artifactsPrompt` 包含了 Artifact 的使用指南，指导 AI 模型何时创建文档以及如何使用各种工具。这个提示词会在每次对话请求时自动包含在系统提示中，除非使用的是特定的推理模型（chat-model-reasoning）。

在服务端处理聊天请求时，这个系统提示会被传递给语言模型：

```typescript
// app/(chat)/api/chat/route.ts
const result = streamText({
  model: myProvider.languageModel(selectedChatModel),
  system: systemPrompt({ selectedChatModel }),
  messages,
  // ...
});
```

### 2. 是否需要专用的模型来创建 Artifact？

是的，创建 Artifact 内容时使用了专门的模型。从代码实现来看，项目为 Artifact 生成配置了专用的模型：

```typescript
// lib/ai/providers.ts
export const myProvider = isTestEnvironment
  ? customProvider({
      // 测试环境下的模型配置
    })
  : customProvider({
      languageModels: {
        'chat-model': /* 普通聊天模型 */,
        'pro-model': /* 专业模型 */,
        'title-model': /* 标题生成模型 */,
        'artifact-model': xai('grok-2-1212'), // Artifact专用模型
      },
      // ...
    });
```

当创建 Artifact 内容时，会使用这个专用模型：

```typescript
// artifacts/text/server.ts 示例
const { fullStream } = streamText({
  model: myProvider.languageModel('artifact-model'),
  system: '...',
  prompt: title,
});
```

这样设计的好处是可以针对不同类型的内容生成任务使用专门优化的模型，提高生成质量和效率。

### 3. 创建 Artifact 的过程中是否可以同步继续进行聊天对话？

是的，系统支持在创建 Artifact 的同时继续聊天对话。这是通过以下几个关键设计实现的：

1. **独立的数据流处理**：
   
   `DataStreamHandler` 组件独立于主聊天流程，可以同时处理 Artifact 的数据流更新：
   
   ```tsx
   // app/(chat)/page.tsx
   return (
     <>
       <Chat
         // Chat组件属性...
       />
       <DataStreamHandler id={id} />
     </>
   );
   ```

2. **Artifact 界面中的聊天功能**：
   
   Artifact 侧边栏包含完整的聊天界面，允许用户在查看 Artifact 的同时继续对话：
   
   ```tsx
   // components/artifact.tsx
   <ArtifactMessages
     chatId={chatId}
     status={status}
     votes={votes}
     messages={messages}
     setMessages={setMessages}
     reload={reload}
     isReadonly={isReadonly}
     artifactStatus={artifact.status}
   />
   
   <form className="flex flex-row gap-2 relative items-end w-full px-4 pb-4">
     <MultimodalInput
       chatId={chatId}
       input={input}
       setInput={setInput}
       handleSubmit={handleSubmit}
       status={status}
       stop={stop}
       attachments={attachments}
       setAttachments={setAttachments}
       messages={messages}
       append={append}
       className="bg-background dark:bg-muted"
       setMessages={setMessages}
     />
   </form>
   ```

3. **状态同步机制**：
   
   聊天状态和 Artifact 状态相互独立但又保持同步，确保用户可以在 Artifact 生成的同时继续对话交互。

这种设计使得用户体验更加流畅，可以在等待 Artifact 生成的过程中继续与 AI 助手交互，而不必等待文档完全生成。 