

---

## 第32章 Business-UI Tiptap 富文本编辑器

### 32.1 系统架构

Tiptap 富文本编辑器基于 Tiptap v2 + React 构建，提供完整的文本格式化、列表、代码块、图片上传、附件、链接等富文本编辑功能。

| 目录 | 文件数 | 总行数 | 职责 |
|------|--------|--------|------|
| 根目录 | 3 | ~350 | 编辑器核心组件 |
| components/ | 13 | ~800 | 工具栏按钮组件 |
| extensions/ | 4 | ~1,400 | Tiptap 扩展 |
| hooks/ | 1 | ~100 | 编辑器 Hook |
| 总计 | 21 | ~3,291 | |

#### 文件清单

| 文件 | 行数 | 职责 |
|------|------|------|
| `tiptap-editor-complete.tsx` | 112 | 开箱即用的完整编辑器（预配置工具栏） |
| `tiptap-editor.tsx` | ~200 | 编辑器核心（Provider+Toolbar+Content） |
| `index.ts` | 10 | 桶导出 |
| `hooks/use-tiptap-editor.ts` | ~100 | useEditor Hook 封装 |
| `extensions/complete-kit.ts` | ~80 | 扩展集合（StarterKit+自定义扩展） |
| `extensions/attachment.tsx` | 539 | 附件扩展 |
| `extensions/image.tsx` | 456 | 图片扩展（上传+预览+调整大小） |
| `extensions/code-block-shiki.tsx` | 236 | 代码块扩展（Shiki 语法高亮） |
| `components/undo-redo-toolbar-button.tsx` | 54 | 撤销/重做 |
| `components/heading-toolbar-button.tsx` | ~60 | 标题（H1-H6） |
| `components/mark-toolbar-button.tsx` | ~60 | 文本标记（粗体/斜体/下划线/删除线/代码） |
| `components/list-toolbar-button.tsx` | ~60 | 列表（无序/有序/任务） |
| `components/text-align-toolbar-button.tsx` | ~60 | 文本对齐 |
| `components/link-toolbar-button.tsx` | ~80 | 链接 |
| `components/color-highlight-toolbar-button.tsx` | ~80 | 颜色/高亮 |
| `components/code-block-toolbar-button.tsx` | ~50 | 代码块 |
| `components/blockquote-toolbar-button.tsx` | ~50 | 引用 |
| `components/horizontal-rule-toolbar-button.tsx` | ~40 | 水平分割线 |
| `components/image-upload-toolbar-button.tsx` | ~80 | 图片上传 |
| `components/attachment-toolbar-button.tsx` | ~60 | 附件 |
| `components/link-edit-form.tsx` | ~80 | 链接编辑表单 |
| `components/link-hover-toolbar.tsx` | ~60 | 链接悬浮工具栏 |

### 32.2 TiptapEditorComplete 组件

#### Props

```typescript
interface TiptapEditorCompleteProps extends Omit<TiptapEditorProps, 'extensions'> {
  placeholder?: string;
}
```

继承 `TiptapEditorProps`，移除 `extensions`（由内部配置），添加 `placeholder`。

#### 默认工具栏配置

```tsx
function DefaultToolbar() {
  return (
    <TiptapEditorToolbar>
      <UndoRedoToolbarButton action="undo" />
      <UndoRedoToolbarButton action="redo" />
      <TiptapEditorToolbarSeparator />

      <HeadingToolbarButton level={1} />
      <HeadingToolbarButton level={2} />
      <HeadingToolbarButton level={3} />
      <TiptapEditorToolbarSeparator />

      <MarkToolbarButton type="bold" />
      <MarkToolbarButton type="italic" />
      <MarkToolbarButton type="underline" />
      <MarkToolbarButton type="strike" />
      <MarkToolbarButton type="code" />
      <TiptapEditorToolbarSeparator />

      <ColorHighlightToolbarButton type="color" />
      <ColorHighlightToolbarButton type="highlight" />
      <TiptapEditorToolbarSeparator />

      <ListToolbarButton type="bulletList" />
      <ListToolbarButton type="orderedList" />
      <ListToolbarButton type="taskList" />
      <TiptapEditorToolbarSeparator />

      <TextAlignToolbarButton align="left" />
      <TextAlignToolbarButton align="center" />
      <TextAlignToolbarButton align="right" />
      <TiptapEditorToolbarSeparator />

      <LinkToolbarButton />
      <ImageUploadToolbarButton />
      <AttachmentToolbarButton />
      <CodeBlockToolbarButton />
      <BlockquoteToolbarButton />
      <HorizontalRuleToolbarButton />
    </TiptapEditorToolbar>
  );
}
```

