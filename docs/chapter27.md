

---

## 第27章 语音录入与AI识别系统

### 27.1 系统架构与文件结构

语音录入系统是热处理收发货管理系统的现场作业辅助能力，支持通过语音快速录入产品信息，减少键盘输入操作。

| 层 | 文件路径 | 行数 | 职责 |
|----|---------|------|------|
| 前端组件 | `client/src/components/VoiceInput/VoiceInputButton.tsx` | 220 | Web Speech API集成，录音按钮，实时转写 |
| 前端组件 | `client/src/components/VoiceInput/VoiceInputPanel.tsx` | 265 | 语音录入面板，AI解析结果展示与编辑 |
| 前端组件 | `client/src/components/VoiceInput/AIRecognitionDialog.tsx` | 439 | AI多模态识别对话框（文本/图片） |
| 前端API | `client/src/api/index.ts` | ~10 | parseVoiceInput函数封装 |
| 后端服务 | `server/modules/voice/voice.service.ts` | 182 | AI插件调用，语音文本解析为结构化数据 |
| 后端控制器 | `server/modules/voice/voice.controller.ts` | 17 | POST /api/voice/parse 路由 |
| 后端模块 | `server/modules/voice/voice.module.ts` | — | NestJS模块注册 |

系统完整流程：

```
用户点击麦克风按钮
    │
    ▼
VoiceInputButton 启动录音
    │  ├── 创建 SpeechRecognition 实例
    │  ├── 配置: lang='zh-CN', continuous=true, interimResults=true
    │  └── onresult 回调实时更新转写文本
    │
    ▼
获取 finalTranscript（完整转写文本）
    │
    ▼
VoiceInputPanel 调用 parseVoiceInput(text, 'inbound')
    │
    ▼
POST /api/voice/parse { text, context }
    │
    ▼
VoiceService.parseVoiceInput(dto)
    │  ├── 空值检查
    │  ├── buildParsePrompt(text, context) 构建 AI Prompt
    │  ├── callAIForParsing(prompt) 调用 AI 插件
    │  │    ├── capabilityService.load('intelligent_writing_quick_quality_1')
    │  │    ├── .call('textGenerate', { prompt })
    │  │    ├── 获取返回的 content
    │  │    ├── 正则匹配 JSON: content.match(/\{[\s\S]*\}/)
    │  │    ├── JSON.parse 解析
    │  │    └── parseNumber 转换数字字段
    │  └── 返回 { success: true, data: result, rawText: text }
    │
    ▼
前端接收解析结果
    │  ├── 成功: setParseResult + setEditedData + toast.success
    │  └── 失败: toast.error(result.error)
    │
    ▼
VoiceInputPanel 展示可编辑表单（8字段）
    │  ├── 用户核对/修改 AI 解析结果
    │  └── 必填字段校验（productName/unit/unitPrice）
    │
    ▼
用户点击"应用" → handleApply()
    │  ├── 验证必填字段
    │  ├── 调用 onApply(editedData)
    │  └── toast.success('已应用语音录入数据')
    │
    ▼
父组件接收数据，应用到表单
```

### 27.2 VoiceInputButton组件（220行）

#### Web Speech API TypeScript接口定义

组件在文件顶部定义了完整的 Web Speech API 类型声明，因为 TypeScript 默认不包含这些类型：

```typescript
interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
  readonly resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}
```

全局声明：

```typescript
declare global {
  interface Window {
    SpeechRecognition?: { new (): SpeechRecognition };
    webkitSpeechRecognition?: { new (): SpeechRecognition };
  }
}
```

#### Props接口

```typescript
interface VoiceInputButtonProps {
  onResult: (text: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
}
```

#### 状态管理

```typescript
const [isRecording, setIsRecording] = useState<boolean>(false);
const [isProcessing, setIsProcessing] = useState<boolean>(false);
const [interimText, setInterimText] = useState<string>('');
const recognitionRef = useRef<SpeechRecognition | null>(null);
```

