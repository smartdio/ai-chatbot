# UI 主题优化设计文档

## 1. 目标

将当前项目 UI 主题色从目前的基调优化为清新、纯净的蓝色调，旨在提升界面的个性化程度和整体视觉吸引力，同时保证用户体验的舒适度。

## 2. 当前实现分析

项目采用现代前端技术栈构建，样式管理方案清晰：

*   **框架与库:**
    *   前端框架: Next.js
    *   CSS 方案: Tailwind CSS (原子化 CSS)
    *   UI 组件库: shadcn/ui
*   **主题管理:**
    *   通过 `components.json` 文件配置 shadcn/ui，当前 `baseColor` 为 `zinc`，并已启用 CSS 变量 (`cssVariables: true`) 进行主题控制。
    *   核心颜色定义位于 CSS 变量中。
*   **样式定义:**
    *   `tailwind.config.ts`: 配置 Tailwind CSS，扩展了基础主题，其颜色定义（如 `primary`, `secondary`, `background` 等）均引用 CSS 变量（格式为 `hsl(var(--variable-name))`）。
    *   `app/globals.css`: 此文件是主题的核心。在 `@layer base` 中，针对 `:root` (亮色模式) 和 `.dark` (暗色模式) 选择器定义了详细的 HSL 格式的 CSS 颜色变量。这些变量直接控制了 shadcn/ui 组件和 Tailwind 工具类的最终颜色表现。

## 3. 优化方案

利用现有基于 CSS 变量的主题系统，通过修改 `app/globals.css` 文件中定义的颜色变量值来实现新的蓝色主题。这是侵入性最小且能保证全局一致性的最佳方案。

**具体步骤:**

1.  **定义新的蓝色调板:**
    *   **主色调 (Primary):** 选择一个核心的蓝色 HSL 值。例如，亮色模式可考虑 `217 91% 60%` 附近，暗色模式需微调亮度/饱和度以确保对比度，如 `217 91% 65%`。
    *   **辅助色 (Secondary):** 选择与主色调和谐搭配的浅蓝色或中性灰色调。
    *   **强调色 (Accent):** 可选用主色调的变体或对比鲜明的蓝色。
    *   **背景色 (Background) / 前景色 (Foreground):** 调整 HSL 值，使背景呈现非常淡的蓝色调或保持中性，确保前景文字与背景有足够的对比度。
    *   **其他 UI 元素颜色:** 包括边框 (`border`)、输入框 (`input`)、焦点环 (`ring`)、卡片背景 (`card`) 等，均需调整其对应的 CSS 变量，与新的蓝色主题保持一致。

2.  **修改 CSS 变量:**
    *   **目标文件:** `app/globals.css`
    *   **修改范围:** 定位到 `@layer base` 下的 `:root { ... }` 和 `.dark { ... }` 代码块。
    *   **操作:** 更新 `--background`, `--foreground`, `--primary`, `--secondary`, `--accent`, `--border`, `--input`, `--ring`, `--card` 等变量的 HSL 值，替换为新蓝色调板定义的颜色。
    *   **示例 (仅为概念演示，实际数值需细致设计):**

        ```css
        /* app/globals.css @layer base */
        :root {
            --background: 210 40% 98%; /* 示例：浅蓝灰背景 */
            --foreground: 215 28% 17%; /* 示例：深蓝前景 */
            --primary: 217 91% 60%;    /* 示例：主蓝色 */
            --primary-foreground: 210 40% 98%; /* 示例：主色上的文字 */
            /* ... 更新其他相关变量 ... */
            --ring: 217 91% 60%;       /* 示例：Ring 颜色同步主色 */
        }

        .dark {
            --background: 222 47% 11%; /* 示例：深蓝背景 */
            --foreground: 210 40% 98%; /* 示例：浅色前景 */
            --primary: 217 91% 65%;    /* 示例：暗模式主蓝色 */
            /* ... 更新其他相关变量 ... */
            --ring: 216 84% 54%;       /* 示例：暗模式 Ring 颜色 */
        }
        ```

3.  **(可选) 更新 `components.json`:**
    *   考虑将 `components.json` 中的 `"baseColor"` 字段从 `"zinc"` 修改为 `"blue"` 或其他描述性名称，以反映新的主题基调。这主要影响 `shadcn/ui` CLI 的行为和代码语义，实际颜色由 CSS 变量决定。

## 4. 验证

主题颜色变量修改完成后，必须进行全面的视觉和功能测试：

*   **跨组件/页面检查:** 确保所有 UI 组件（按钮、输入框、卡片、弹窗、侧边栏等）和主要页面在亮色和暗色模式下均正确应用新主题色。
*   **可读性与对比度:** 检查文本和背景、重要元素之间的对比度是否满足 WCAG (Web Content Accessibility Guidelines) 标准，保证信息的可读性。
*   **交互状态:** 验证元素的 `hover`, `focus`, `active`, `disabled` 等状态下的颜色是否清晰、一致且符合预期。
*   **特定元素:** 如图表 (`chart-N`)、特殊区域背景 (`sidebar`) 等的颜色变量也应一并检查和调整。

## 5. 下一步

待此设计方案确认后，即可着手按照上述步骤修改 `app/globals.css` 文件中的 CSS 变量，实施主题优化。 