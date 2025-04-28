# Artifact 实现流程图解

本文档通过多种流程图展示 Artifact 功能的实现过程、组件关系和数据流动。

## 1. Artifact 组件架构图

```mermaid
graph TD
    Client["客户端应用"]
    Chat["Chat 组件"]
    ArtifactComp["Artifact 组件"]
    DataStreamHandler["DataStreamHandler 组件"]
    ArtifactMessages["ArtifactMessages 组件"]
    ArtifactActions["ArtifactActions 组件"]
    UIArtifact["UIArtifact 状态"]
    ArtifactContent["Artifact 内容组件<br/>(根据类型不同)"]
    
    Client --> |包含| Chat
    Client --> |包含| ArtifactComp
    Client --> |包含| DataStreamHandler
    
    ArtifactComp --> |包含| ArtifactMessages
    ArtifactComp --> |包含| ArtifactActions
    ArtifactComp --> |包含| ArtifactContent
    
    UIArtifact --> |提供状态| ArtifactComp
    UIArtifact --> |提供状态| ArtifactMessages
    UIArtifact --> |提供状态| ArtifactActions
    UIArtifact --> |提供状态| ArtifactContent
    
    DataStreamHandler --> |更新| UIArtifact
    
    class Client,Chat,ArtifactComp,DataStreamHandler,ArtifactMessages,ArtifactActions,ArtifactContent react
    class UIArtifact state
```

## 2. Artifact 创建流程图

```mermaid
sequenceDiagram
    participant User as 用户
    participant Chat as 聊天界面
    participant AI as AI模型
    participant CD as createDocument工具
    participant DH as 文档处理器
    participant DSH as DataStreamHandler
    participant AC as Artifact组件
    
    User->>Chat: 发送消息
    Chat->>AI: 转发用户消息
    
    Note over AI: 基于artifactsPrompt判断<br/>是否需要创建文档
    
    AI->>CD: 调用createDocument工具<br/>(title, kind)
    CD->>DH: 调用对应类型的文档处理器
    
    DH->>DSH: 发送文档类型数据
    DH->>DSH: 发送文档ID数据
    DH->>DSH: 发送文档标题数据
    DH->>DSH: 发送清空内容指令
    
    Note over DH: 使用专用的Artifact模型<br/>生成文档内容
    
    loop 内容生成循环
        DH->>DSH: 发送内容增量数据
        DSH->>AC: 更新Artifact状态
        AC->>User: 实时显示生成内容
    end
    
    DH->>DSH: 发送完成信号
    DSH->>AC: 更新Artifact状态为idle
    
    CD->>AI: 返回创建结果
    AI->>Chat: 返回创建成功消息
    Chat->>User: 显示可点击的文档组件
```

## 3. 数据流处理图

```mermaid
graph LR
    API["API路由<br/>(/api/chat/route.ts)"]
    StreamText["streamText<br/>(AI生成过程)"]
    DataStream["DataStream<br/>(数据流)"]
    DSH["DataStreamHandler<br/>(数据流处理组件)"]
    ArtifactState["Artifact状态<br/>(useArtifact hook)"]
    ArtifactComp["Artifact组件<br/>(UI渲染)"]
    
    API --> |创建| StreamText
    StreamText --> |写入| DataStream
    DataStream --> |读取| DSH
    DSH --> |解析数据类型| DSH
    DSH --> |更新| ArtifactState
    ArtifactState --> |触发重渲染| ArtifactComp
    
    class API,StreamText,DataStream,DSH,ArtifactState,ArtifactComp flow
```

## 4. Artifact 状态管理图

```mermaid
stateDiagram-v2
    [*] --> Idle: 初始状态
    
    Idle --> Streaming: 创建文档开始
    Streaming --> Idle: 文档生成完成
    
    Idle --> Visible: 用户点击查看
    Visible --> Idle: 用户关闭Artifact
    
    Streaming --> Visible: 自动显示
    
    Idle --> [*]: 页面卸载
    
    state Visible {
        [*] --> EditMode
        EditMode --> DiffMode: 切换对比视图
        DiffMode --> EditMode: 切换回编辑视图
        
        EditMode --> PreviousVersion: 查看上一版本
        PreviousVersion --> NextVersion: 查看下一版本
        NextVersion --> LatestVersion: 查看最新版本
        LatestVersion --> EditMode: 返回编辑模式
    }
```

## 5. 组件交互关系图

```mermaid
graph TD
    subgraph "客户端应用"
        Chat["Chat 组件"]
        subgraph "Artifact功能"
            ArtifactComp["Artifact 主组件"]
            ArtifactActions["操作按钮组件"]
            ArtifactMessages["消息组件"]
            ArtifactContent["内容展示组件"]
            DataStreamHandler["数据流处理器"]
        end
        
        subgraph "状态管理"
            useArtifact["useArtifact hook"]
            UIArtifactState["UIArtifact 状态"]
            metadata["元数据"]
        end
    end
    
    subgraph "服务端"
        chatAPI["聊天API"]
        createDocumentTool["createDocument工具"]
        updateDocumentTool["updateDocument工具"]
        documentHandlers["文档处理器<br/>(text/code/image/sheet)"]
        artifactLanguageModel["专用Artifact模型"]
    end
    
    Chat <--> chatAPI
    chatAPI --> createDocumentTool
    chatAPI --> updateDocumentTool
    
    createDocumentTool --> documentHandlers
    updateDocumentTool --> documentHandlers
    documentHandlers --> artifactLanguageModel
    
    documentHandlers --> |数据流| DataStreamHandler
    DataStreamHandler --> useArtifact
    useArtifact --> UIArtifactState
    useArtifact --> metadata
    
    UIArtifactState --> ArtifactComp
    UIArtifactState --> ArtifactActions
    UIArtifactState --> ArtifactMessages
    UIArtifactState --> ArtifactContent
    metadata --> ArtifactContent
    
    Chat <--> ArtifactMessages
```