- `isRecording`：控制按钮样式（录音中→destructive红色 + 脉冲动画）
- `isProcessing`：控制按钮图标（处理中→Loader2旋转动画）
- `interimText`：实时转写的临时文本，显示在按钮右侧气泡中
- `recognitionRef`：SpeechRecognition 实例引用，用于手动停止

#### 录音启动逻辑（startRecording）

```typescript
const startRecording = useCallback(() => {
  const SpeechRecognitionClass =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognitionClass) {
    onError?.('当前浏览器不支持语音识别，请使用Chrome浏览器');
    return;
  }

  const recognition = new SpeechRecognitionClass();
  recognition.lang = 'zh-CN';
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    setIsRecording(true);
    setInterimText('');
  };

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) {
        finalTranscript += result[0].transcript;
      } else {
        interimTranscript += result[0].transcript;
      }
    }

    setInterimText(interimTranscript);

    if (finalTranscript) {
      setIsProcessing(true);
      recognition.stop();
      onResult(finalTranscript);
    }
  };

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    const errorMessages: Record<string, string> = {
      'no-speech': '未检测到语音，请重试',
      'audio-capture': '无法访问麦克风，请检查设备',
      'not-allowed': '麦克风权限被拒绝，请在浏览器设置中允许访问',
      'network': '网络错误，请检查网络连接',
      'aborted': '识别已取消',
    };
    const errorMsg = errorMessages[event.error] || `识别错误: ${event.error}`;
    onError?.(errorMsg);
    toast.error(errorMsg);
  };

  recognition.onend = () => {
    setIsRecording(false);
    setIsProcessing(false);
    setInterimText('');
  };

  recognitionRef.current = recognition;
  recognition.start();
}, [onResult, onError]);
```

核心逻辑说明：

1. **浏览器支持检测**：优先使用 `window.SpeechRecognition`，回退到 `window.webkitSpeechRecognition`（Chrome前缀）
2. **配置项**：
   - `lang='zh-CN'`：中文识别
   - `continuous=true`：持续识别模式，用户可以说话多句
   - `interimResults=true`：返回中间结果，实现实时转写
   - `maxAlternatives=1`：只返回最佳识别结果
3. **onresult 处理**：
   - 从 `event.resultIndex` 开始遍历（跳过已处理的结果）
   - `isFinal=true` 的结果追加到 `finalTranscript`
   - `isFinal=false` 的结果追加到 `interimTranscript`（实时显示）
   - 有 `finalTranscript` 时：设置处理中状态 → 停止识别 → 调用 `onResult` 回调
4. **错误处理**：6种错误类型映射为中文提示，同时调用 `onError` 回调和 `toast.error`
5. **onend 清理**：重置所有状态

#### 停止录音逻辑（stopRecording）

```typescript
const stopRecording = useCallback(() => {
  recognitionRef.current?.stop();
}, []);
```

手动停止录音，触发 `onend` 回调清理状态。

#### UI渲染

```tsx
<div className="relative inline-flex">
  <Button
    type="button"
    variant={isRecording ? 'destructive' : 'outline'}
    size="icon"
    onClick={isRecording ? stopRecording : startRecording}
    disabled={disabled || isProcessing}
    className={cn(
      'relative transition-all',
      isRecording && 'animate-pulse ring-2 ring-destructive ring-offset-2'
    )}
  >
    {isProcessing ? (
      <Loader2 className="h-4 w-4 animate-spin" />
    ) : isRecording ? (
      <Square className="h-4 w-4" />
    ) : (
      <Mic className="h-4 w-4" />
    )}
  </Button>

  {/* 波纹动画 */}
  {isRecording && (
    <>
      <span className="absolute inset-0 animate-ping rounded-md bg-destructive/20" />
      <span
        className="absolute inset-0 animate-ping rounded-md bg-destructive/10"
        style={{ animationDelay: '200ms' }}
      />
    </>
  )}

  {/* 实时转写气泡 */}
  {interimText && (
    <div className="absolute left-full ml-2 top-0 max-w-xs whitespace-normal rounded-md bg-popover px-3 py-2 text-sm shadow-md">
      <p className="text-muted-foreground">{interimText}</p>
      <span className="inline-block h-3 w-0.5 animate-pulse bg-primary ml-1" />
    </div>
  )}
</div>
```