工具栏分组：
1. **撤销/重做**：Undo、Redo
2. **标题**：H1、H2、H3
3. **文本标记**：Bold、Italic、Underline、Strike、Code
4. **颜色**：文字颜色、背景高亮
5. **列表**：无序列表、有序列表、任务列表
6. **对齐**：左对齐、居中、右对齐
7. **插入**：链接、图片、附件、代码块、引用、水平线

### 32.3 TiptapEditor 核心组件

#### 组件结构

```tsx
function TiptapEditor({ className, extensions, value, onValueChange, children, ...props }) {
  return (
    <EditorProvider extensions={extensions} content={value} onUpdate={({ editor }) => onValueChange?.(editor.getHTML())} {...props}>
      <div className={cn('flex flex-col rounded-md border border-input', className)}>
        {children}
      </div>
    </EditorProvider>
  );
}
```

子组件：
- `TiptapEditorToolbar` — 工具栏容器（sticky top-0 z-10）
- `TiptapEditorToolbarSeparator` — 工具栏分隔线
- `TiptapEditorContent` — 编辑区域（prose 样式）

#### 受控模式

```typescript
interface TiptapEditorProps {
  value?: string;                    // HTML 内容
  onValueChange?: (html: string) => void;
  extensions?: Extensions;          // Tiptap 扩展配置
  editable?: boolean;                // 是否可编辑
  className?: string;
  ariaInvalid?: boolean;             // 校验失败样式
  ariaDisabled?: boolean;            // 禁用样式
  children?: ReactNode;
}
```

`value` 为 HTML 字符串，通过 `onValueChange` 回调输出 HTML。

### 32.4 CompleteKit 扩展集合

```typescript
export const CompleteKit = StarterKit.configure({
  heading: { levels: [1, 2, 3, 4, 5, 6] },
  codeBlock: false,  // 禁用默认代码块，使用 Shiki 扩展
  link: {
    openOnClick: false,
    HTMLAttributes: { class: 'text-primary underline underline-offset-2' },
  },
  placeholder: { placeholder: '在此输入...' },
});
```

StarterKit 包含的扩展：
- Document、Paragraph、Text（基础节点）
- Heading（标题 H1-H6）
- Bold、Italic、Strike、Code（文本标记）
- BulletList、OrderedList、ListItem（列表）
- Blockquote（引用）
- HorizontalRule（水平线）
- HardBreak（换行）
- History（撤销/重做）

额外配置：
- `codeBlock: false` — 禁用默认代码块，使用 CodeBlockShiki 扩展
- `link` — 链接扩展，不自定义打开链接
- `placeholder` — 占位符文本
- `Underline` — 下划线扩展
- `TaskList`/`TaskItem` — 任务列表扩展
- `TextStyle` — 文本样式（颜色）
- `Highlight` — 高亮扩展
- `Color` — 文字颜色扩展
- `TextAlign` — 文本对齐扩展
- `ImageUpload` — 自定义图片上传扩展
- `AttachmentExt` — 自定义附件扩展
- `CodeBlockShiki` — 代码块扩展（Shiki 语法高亮）

### 32.5 图片扩展（image.tsx，456行）

图片扩展是系统中最复杂的扩展，实现图片上传、预览、调整大小等功能。

#### 功能

1. **上传**：通过 dataloom SDK 上传图片到云存储
2. **拖拽插入**：支持拖拽图片文件到编辑器
3. **粘贴插入**：支持粘贴图片
4. **调整大小**：拖拽手柄调整图片尺寸
5. **对齐**：左/中/右对齐
6. **删除**：删除图片节点

#### NodeView 组件