## 6. 并行对话与文档生成流程

```mermaid
sequenceDiagram
    participant User as 用户
    participant Chat as 聊天界面
    participant ArtifactComp as Artifact组件
    participant AI as AI聊天模型
    participant ArtifactModel as Artifact专用模型
    participant DataHandler as 数据流处理器
    
    User->>Chat: 请求创建文档
    Chat->>AI: 转发请求
    AI->>ArtifactModel: 调用专用模型生成文档
    AI->>Chat: 返回创建成功消息
    Chat->>User: 显示文档创建成功
    
    par 文档生成线程
        ArtifactModel->>DataHandler: 流式生成文档内容
        DataHandler->>ArtifactComp: 更新Artifact状态
        ArtifactComp->>User: 实时显示生成内容
    and 对话线程
        User->>Chat: 继续发送新消息
        Chat->>AI: 处理新消息
        AI->>Chat: 回复新消息
        Chat->>User: 显示AI回复
    end
    
    Note over ArtifactModel,DataHandler: 文档生成完成
    ArtifactComp->>User: 显示完整文档
```

## 7. Artifact 系统与模型关系图

```mermaid
graph LR
    subgraph "用户界面层"
        Chat["聊天界面"]
        ArtifactUI["Artifact界面"]
        MessageList["消息列表"]
    end
    
    subgraph "状态管理层"
        ArtifactState["Artifact状态"]
        ChatState["聊天状态"]
        DataStream["数据流"]
    end
    
    subgraph "业务逻辑层"
        ArtifactHandler["Artifact处理器"]
        DocumentCreator["文档创建器"]
        DocumentUpdater["文档更新器"]
    end
    
    subgraph "模型层"
        ChatModel["聊天模型<br/>(chat-model)"]
        ArtifactModel["Artifact专用模型<br/>(artifact-model)"]
        TitleModel["标题生成模型<br/>(title-model)"]
    end
    
    Chat --> ChatState
    ArtifactUI --> ArtifactState
    MessageList --> ChatState
    
    ChatState --> ChatModel
    ArtifactState --> ArtifactHandler
    
    ArtifactHandler --> DocumentCreator
    ArtifactHandler --> DocumentUpdater
    
    DocumentCreator --> ArtifactModel
    DocumentUpdater --> ArtifactModel
    ChatModel --> TitleModel
    
    DataStream --> ArtifactState
    DataStream --> ChatState
    
    ChatModel -.-> |创建文档决策| DocumentCreator
    DocumentCreator -.-> ArtifactUI
    DocumentUpdater -.-> ArtifactUI
```

## 8. Artifact 类型与处理器关系图

```mermaid
classDiagram
    class Artifact {
        +kind: string
        +description: string
        +content: ComponentType
        +actions: Array~ArtifactAction~
        +toolbar: Array~ArtifactToolbarItem~
        +initialize(): void
        +onStreamPart(): void
    }
    
    class UIArtifact {
        +title: string
        +documentId: string
        +kind: ArtifactKind
        +content: string
        +isVisible: boolean
        +status: 'streaming' | 'idle'
        +boundingBox: Object
    }
    
    class DocumentHandler {
        +kind: ArtifactKind
        +onCreateDocument(): Promise~void~
        +onUpdateDocument(): Promise~void~
    }
    
    class TextArtifact {
        +kind: 'text'
    }
    
    class CodeArtifact {
        +kind: 'code'
    }
    
    class ImageArtifact {
        +kind: 'image'
    }
    
    class SheetArtifact {
        +kind: 'sheet'
    }
    
    class TextDocumentHandler {
        +kind: 'text'
    }
    
    class CodeDocumentHandler {
        +kind: 'code'
    }
    
    class ImageDocumentHandler {
        +kind: 'image'
    }
    
    class SheetDocumentHandler {
        +kind: 'sheet'
    }
    
    Artifact <|-- TextArtifact
    Artifact <|-- CodeArtifact
    Artifact <|-- ImageArtifact
    Artifact <|-- SheetArtifact
    
    DocumentHandler <|-- TextDocumentHandler
    DocumentHandler <|-- CodeDocumentHandler
    DocumentHandler <|-- ImageDocumentHandler
    DocumentHandler <|-- SheetDocumentHandler
    
    TextArtifact -- TextDocumentHandler
    CodeArtifact -- CodeDocumentHandler
    ImageArtifact -- ImageDocumentHandler
    SheetArtifact -- SheetDocumentHandler
    
    UIArtifact -- Artifact
```

上述流程图展示了 Artifact 系统的各个方面，包括:

1. 组件架构和层次关系
2. 创建流程和数据流动
3. 状态管理和状态转换
4. 组件之间的交互关系
5. 并行处理机制
6. 系统与模型的关系
7. Artifact 类型与处理器的关系

这些图表共同描绘了 Artifact 功能的完整实现逻辑和技术架构。 