UI元素说明：

| 状态 | 按钮变体 | 图标 | 附加样式 |
|------|---------|------|---------|
| 空闲 | outline | Mic（麦克风） | 无 |
| 录音中 | destructive | Square（停止） | animate-pulse + ring-2 ring-offset-2 |
| 处理中 | outline（disabled） | Loader2（旋转动画） | disabled 状态 |

波纹效果：两层 `animate-ping` 圆形扩散，第二层延迟 200ms，营造声波扩散感。

实时转写气泡：绝对定位在按钮右侧，`bg-popover` 背景，带闪烁光标（`animate-pulse` 的竖线）。

### 27.3 VoiceInputPanel组件（265行）

#### Props接口

```typescript
interface VoiceInputPanelProps {
  onApply: (data: NonNullable<VoiceParseResult['data']>) => void;
  onCancel: () => void;
}
```

#### 状态管理

```typescript
const [isParsing, setIsParsing] = useState<boolean>(false);
const [parseResult, setParseResult] = useState<VoiceParseResult | null>(null);
const [editedData, setEditedData] = useState<ParsedVoiceResult['data']>({});
```

#### 核心流程

**handleVoiceResult(text)** — 接收语音文本并解析：

```typescript
const handleVoiceResult = useCallback(async (text: string) => {
  setIsParsing(true);
  try {
    const result = await parseVoiceInput(text, 'inbound');
    if (result.success && result.data) {
      setParseResult(result);
      setEditedData(result.data);
      toast.success('语音识别成功，请核对信息');
    } else {
      setParseResult(result);
      toast.error(result.error || '语音解析失败');
    }
  } catch (error) {
    logger.error('Voice parsing error:', error);
    toast.error('语音解析服务异常，请稍后重试');
  } finally {
    setIsParsing(false);
  }
}, []);
```

**handleApply()** — 应用数据到父组件表单：

```typescript
const handleApply = () => {
  if (!editedData) return;

  const missingFields: string[] = [];
  if (!editedData.productName?.trim()) missingFields.push('产品名称');
  if (!editedData.unit?.trim()) missingFields.push('计价单位');
  if (editedData.unitPrice === undefined || editedData.unitPrice === null) {
    missingFields.push('单价');
  }

  if (missingFields.length > 0) {
    toast.error(`请填写必填字段: ${missingFields.join('、')}`);
    return;
  }

  onApply(editedData);
  toast.success('已应用语音录入数据');
};
```

**handleFieldChange(field, value)** — 更新单个字段：

```typescript
const handleFieldChange = (field: keyof NonNullable<VoiceParseResult['data']>, value: string | number) => {
  setEditedData(prev => ({ ...prev, [field]: value }));
};
```

#### 示例话术

```typescript
const exampleScripts = [
  '入库齿轮一百个，单价二十五元，计价单位是件，重量五十公斤，材质四十五号钢',
  '来货轴套两百件，单价三十元一件，三十公斤，淬火处理',
  '轴承五十个，单价五十元一个，材质不锈钢，加急',
];
```

用户点击示例话术可直接触发解析流程（调用 `handleVoiceResult(script)`），方便测试和演示。

#### UI结构（4种状态）

**1. 初始状态**（!parseResult && !isParsing）：