```tsx
const ImageView = ({ node, updateAttributes, deleteNode, selected, extension }) => {
  const [resizing, setResizing] = useState(false);
  const [size, setSize] = useState({ width: node.attrs.width, height: node.attrs.height });

  const handleResize = (e, direction) => {
    // 计算新尺寸
    const newWidth = ...;
    const newHeight = ...;
    setSize({ width: newWidth, height: newHeight });
  };

  const handleResizeEnd = () => {
    updateAttributes({ width: size.width, height: size.height });
    setResizing(false);
  };

  return (
    <NodeViewWrapper className="relative inline-block" style={{ width: size.width }}>
      <img src={node.attrs.src} alt={node.attrs.alt} style={{ width: size.width, height: size.height }} />
      {selected && (
        <>
          {/* 调整大小手柄 */}
          <div className="resize-handle" onMouseDown={...} />
          {/* 对齐按钮 */}
          <div className="align-buttons">
            <button onClick={() => updateAttributes({ textAlign: 'left' })}>Left</button>
            <button onClick={() => updateAttributes({ textAlign: 'center' })}>Center</button>
            <button onClick={() => updateAttributes({ textAlign: 'right' })}>Right</button>
          </div>
        </>
      )}
    </NodeViewWrapper>
  );
};
```

### 32.6 附件扩展（attachment.tsx，539行）

#### 功能

1. **上传附件**：通过 dataloom SDK 上传文件
2. **显示附件卡片**：文件名、大小、类型图标
3. **下载链接**：点击下载
4. **删除附件**：删除节点

#### NodeSchema

```typescript
const AttachmentNode = Node.create({
  name: 'attachment',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      fileName: { default: '' },
      fileSize: { default: 0 },
      fileType: { default: '' },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-attachment]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-attachment': '' })];
  },

  renderText({ node }) {
    return `[附件: ${node.attrs.fileName}]`;
  },
});
```

### 32.7 代码块扩展（code-block-shiki.tsx，236行）

使用 Shiki 实现代码语法高亮，替代 Tiptap 默认的 lowlight 方案。

```typescript
const CodeBlockShiki = CodeBlockLowlight.extend({
  addOptions() {
    return {
      defaultLanguage: 'plaintext',
      ...this.parent?.(),
    };
  },
}).configure({
  defaultLanguage: 'typescript',
});
```

Shiki 优势：
- 高质量语法高亮（VS Code 同款）
- 支持 100+ 语言
- 主题可定制
- 异步加载语言定义

### 32.8 工具栏按钮组件

所有工具栏按钮遵循相同的模式：

```tsx
export function MarkToolbarButton({ type, ...props }) {
  const { editor } = useTiptapEditor();

  if (!editor) return null;

  const isActive = editor.isActive(type);
  const Icon = markIcons[type]; // Bold, Italic, Underline, etc.

  return (
    <TiptapToolbarButton
      isActive={isActive}
      onClick={() => editor.chain().focus().toggleMark(type).run()}
      disabled={!editor.can().toggleMark(type)}
      {...props}
    >
      <Icon className="size-4" />
    </TiptapToolbarButton>
  );
}
```

| 按钮 | 类型 | Tiptap 命令 |
|------|------|------------|
| Bold | mark | `toggleMark('bold')` |
| Italic | mark | `toggleMark('italic')` |
| Underline | mark | `toggleMark('underline')` |
| Strike | mark | `toggleMark('strike')` |
| Code | mark | `toggleMark('code')` |
| H1-H6 | node | `toggleHeading({ level: N })` |
| BulletList | node | `toggleBulletList()` |
| OrderedList | node | `toggleOrderedList()` |
| TaskList | node | `toggleTaskList()` |
| TextAlign | align | `setTextAlign('left/center/right')` |
| Link | link | `setLink({ href })` / `unsetLink()` |
| CodeBlock | node | `toggleCodeBlock()` |
| Blockquote | node | `toggleBlockquote()` |
| HorizontalRule | node | `setHorizontalRule()` |

### 32.9 useTiptapEditor Hook

```typescript
export function useTiptapEditor() {
  const editor = useEditorContext();

  if (!editor) {
    throw new Error('useTiptapEditor must be used within TiptapEditor');
  }

  return { editor };
}
```

提供对 Tiptap 编辑器实例的访问，用于工具栏按钮和其他子组件。

### 32.10 使用示例

```tsx
function RichTextEditor({ value, onChange, placeholder, invalid, disabled }) {
  return (
    <TiptapEditorComplete
      value={value}
      onValueChange={onChange}
      placeholder={placeholder || '请输入...'}
      aria-invalid={invalid}
      aria-disabled={disabled}
    />
  );
}
```

### 32.11 导出清单

```typescript
export { TiptapEditorComplete };
export { TiptapEditor, TiptapEditorContent, TiptapEditorToolbar, TiptapEditorToolbarSeparator };
export { useTiptapEditor };
export { CompleteKit };
export type { TiptapEditorCompleteProps, TiptapEditorProps };
```