```tsx
<div className="flex flex-col items-center justify-center py-8 space-y-4">
  <div className="scale-150">
    <VoiceInputButton onResult={handleVoiceResult} onError={handleError} />
  </div>
  <p className="text-sm text-muted-foreground">点击麦克风按钮，说出产品信息</p>
  <div className="space-y-2">
    <p className="text-xs text-muted-foreground">示例话术（点击可直接解析）:</p>
    {exampleScripts.map((script, index) => (
      <button
        key={index}
        onClick={() => handleVoiceResult(script)}
        className="block w-full text-left text-xs text-blue-600 hover:underline"
      >
        "{script}"
      </button>
    ))}
  </div>
</div>
```

**2. 解析中**（isParsing）：

```tsx
<div className="flex flex-col items-center justify-center py-8 space-y-4">
  <Loader2 className="h-8 w-8 animate-spin text-primary" />
  <p className="text-sm text-muted-foreground">正在解析语音内容...</p>
</div>
```

**3. 解析成功**（parseResult.success && !isParsing）：

```tsx
<div className="space-y-4">
  {/* 原始语音文本 */}
  <div className="rounded-md bg-muted/50 p-3">
    <p className="text-xs text-muted-foreground mb-1">语音原文:</p>
    <p className="text-sm">{parseResult.rawText}</p>
  </div>

  {/* 可编辑表单 */}
  <div className="grid grid-cols-2 gap-3">
    <FormField label="产品名称" required error={!editedData.productName?.trim()}>
      <Input value={editedData.productName || ''} onChange={e => handleFieldChange('productName', e.target.value)} />
    </FormField>
    <FormField label="数量">
      <Input type="number" value={editedData.quantity ?? ''} onChange={e => handleFieldChange('quantity', parseFloat(e.target.value))} />
    </FormField>
    <FormField label="重量(kg)">
      <Input type="number" value={editedData.weight ?? ''} onChange={e => handleFieldChange('weight', parseFloat(e.target.value))} />
    </FormField>
    <FormField label="计价单位" required error={!editedData.unit?.trim()}>
      <Input value={editedData.unit || ''} onChange={e => handleFieldChange('unit', e.target.value)} />
    </FormField>
    <FormField label="单价(元)" required error={editedData.unitPrice === undefined || editedData.unitPrice === null}>
      <Input type="number" value={editedData.unitPrice ?? ''} onChange={e => handleFieldChange('unitPrice', parseFloat(e.target.value))} />
    </FormField>
    <FormField label="材质">
      <Input value={editedData.material || ''} onChange={e => handleFieldChange('material', e.target.value)} />
    </FormField>
    <FormField label="工艺">
      <Input value={editedData.process || ''} onChange={e => handleFieldChange('process', e.target.value)} />
    </FormField>
    <FormField label="备注">
      <Input value={editedData.remark || ''} onChange={e => handleFieldChange('remark', e.target.value)} />
    </FormField>
  </div>

  {/* 操作按钮 */}
  <div className="flex justify-end gap-2">
    <Button variant="outline" onClick={onCancel}>取消</Button>
    <Button onClick={handleApply}>应用</Button>
  </div>
</div>
```

必填字段标记：使用 `required` prop 传递给 FormField 组件，在标签后显示红色 `*`。当字段值为空时，`error` prop 为 true，输入框边框变为 `border-destructive`。

**4. 解析失败**（!parseResult.success && !isParsing）：

```tsx
<div className="flex flex-col items-center justify-center py-8 space-y-4">
  <p className="text-sm text-destructive">{parseResult.error}</p>
  <Button variant="outline" onClick={() => setParseResult(null)}>重试</Button>
</div>
```

#### 必填字段校验

三个必填字段的校验逻辑在 `handleApply` 中执行：

| 字段 | 校验条件 | 错误提示 |
|------|---------|---------|
| productName | `!editedData.productName?.trim()` | "产品名称" |
| unit | `!editedData.unit?.trim()` | "计价单位" |
| unitPrice | `=== undefined \|\| === null` | "单价" |

校验失败时显示 toast 错误提示，不关闭面板。

### 27.4 AIRecognitionDialog组件（439行）

AIRecognitionDialog 是一个更高级的多模态识别对话框，支持文本输入和图片上传两种识别方式。

#### 核心功能

1. **文本输入识别**：用户粘贴或输入文本，调用后端AI解析
2. **图片上传识别**：用户上传产品图片，调用AI图片理解插件提取信息
3. **批量识别**：支持一次处理多个文本/图片
4. **结果编辑**：解析结果展示为可编辑表单
5. **与页面集成**：支持从InboundPage和ReconciliationPage调用

#### 对话框结构

```
AIRecognitionDialog
├── DialogHeader (标题: "AI智能识别")
├── Tab切换 (文本识别 / 图片识别)
├── Tab内容区
│   ├── 文本识别Tab
│   │   ├── Textarea (多行文本输入)
│   │   └── 识别按钮
│   └── 图片识别Tab
│       ├── DropZone (图片拖拽上传区)
│       ├── 图片预览
│       └── 识别按钮
├── 解析结果区
│   ├── 加载中状态 (Loader2旋转)
│   ├── 成功: 可编辑表单 (与VoiceInputPanel类似的8字段)
│   └── 失败: 错误信息 + 重试按钮
└── DialogFooter (取消 / 应用按钮)
```

#### 图片识别流程

1. 用户拖拽或点击上传图片
2. 前端通过 dataloom SDK 上传图片获取文件 URL
3. 调用后端 `/api/voice/parse-image` 接口
4. 后端调用 AI 图片理解插件（`image_understanding`）
5. AI 返回结构化 JSON 数据
6. 前端展示可编辑结果

### 27.5 后端VoiceService（182行）

#### 接口定义

```typescript
// shared/api.interface.ts
interface ParseVoiceInputDto {
  text: string;
  context?: 'inbound' | 'outbound' | 'inventory';
}

interface ParsedVoiceResult {
  success: boolean;
  data?: {
    productName?: string;
    quantity?: number;
    weight?: number;
    unit?: string;
    unitPrice?: number;
    material?: string;
    process?: string;
    customerName?: string;
    remark?: string;
  };
  rawText: string;
  error?: string;
}
```

#### 依赖注入

```typescript
import { Injectable } from '@nestjs/common';
import { CapabilityService } from '@lark-apaas/fullstack-nestjs-core';
import { Logger } from '@nestjs/common';

@Injectable()
export class VoiceService {
  private readonly logger = new Logger(VoiceService.name);

  constructor(
    @Inject() private readonly capabilityService: CapabilityService,
  ) {}
}
```

使用 `@lark-apaas/fullstack-nestjs-core` 的 `CapabilityService` 调用 AI 插件。AI 插件实例 ID 为 `intelligent_writing_quick_quality_1`，action key 为 `textGenerate`。

#### parseVoiceInput(dto) 方法

```typescript
async parseVoiceInput(dto: ParseVoiceInputDto): Promise<ParsedVoiceResult> {
  const { text, context = 'inbound' } = dto;

  if (!text || !text.trim()) {
    return {
      success: false,
      data: undefined,
      rawText: text || '',
      error: '输入文本为空',
    };
  }

  try {
    const prompt = this.buildParsePrompt(text, context);
    const result = await this.callAIForParsing(prompt);

    return {
      success: true,
      data: result,
      rawText: text,
    };
  } catch (error) {
    this.logger.error(`Voice parsing failed: ${JSON.stringify(error)}`);
    return {
      success: false,
      data: undefined,
      rawText: text,
      error: error instanceof Error ? error.message : '语音解析失败',
    };
  }
}
```

流程：
1. 解构参数，context 默认 'inbound'
2. 空值检查：text 为空时返回失败
3. 构建 Prompt
4. 调用 AI 解析
5. 成功返回数据，失败返回错误信息
6. 异常通过 Logger 记录完整堆栈

#### buildParsePrompt(text, context) 方法

```typescript
private buildParsePrompt(text: string, context: string): string {
  const contextDescriptions: Record<string, string> = {
    inbound: '入库登记场景',
    outbound: '出库发货场景',
    inventory: '库存管理场景',
  };

  const sceneDescription = contextDescriptions[context] || contextDescriptions.inbound;

  return `你是一个热处理收发货管理系统的语音解析助手。用户在${sceneDescription}中通过语音输入了产品信息，请将其解析为结构化数据。

原始语音文本：
"${text}"

请提取以下字段（如果未提及则设为null）：
- productName: 产品名称（必填）
- quantity: 数量
- weight: 重量(kg)
- unit: 计价单位（必填，如"件"、"个"、"kg"等）
- unitPrice: 单价(元)（必填）
- material: 材质（如"45#"、"20Cr"、"304"等）
- process: 工艺（如"淬火"、"调质"、"渗碳"等）
- customerName: 客户名称
- remark: 备注

注意事项：
1. 中文数字请转换为阿拉伯数字（如"一百"转换为"100"）
2. 必填字段如果未提及，请设为null
3. 只返回JSON格式，不要添加任何其他文字

示例输出：
{"productName":"齿轮","quantity":100,"weight":50,"unit":"件","unitPrice":25,"material":"45#","process":"调质","customerName":null,"remark":null}`;
}
```

Prompt 结构：
1. **角色设定**：热处理收发货管理系统的语音解析助手
2. **场景描述**：根据 context 参数动态设置（入库/出库/库存）
3. **原始文本**：用户语音转写的文本
4. **字段说明**：9个待提取字段，标注必填项
5. **注意事项**：中文数字转换、null处理、只返回JSON
6. **示例输出**：提供一个完整的JSON示例

#### callAIForParsing(prompt) 方法

```typescript
private async callAIForParsing(prompt: string): Promise<NonNullable<ParsedVoiceResult['data']>> {
  if (!prompt) {
    throw new Error('Prompt为空');
  }

  const response = await this.capabilityService
    .load('intelligent_writing_quick_quality_1')
    .call('textGenerate', { prompt });

  const content = response?.content;

  if (!content) {
    throw new Error('AI返回内容为空');
  }

  // 从返回内容中提取JSON
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('AI返回内容不包含有效JSON');
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error('AI返回的JSON格式无效');
  }

  // 转换数字字段
  return {
    productName: typeof parsed.productName === 'string' ? parsed.productName : undefined,
    quantity: this.parseNumber(parsed.quantity),
    weight: this.parseNumber(parsed.weight),
    unit: typeof parsed.unit === 'string' ? parsed.unit : undefined,
    unitPrice: this.parseNumber(parsed.unitPrice),
    material: typeof parsed.material === 'string' ? parsed.material : undefined,
    process: typeof parsed.process === 'string' ? parsed.process : undefined,
    customerName: typeof parsed.customerName === 'string' ? parsed.customerName : undefined,
    remark: typeof parsed.remark === 'string' ? parsed.remark : undefined,
  };
}
```

AI调用流程：
1. 空值检查
2. 调用 `capabilityService.load('intelligent_writing_quick_quality_1')` 加载AI插件
3. 调用 `.call('textGenerate', { prompt })` 发送文本生成请求
4. 获取返回的 `response.content`
5. 使用正则 `/\{[\s\S]*\}/` 从内容中提取JSON（AI可能返回额外文字）
6. `JSON.parse` 解析JSON字符串
7. 字段类型转换：
   - 字符串字段：检查类型后赋值或设为undefined
   - 数字字段：通过 `parseNumber` 方法转换

#### parseNumber(value) 私有方法

```typescript
private parseNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const num = parseFloat(value);
    return isNaN(num) ? undefined : num;
  }
  return undefined;
}
```

三种处理：
- `null/undefined` → `undefined`
- `number` → 直接返回
- `string` → `parseFloat`，NaN 返回 `undefined`

### 27.6 后端控制器

```typescript
@Controller('api/voice')
export class VoiceController {
  constructor(private readonly voiceService: VoiceService) {}

  @NeedLogin()
  @Post('parse')
  async parseVoiceInput(@Body() dto: ParseVoiceInputDto): Promise<ParsedVoiceResult> {
    return this.voiceService.parseVoiceInput(dto);
  }
}
```

- 路由：`POST /api/voice/parse`
- 鉴权：`@NeedLogin()` 需要登录
- 请求体：`ParseVoiceInputDto`（text + context）
- 响应：`ParsedVoiceResult`

### 27.7 前端API封装

```typescript
// client/src/api/index.ts
export async function parseVoiceInput(
  text: string,
  context: 'inbound' | 'outbound' | 'inventory' = 'inbound'
): Promise<VoiceParseResult> {
  return axiosForBackend
    .post('/api/voice/parse', { text, context })
    .then(r => r.data);
}
```

`VoiceParseResult` 类型与后端 `ParsedVoiceResult` 接口一致，定义在 `shared/api.interface.ts` 中。

### 27.8 语音识别完整流程图

```
┌──────────────────────────────────────────────────────────────┐
│                      用户操作层                                │
├──────────────────────────────────────────────────────────────┤
│ 1. 用户点击 VoiceInputButton 麦克风图标                         │
│ 2. 浏览器请求麦克风权限                                        │
│ 3. 用户说话（中文）                                             │
│ 4. 实时转写显示在按钮右侧气泡                                    │
│ 5. 用户停止说话，SpeechRecognition 生成 finalTranscript        │
│ 6. VoiceInputButton 调用 onResult(finalTranscript)           │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                    前端处理层                                   │
├──────────────────────────────────────────────────────────────┤
│ 7. VoiceInputPanel.handleVoiceResult(text)                   │
│ 8. setIsParsing(true)                                        │
│ 9. 调用 parseVoiceInput(text, 'inbound')                     │
│    → axiosForBackend.post('/api/voice/parse', { text })       │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                    后端处理层                                   │
├──────────────────────────────────────────────────────────────┤
│ 10. VoiceController.parseVoiceInput(dto)                     │
│ 11. VoiceService.parseVoiceInput(dto)                        │
│     ├── 空值检查                                              │
│     ├── buildParsePrompt(text, 'inbound')                    │
│     │   → 构建包含场景描述+字段说明+示例的Prompt               │
│     └── callAIForParsing(prompt)                             │
│         ├── capabilityService.load('intelligent_writing_...')│
│         ├── .call('textGenerate', { prompt })                │
│         ├── 获取 response.content                             │
│         ├── 正则提取JSON: content.match(/\{[\s\S]*\}/)      │
│         ├── JSON.parse                                        │
│         └── parseNumber 转换数字字段                            │
│ 12. 返回 { success: true, data: {...}, rawText: text }       │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                    结果展示层                                   │
├──────────────────────────────────────────────────────────────┤
│ 13. setParseResult(result)                                   │
│ 14. setEditedData(result.data)                               │
│ 15. toast.success('语音识别成功，请核对信息')                  │
│ 16. 展示8字段可编辑表单                                       │
│ 17. 用户核对/修改字段值                                       │
│ 18. 用户点击"应用" → handleApply()                           │
│     ├── 必填字段校验（productName/unit/unitPrice）            │
│     ├── onApply(editedData) → 父组件接收数据                  │
│     └── toast.success('已应用语音录入数据')                   │
└──────────────────────────────────────────────────────────────┘
```

### 27.9 语音命令示例与语法

#### 入库场景示例话术

| 话术 | 解析结果 |
|------|---------|
| "入库齿轮一百个，单价二十五元，计价单位是件，重量五十公斤，材质四十五号钢" | productName=齿轮, quantity=100, unitPrice=25, unit=件, weight=50, material=45# |
| "来货轴套两百件，单价三十元一件，三十公斤，淬火处理" | productName=轴套, quantity=200, unitPrice=30, unit=件, weight=30, process=淬火 |
| "轴承五十个，单价五十元一个，材质不锈钢，加急" | productName=轴承, quantity=50, unitPrice=50, unit=个, material=304, remark=加急 |
| "入库法兰盘，数量三十，每个十五元，公斤，材质20Cr，工艺渗碳" | productName=法兰盘, quantity=30, unitPrice=15, unit=kg, material=20Cr, process=渗碳 |

#### 出库场景示例话术

| 话术 | 解析结果 |
|------|---------|
| "发货齿轮五十个给甲公司" | productName=齿轮, quantity=50, customerName=甲公司 |
| "出库轴套，三十件" | productName=轴套, quantity=30, unit=件 |

#### 库存场景示例话术

| 话术 | 解析结果 |
|------|---------|
| "查询齿轮库存" | productName=齿轮 |
| "库存少于十个的有哪些" | remark=库存少于10 |

### 27.10 错误处理与边界情况

#### 错误处理清单

| 错误场景 | 处理方式 | 用户提示 |
|---------|---------|---------|
| 浏览器不支持Web Speech API | onError回调 + 不启动录音 | "当前浏览器不支持语音识别，请使用Chrome浏览器" |
| 麦克风权限被拒绝 | onerror回调(not-allowed) | "麦克风权限被拒绝，请在浏览器设置中允许访问" |
| 未检测到语音 | onerror回调(no-speech) | "未检测到语音，请重试" |
| 麦克风硬件问题 | onerror回调(audio-capture) | "无法访问麦克风，请检查设备" |
| 网络中断 | onerror回调(network) | "网络错误，请检查网络连接" |
| 用户主动取消 | onerror回调(aborted) | "识别已取消" |
| 未知错误 | onerror回调(default) | `识别错误: ${event.error}` |
| AI解析返回空内容 | callAIForParsing抛异常 | "AI返回内容为空" |
| AI返回非JSON格式 | callAIForParsing抛异常 | "AI返回内容不包含有效JSON" |
| JSON.parse失败 | callAIForParsing抛异常 | "AI返回的JSON格式无效" |
| 必填字段缺失 | handleApply校验 | "请填写必填字段: 产品名称、计价单位、单价" |
| 网络请求异常 | catch块 | "语音解析服务异常，请稍后重试" |

#### 边界情况处理

1. **空语音文本**：后端 `parseVoiceInput` 首先检查 text 是否为空，为空直接返回 `{ success: false, error: '输入文本为空' }`
2. **AI返回额外文字**：使用正则 `/\{[\s\S]*\}/` 从返回内容中提取JSON，忽略前后的说明文字
3. **数字字段为字符串**：`parseNumber` 方法处理 string 类型的数字（如 AI 返回 `"100"` 而非 `100`）
4. **字段为null**：AI 返回 null 的字段在类型转换后变为 undefined，前端表单显示为空
5. **用户编辑后重新验证**：每次 `handleFieldChange` 更新 `editedData`，`handleApply` 时重新校验必填字段
6. **录音中页面切换**：SpeechRecognition 的 `onend` 回调会重置所有状态，不会导致状态泄漏

### 27.11 性能与用户体验

#### 用户体验优化

1. **实时转写显示**：`interimResults=true` 让用户在说话时就能看到识别结果，提供即时反馈
2. **波纹动画**：录音中两层 `animate-ping` 动画，视觉化声波扩散
3. **按钮状态变化**：录音中按钮变红 + 脉冲动画，明确告知用户正在录音
4. **加载状态**：AI解析中显示 Loader2 旋转动画，避免用户以为卡死
5. **Toast提示**：成功/失败都有明确的 toast 通知
6. **可编辑表单**：AI解析结果不是最终结果，用户可以修改任何字段
7. **示例话术**：提供3条可点击的示例，方便新用户理解和测试
8. **必填字段标记**：红色 `*` 标记必填字段，空值时输入框变红
