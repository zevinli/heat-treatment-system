

---

## 第26章 智能Excel导入系统完整实现

### 26.1 系统架构与文件结构

智能Excel导入系统是热处理收发货管理系统的核心数据导入能力，位于 `client/src/utils/smartExcelImport/` 目录下，共8个文件：

| 文件 | 行数 | 职责 |
|------|------|------|
| `index.ts` | 739 | 主入口，编排完整导入流程 |
| `types.ts` | 128 | 全部类型定义 |
| `columnMatcher.ts` | 259 | 智能列匹配引擎（Levenshtein + Jaccard + 语义相似度） |
| `dataParsers.ts` | 363 | 数据清洗与标准化解析器（价格/数字/库存/单位等） |
| `fieldSplitter.ts` | 413 | 混合字段拆分器（材质+工艺+技术要求） |
| `materialStandards.ts` | 462 | 材质标准库与工艺标准库 |
| `fieldAliases.ts` | 122 | 字段别名配置（12个字段的精确/模糊/正则匹配规则） |

另有一个1,338行的UI组件 `SmartExcelImportDialog.tsx`（位于 `client/src/pages/ProductListPage/`），提供完整的导入预览和交互界面。

系统整体流程：

```
用户上传Excel文件
    │
    ▼
parseExcelFile(file)          ── XLSX库解析为headers+rows
    │
    ▼
rowHasAnyData(row) 过滤      ── 自动移除空白行
    │
    ▼
analyzeColumnSamples()       ── 提取每列前10个有效值作为样本
    │
    ▼
matchColumns(headers, samples) ── 智能列匹配引擎
    │  ├── 精确匹配检查（exact别名数组）
    │  ├── Levenshtein + Jaccard 名称相似度
    │  ├── 正则模式匹配（patterns数组）
    │  ├── 语义相似度（词重叠Jaccard）
    │  └── 数据模式匹配（dataPatterns正则）
    │  → 输出 ColumnMapping[] + 置信度
    │
    ▼
检测复合字段                  ── 材质+工艺同列 → composite[material+process]
    │
    ▼
normalizeData(data, mappings)  ── 逐行标准化
    │  ├── splitCompositeField() 拆分混合字段
    │  ├── parseValueByField() 按字段类型解析
    │  ├── generateDataIssue() 生成数据问题
    │  ├── 必填字段验证
    │  └── 行质量分级（valid/warning/error）
    │
    ▼
generateQualityReport()       ── 全局质量报告
    │  ├── 统计 valid/warning/error 行数
    │  ├── 聚合最常见问题（前20条）
    │  └── 总体评分 = (valid + warning*0.5) / total
    │
    ▼
返回 ImportPreviewState        ── 完整预览状态
    │
    ▼ 用户在Dialog中预览/编辑/调整列映射
    │
    ▼
convertToProducts(state)       ── 转换为产品对象数组
    │  ├── 自动过滤空白行
    │  ├── 默认值填充（客户编码/名称）
    │  ├── 强制导入模式（status='incomplete'）
    │  └── 正常模式（必填字段检查）
    │
    ▼
返回 Partial<IProduct>[]        ── 可直接批量创建的产品列表
```

### 26.2 类型定义（types.ts 128行）

#### MatchConfidence — 字段匹配置信度

```typescript
export interface MatchConfidence {
  nameSimilarity: number;       // 名称相似度（Levenshtein+Jaccard混合）
  semanticSimilarity: number;   // 语义相似度（词重叠）
  dataPatternScore: number;     // 数据模式匹配分数
  overall: number;              // 综合置信度（加权平均）
}
```

所有字段值范围 0-1，overall 由四个维度加权计算：
`overall = nameSim * 0.4 + semanticSim * 0.3 + dataPattern * 0.2 + patternMatch * 0.1`

#### ColumnMapping — 列映射结果

```typescript
export interface ColumnMapping {
  sourceColumn: string;          // Excel原始列名
  sourceHeader: string;          // 同sourceColumn（保留用于兼容）
  targetField: string;           // 目标字段名（如'code'/'name'/'material'）
  confidence: number;            // 综合置信度（0-1）
  matchDetails: MatchConfidence;  // 详细置信度分解
  sampleValues: string[];        // 前5个样例值（String化）
  suggestion: 'auto' | 'confirm' | 'reject';  // 建议动作
}
```

suggestion 分级：
- `auto`：confidence ≥ 0.85，自动接受
- `confirm`：confidence ≥ 0.6，需用户确认
- `reject`：confidence < 0.6，建议拒绝映射

#### ParseResult<T> — 单字段解析结果

```typescript
export interface ParseResult<T = unknown> {
  value: T | null;               // 解析后的值（null表示解析失败）
  confidence: number;            // 解析置信度（0-1）
  format?: string;               // 数据格式标识
  error?: string;                // 解析错误信息
  raw: unknown;                  // 原始值
  warnings?: string[];           // 警告信息列表
}
```

format 可能的值：
- `'standard'`：标准数字/文本
- `'thousands'`：千分位格式（1,234.56）
- `'scientific'`：科学计数法（1e3）
- `'fraction'`：分数（3/4）
- `'percentage'`：百分比（50%）
- `'chinese'`：中文数字（一百）
- `'converted'`：单位转换（1.5万→15000）
- `'extracted'`：从文本中提取的数字
- `'text-mapped'`：文本映射（充足→999999）

#### DataQualityReport — 数据质量报告

```typescript
export interface DataQualityReport {
  overall: number;               // 总体评分（0-1）
  totalRows: number;             // 总行数
  validRows: number;             // 有效行数
  warningRows: number;           // 警告行数
  errorRows: number;             // 错误行数
  issues: DataIssue[];           // 最常见问题列表（前20条）
}
```

overall 计算公式：`(validRows + warningRows * 0.5) / totalRows`

#### DataIssue — 数据问题

```typescript
export interface DataIssue {
  rowIndex: number;             // 行索引（-1表示聚合问题）
  column: string;                // 字段名
  type: 'error' | 'warning' | 'info';  // 问题级别
  message: string;              // 问题描述
  rawValue: unknown;            // 原始值
  suggestion?: string;          // 修复建议
}
```

#### UserEdit — 用户编辑记录

```typescript
export interface UserEdit {
  field: string;                 // 被编辑的字段名
  value: unknown;                // 编辑后的值
  editedAt: number;              // 编辑时间戳
}
```

#### NormalizedRow — 标准化行数据

```typescript
export interface NormalizedRow extends Record<
  string, ParseResult | number | string | DataIssue[] | UserEdit[] | undefined
> {
  _rowIndex: number;             // 行索引
  _quality: 'valid' | 'warning' | 'error';  // 行质量
  _issues: DataIssue[];          // 该行的所有问题
  _userEdits?: UserEdit[];        // 用户手动编辑记录
}
```

NormalizedRow 是一个扩展的 Record 类型，除了下划线开头的元数据字段外，还包含每个字段的 ParseResult。例如 `normalizedRow.code` 返回 `ParseResult<string>`，`normalizedRow.unitPrice` 返回 `ParseResult<number>`。

#### CompositeSplit — 混合字段拆分结果

```typescript
export interface CompositeSplit {
  material?: ParseResult<string>;        // 拆分出的材质
  process?: ParseResult<string>;         // 拆分出的工艺
  techRequirement?: ParseResult<string>; // 拆分出的技术要求
  original: string;                       // 原始文本
  confidence: number;                     // 拆分置信度
}
```

#### ImportPreviewState — 导入预览状态

```typescript
export interface ImportPreviewState {
  fileName: string;                     // Excel文件名
  totalRows: number;                    // 总行数（过滤空白行后）
  columnMappings: ColumnMapping[];      // 列映射结果
  normalizedData: NormalizedRow[];       // 标准化后的数据
  qualityReport: DataQualityReport;     // 质量报告
  selectedRows: number[];               // 选中的行索引
  forcedImportRows: number[];           // 强制导入的行索引（含错误）
}
```

#### MaterialStandard — 材质标准

```typescript
export interface MaterialStandard {
  standard: string;                     // 标准名称（如'45#'）
  name: string;                         // 材质类别名（如'优质碳素结构钢'）
  category: 'carbon' | 'alloy' | 'stainless' | 'tool' | 'other';
  aliases: string[];                     // 所有别名
}
```

#### ProcessStandard — 工艺标准

```typescript
export interface ProcessStandard {
  standard: string;                     // 标准名称（如'淬火'）
  name: string;                         // 工艺类别名
  category: 'heat' | 'surface' | 'machining' | 'other';
  aliases: string[];                     // 所有别名
}
```

#### FieldAliasConfig — 字段别名配置

```typescript
export interface FieldAliasConfig {
  field: string;                        // 目标字段名
  exact: string[];                      // 精确匹配别名
  fuzzy: string[];                      // 模糊匹配别名
  patterns: RegExp[];                   // 正则模式列表
  dataPatterns?: RegExp[];              // 数据模式正则
}
```

#### ProductImportField — 产品导入字段

```typescript
export interface ProductImportField {
  code: ParseResult<string>;
  name: ParseResult<string>;
  material: ParseResult<string>;
  process: ParseResult<string>;
  techRequirement: ParseResult<string>;
  workpieceNo: ParseResult<string>;
  unit: ParseResult<string>;
  unitPrice: ParseResult<number>;
  customerCode: ParseResult<string>;
  customerName: ParseResult<string>;
  stock: ParseResult<number>;
  warningThreshold: ParseResult<number>;
}
```

### 26.3 列匹配引擎（columnMatcher.ts 259行）

#### levenshtein(a, b) — 编辑距离算法

```typescript
function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] = b.charAt(i - 1) === a.charAt(j - 1)
        ? matrix[i - 1][j - 1]
        : Math.min(
          matrix[i - 1][j - 1] + 1,  // 替换
          matrix[i][j - 1] + 1,      // 插入
          matrix[i - 1][j] + 1       // 删除
        );
    }
  }
  return matrix[b.length][a.length];
}
```

时间复杂度 O(m×n)，空间复杂度 O(m×n)。计算两个字符串之间的最小编辑操作数（插入/删除/替换各代价1）。

#### textSimilarity(a, b) — 文本相似度

```typescript
function textSimilarity(a: string, b: string): number {
  const aLower = a.toLowerCase().trim();
  const bLower = b.toLowerCase().trim();
  if (aLower === bLower) return 1;
  const distance = levenshtein(aLower, bLower);
  const maxLength = Math.max(aLower.length, bLower.length);
  return maxLength === 0 ? 1 : 1 - distance / maxLength;
}
```

返回 0-1 的相似度分数，1 表示完全相同，0 表示完全不同。基于编辑距离归一化。

#### jaccardSimilarity(a, b) — Jaccard相似度

```typescript
function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(a.split(''));
  const setB = new Set(b.split(''));
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}
```

基于字符级别的集合运算：交集大小 / 并集大小。对中英文混合文本均有效。

#### calculateDataPatternScore(values, config) — 数据模式匹配分数

```typescript
function calculateDataPatternScore(
  values: unknown[],
  config: FieldAliasConfig
): number {
  if (!config.dataPatterns || config.dataPatterns.length === 0) {
    return 0.5;
  }
  const validValues = values.filter(v => v !== undefined && v !== null && v !== '');
  if (validValues.length === 0) return 0;
  let matchCount = 0;
  for (const value of validValues) {
    const str = String(value).trim();
    const matches = config.dataPatterns.some(pattern => pattern.test(str));
    if (matches) matchCount++;
  }
  return matchCount / validValues.length;
}
```

逻辑：遍历列中所有有效值，检查是否符合字段配置中的 dataPatterns 正则。返回匹配比例（0-1）。如果字段没有配置 dataPatterns，返回中性分数 0.5。

#### calculateConfidence(header, values, config) — 综合置信度计算

这是列匹配的核心算法，按6个层次逐步计算：

```typescript
function calculateConfidence(
  header: string,
  values: unknown[],
  config: FieldAliasConfig
): MatchConfidence {
  // 第1层：精确匹配检查
  const exactMatch = config.exact.some(alias =>
    header.toLowerCase() === alias.toLowerCase()
  );
  if (exactMatch) {
    return {
      nameSimilarity: 1,
      semanticSimilarity: 1,
      dataPatternScore: 1,
      overall: 1,
    };
  }

  // 第2层：名称相似度（Levenshtein + Jaccard混合）
  let maxNameSim = 0;
  for (const alias of [...config.exact, ...config.fuzzy]) {
    const levSim = textSimilarity(header, alias);
    const jacSim = jaccardSimilarity(header, alias);
    const combinedSim = levSim * 0.7 + jacSim * 0.3;
    maxNameSim = Math.max(maxNameSim, combinedSim);
  }

  // 第3层：正则模式匹配
  let patternMatchScore = 0;
  for (const pattern of config.patterns) {
    if (pattern.test(header)) {
      patternMatchScore = 1;
      break;
    }
  }

  // 名称相似度融合模式匹配
  const nameSimilarity = Math.max(maxNameSim, patternMatchScore * 0.9);

  // 第4层：语义相似度（基于词重叠）
  const headerWords = new Set(header.split(/[^\u4e00-\u9fa5a-zA-Z0-9]+/));
  let maxSemanticSim = 0;
  for (const alias of [...config.exact, ...config.fuzzy]) {
    const aliasWords = new Set(alias.split(/[^\u4e00-\u9fa5a-zA-Z0-9]+/));
    const intersection = new Set([...headerWords].filter(x => aliasWords.has(x)));
    const union = new Set([...headerWords, ...aliasWords]);
    const sim = intersection.size / union.size;
    maxSemanticSim = Math.max(maxSemanticSim, sim);
  }

  // 第5层：数据模式匹配
  const dataPatternScore = calculateDataPatternScore(values, config);

  // 第6层：综合置信度（加权平均）
  const overall =
    nameSimilarity * 0.4 +
    maxSemanticSim * 0.3 +
    dataPatternScore * 0.2 +
    patternMatchScore * 0.1;

  return {
    nameSimilarity: Math.round(nameSimilarity * 100) / 100,
    semanticSimilarity: Math.round(maxSemanticSim * 100) / 100,
    dataPatternScore: Math.round(dataPatternScore * 100) / 100,
    overall: Math.round(overall * 100) / 100,
  };
}
```

权重分配说明：
- 名称相似度 0.4：最高权重，因为列名是最直接的匹配信号
- 语义相似度 0.3：词级别的重叠提供语义层面的匹配
- 数据模式 0.2：实际数据值的格式验证（如价格列应包含数字）
- 正则模式 0.1：辅助匹配信号

#### getSuggestion(confidence) — 建议动作

```typescript
function getSuggestion(confidence: number): ColumnMapping['suggestion'] {
  if (confidence >= 0.85) return 'auto';
  if (confidence >= 0.6) return 'confirm';
  return 'reject';
}
```

#### matchColumns(headers, sampleData, customAliases?) — 智能匹配主函数

```typescript
export function matchColumns(
  headers: string[],
  sampleData: Record<string, unknown[]>,
  customAliases?: FieldAliasConfig[]
): ColumnMapping[] {
  const aliases = customAliases || productFieldAliases;
  const mappings: ColumnMapping[] = [];
  const matchedFields = new Set<string>();

  for (const header of headers) {
    const values = sampleData[header] || [];
    let bestMatch: ColumnMapping | null = null;
    let bestScore = 0;

    for (const config of aliases) {
      if (matchedFields.has(config.field)) continue;
      const confidence = calculateConfidence(header, values, config);
      if (confidence.overall > bestScore) {
        bestScore = confidence.overall;
        bestMatch = {
          sourceColumn: header,
          sourceHeader: header,
          targetField: config.field,
          confidence: confidence.overall,
          matchDetails: confidence,
          sampleValues: values.slice(0, 5).map(String),
          suggestion: getSuggestion(confidence.overall),
        };
      }
    }

    if (bestMatch && bestMatch.confidence >= 0.4) {
      mappings.push(bestMatch);
      matchedFields.add(bestMatch.targetField);
    } else {
      mappings.push({
        sourceColumn: header,
        sourceHeader: header,
        targetField: '',
        confidence: 0,
        matchDetails: {
          nameSimilarity: 0,
          semanticSimilarity: 0,
          dataPatternScore: 0,
          overall: 0,
        },
        sampleValues: values.slice(0, 5).map(String),
        suggestion: 'reject',
      });
    }
  }

  return mappings;
}
```

关键设计：
- **一对一映射约束**：使用 `matchedFields` Set 确保每个目标字段只被映射一次。一旦某列匹配到某字段，该字段不再参与后续列的匹配。
- **最低置信度阈值 0.4**：低于此阈值的列标记为未匹配（targetField 为空，suggestion 为 reject）。
- **贪心算法**：每个列选择置信度最高的字段，不考虑全局最优。

#### remapColumn(header, values, targetField, customAliases?) — 重新匹配指定列

```typescript
export function remapColumn(
  header: string,
  values: unknown[],
  targetField: string,
  customAliases?: FieldAliasConfig[]
): ColumnMapping {
  const aliases = customAliases || productFieldAliases;
  const config = aliases.find(a => a.field === targetField);

  if (!config) {
    return {
      sourceColumn: header,
      sourceHeader: header,
      targetField,
      confidence: 0.5,
      matchDetails: {
        nameSimilarity: 0.5,
        semanticSimilarity: 0.5,
        dataPatternScore: 0.5,
        overall: 0.5,
      },
      sampleValues: values.slice(0, 5).map(String),
      suggestion: 'confirm',
    };
  }

  const confidence = calculateConfidence(header, values, config);
  return {
    sourceColumn: header,
    sourceHeader: header,
    targetField,
    confidence: confidence.overall,
    matchDetails: confidence,
    sampleValues: values.slice(0, 5).map(String),
    suggestion: getSuggestion(confidence.overall),
  };
}
```

用于用户手动更改列映射后，重新计算该列与新目标字段的置信度。如果目标字段不在别名配置中，返回中性置信度 0.5 和 suggestion='confirm'。

### 26.4 数据解析器（dataParsers.ts 363行）

#### 价格匹配模式

```typescript
const pricePatterns = [
  { regex: /[¥￥]\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/, extract: 1 },  // ¥1,234.56
  { regex: /(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*[元块]?/, extract: 1 }, // 1,234.56元
  { regex: /(\d+\.?\d*)\s*[w万]/i, multiplier: 10000 },  // 1.5万
  { regex: /(\d+\.?\d*)\s*[k千]/i, multiplier: 1000 },   // 5k
  { regex: /(\d+\.?\d*)\s*[百]/, multiplier: 100 },      // 3百
  { regex: /^\d+\.?\d*$/, extract: 0 },                    // 纯数字
];
```

每个模式包含 regex（正则）、extract（提取组索引）和可选的 multiplier（乘数）。按顺序尝试，第一个匹配成功的模式决定结果。

#### 中文数字映射

```typescript
const chineseNumbers: Record<string, number> = {
  '零': 0, '一': 1, '二': 2, '三': 3, '四': 4,
  '五': 5, '六': 6, '七': 7, '八': 8, '九': 9,
  '十': 10, '百': 100, '千': 1000, '万': 10000,
  '两': 2, '廿': 20, '卅': 30,
};
```

#### 库存文本映射

```typescript
const stockTextMap: Record<string, number | null> = {
  '充足': 999999,
  '大量': 999999,
  '很多': 999999,
  '丰富': 999999,
  '少量': 10,
  '紧张': 5,
  '缺货': 0,
  '无': 0,
  '零': 0,
  '暂无': 0,
  '-': 0,
  '—': 0,
  ' ': null,
};
```

`null` 值表示空格等不确定值，不进行转换。

#### parseChineseNumber(str) — 中文数字解析

```typescript
function parseChineseNumber(str: string): number | null {
  const normalized = str.replace(/[两廿卅]/g, s => {
    const map: Record<string, string> = { '两': '二', '廿': '二十', '卅': '三十' };
    return map[s] || s;
  });

  let result = 0;
  let current = 0;

  for (const char of normalized) {
    const num = chineseNumbers[char];
    if (num === undefined) continue;

    if (num >= 10) {
      if (current === 0) current = 1;
      result += current * num;
      current = 0;
    } else {
      current = current * 10 + num;
    }
  }

  return result + current || null;
}
```

处理逻辑：先归一化异体字（两→二、廿→二十、卅→三十），然后逐字符解析。数字字符累加为 current，单位字符（十/百/千/万）将 current 乘以单位值加到 result。例如"一百二十三" → result=100, current=20, current=3, 最终 123。

#### parsePrice(value) — 价格解析

```typescript
export function parsePrice(value: unknown): ParseResult<number> {
  const raw = value;
  const str = String(value).trim();

  if (value === null || value === undefined || str === '') {
    return { value: null, confidence: 0, raw, error: '空值' };
  }

  const invalidKeywords = ['面议', '待定', '询价', '电议', '协商', '—', '-', '/'];
  if (invalidKeywords.some(kw => str.includes(kw))) {
    return {
      value: null, confidence: 0, raw,
      error: `无法解析的价格描述: "${str}"`,
      warnings: ['建议手动输入具体价格']
    };
  }

  for (const pattern of pricePatterns) {
    const match = str.match(pattern.regex);
    if (match) {
      let num = parseFloat(match[pattern.extract].replace(/,/g, ''));
      if (pattern.multiplier) {
        num *= pattern.multiplier;
      }
      if (!isNaN(num) && num >= 0) {
        return {
          value: Math.round(num * 100) / 100,
          confidence: 0.92,
          raw,
          format: pattern.multiplier ? 'converted' : 'standard'
        };
      }
    }
  }

  // 回退：尝试直接提取数字
  const numericStr = str.replace(/[^0-9.]/g, '');
  const fallback = parseFloat(numericStr);

  if (!isNaN(fallback) && fallback >= 0) {
    return {
      value: Math.round(fallback * 100) / 100,
      confidence: 0.70,
      raw,
      format: 'extracted',
      warnings: [`从"${str}"提取的数字，请确认是否正确`]
    };
  }

  return { value: null, confidence: 0, raw, error: `无法解析价格: "${str}"` };
}
```

解析优先级：
1. 空值检查 → 返回 null
2. 无效关键词检查（面议/待定/询价等）→ 返回 null + 警告
3. 遍历6种价格模式按序匹配 → 置信度0.92
4. 回退提取数字 → 置信度0.70 + 警告
5. 完全无法解析 → 返回 null + error

#### parseNumber(value) — 通用数字解析

```typescript
export function parseNumber(value: unknown): ParseResult<number> {
  const raw = value;
  const str = String(value).trim();

  if (value === null || value === undefined || str === '') {
    return { value: null, confidence: 0, raw };
  }

  // 科学计数法
  if (/^-?\d+\.?\d*[eE][+-]?\d+$/.test(str)) {
    const num = Number(str);
    if (!isNaN(num)) {
      return { value: num, confidence: 0.95, raw, format: 'scientific' };
    }
  }

  // 千分位格式
  if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(str)) {
    const num = parseFloat(str.replace(/,/g, ''));
    if (!isNaN(num)) {
      return { value: num, confidence: 0.95, raw, format: 'thousands' };
    }
  }

  // 分数格式
  if (/^-?\d+\/\d+$/.test(str)) {
    const [num, den] = str.split('/').map(Number);
    if (den !== 0) {
      return { value: num / den, confidence: 0.90, raw, format: 'fraction' };
    }
  }

  // 百分比
  if (/^-?\d+\.?\d*%$/.test(str)) {
    const num = parseFloat(str) / 100;
    if (!isNaN(num)) {
      return { value: num, confidence: 0.90, raw, format: 'percentage' };
    }
  }

  // 中文数字
  const chineseNum = parseChineseNumber(str);
  if (chineseNum !== null) {
    return { value: chineseNum, confidence: 0.85, raw, format: 'chinese' };
  }

  // 标准数字
  const standard = parseFloat(str);
  if (!isNaN(standard)) {
    return { value: standard, confidence: 0.95, raw, format: 'standard' };
  }

  return { value: null, confidence: 0, raw, error: `无法解析数字: "${str}"` };
}
```

支持6种数字格式，按优先级尝试：科学计数法 → 千分位 → 分数 → 百分比 → 中文数字 → 标准数字。

#### parseStock(value) — 库存数量解析

```typescript
export function parseStock(value: unknown): ParseResult<number> {
  const raw = value;
  const str = String(value).trim();

  if (value === null || value === undefined || str === '') {
    return { value: 0, confidence: 0.5, raw };
  }

  // 检查文本映射
  const textValue = stockTextMap[str];
  if (textValue !== undefined) {
    if (textValue === null) {
      return { value: 0, confidence: 0.5, raw };
    }
    return {
      value: textValue,
      confidence: 0.80,
      raw,
      format: 'text-mapped',
      warnings: [`"${str}"已转换为${textValue}，请确认是否正确`]
    };
  }

  // 尝试数字解析
  const numResult = parseNumber(value);
  if (numResult.value !== null) {
    return { ...numResult, format: numResult.format || 'numeric' };
  }

  // 默认回退
  return { value: 0, confidence: 0.3, raw, warnings: [`无法解析"${str}"，默认为0`] };
}
```

库存解析的特殊之处：
1. 空值不返回null，而是返回0（confidence 0.5）
2. 支持中文文本映射（充足→999999、少量→10等）
3. 默认回退为0（confidence 0.3）

#### parseText(value, maxLength?) — 文本解析

```typescript
export function parseText(value: unknown, maxLength?: number): ParseResult<string> {
  const raw = value;

  if (value === null || value === undefined) {
    return { value: '', confidence: 0.5, raw };
  }

  let str = String(value).trim();
  str = str.replace(/\s+/g, ' ');

  if (maxLength && str.length > maxLength) {
    const truncated = str.slice(0, maxLength);
    return {
      value: truncated,
      confidence: 0.80,
      raw,
      warnings: [`文本长度超过${maxLength}字符，已截断`]
    };
  }

  return { value: str, confidence: 0.95, raw };
}
```

处理：去除首尾空格 → 合并多余空格 → 可选长度截断。

#### parseUnit(value) — 单位解析

```typescript
export function parseUnit(value: unknown): ParseResult<string> {
  const raw = value;
  const str = String(value).trim();

  if (!str) {
    return { value: '件', confidence: 0.5, raw, warnings: ['未指定单位，默认为"件"'] };
  }

  const validUnits = ['件', '个', 'kg', '套', '只', '支', '根', '片', '块', '组', '台', '米', '平方米'];

  if (validUnits.includes(str)) {
    return { value: str, confidence: 0.98, raw };
  }

  const unitMap: Record<string, string> = {
    'piece': '件', 'pcs': '件', 'pc': '件',
    'kilogram': 'kg', '公斤': 'kg', '千克': 'kg',
    'set': '套', 'sets': '套',
    'meter': '米', 'm': '米',
  };

  const mapped = unitMap[str.toLowerCase()];
  if (mapped) {
    return { value: mapped, confidence: 0.90, raw, warnings: [`"${str}"已转换为"${mapped}"`] };
  }

  return { value: str, confidence: 0.70, raw, warnings: [`未识别的单位"${str}"`] };
}
```

三级匹配：精确匹配（13个有效单位）→ 模糊映射（9个英文/中文别名）→ 原值保留 + 警告。

#### parseStatus(value) — 状态解析

```typescript
export function parseStatus(value: unknown): ParseResult<string> {
  const raw = value;
  const str = String(value).trim().toLowerCase();

  if (!str) {
    return { value: 'active', confidence: 0.5, raw };
  }

  const statusMap: Record<string, string> = {
    '正常': 'active', 'active': 'active', '启用': 'active', '使用': 'active',
    '停用': 'inactive', 'inactive': 'inactive', '禁用': 'inactive', '停止': 'inactive',
    '草稿': 'draft', 'draft': 'draft', '待确认': 'draft',
  };

  const mapped = statusMap[str];
  if (mapped) {
    return { value: mapped, confidence: 0.95, raw };
  }

  return { value: 'active', confidence: 0.50, raw, warnings: [`未识别的状态"${str}"，默认为active`] };
}
```

#### parseValueByField(value, field) — 按字段类型分发解析

```typescript
export function parseValueByField(value: unknown, field: string): ParseResult {
  switch (field) {
    case 'code':
    case 'name':
    case 'customerCode':
    case 'customerName':
    case 'workpieceNo':
      return parseText(value);
    case 'material':
      return parseText(value);
    case 'process':
      return parseText(value);
    case 'techRequirement':
      return parseText(value, 500);
    case 'unit':
      return parseUnit(value);
    case 'unitPrice':
      return parsePrice(value);
    case 'stock':
      return parseStock(value);
    case 'warningThreshold':
      return parseNumber(value);
    default:
      return parseText(value);
  }
}
```

#### generateDataIssue(rowIndex, column, parsed) — 生成数据问题

```typescript
export function generateDataIssue(
  rowIndex: number,
  column: string,
  parsed: ParseResult
): DataIssue | null {
  if (parsed.value === null || parsed.value === undefined) {
    if (parsed.error) {
      return {
        rowIndex,
        column,
        type: 'error',
        message: parsed.error,
        rawValue: parsed.raw,
      };
    }
    return null;
  }

  if (parsed.confidence < 0.5 && parsed.warnings) {
    return {
      rowIndex,
      column,
      type: 'warning',
      message: parsed.warnings[0],
      rawValue: parsed.raw,
    };
  }

  return null;
}
```

生成逻辑：
- 解析值为 null 且有 error → 生成 error 级别问题
- 置信度 < 0.5 且有 warnings → 生成 warning 级别问题
- 其他情况 → 不生成问题

### 26.5 字段拆分器（fieldSplitter.ts 413行）

#### similarity(a, b) — 简化字符串相似度

```typescript
function similarity(a: string, b: string): number {
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();

  if (aLower === bLower) return 1;
  if (aLower.includes(bLower) || bLower.includes(aLower)) return 0.8;

  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;

  let common = 0;
  for (const char of aLower) {
    if (bLower.includes(char)) common++;
  }

  return common / maxLen;
}
```

三级匹配：完全匹配(1.0) → 包含关系(0.8) → 字符重叠比例。

#### extractByKeyValue(text) — 键值对模式提取

```typescript
function extractByKeyValue(text: string): Partial<CompositeSplit> {
  const result: Partial<CompositeSplit> = {};

  for (const pattern of compositeFieldPatterns.keyValuePatterns) {
    const match = text.match(pattern.regex);
    if (match) {
      const value = match[1].trim();
      switch (pattern.field) {
        case 'material':
          result.material = parseText(value) as ParseResult<string>;
          break;
        case 'process':
          result.process = parseText(value) as ParseResult<string>;
          break;
        case 'techRequirement':
          result.techRequirement = parseText(value) as ParseResult<string>;
          break;
      }
    }
  }

  return result;
}
```

使用 `compositeFieldPatterns.keyValuePatterns` 中的6个正则模式提取：
- `材质：XXX` → material
- `材料：XXX` → material
- `工艺：XXX` → process
- `处理：XXX` → process
- `要求：XXX` → techRequirement
- `技术：XXX` → techRequirement

#### splitByDelimiters(text) — 按分隔符拆分

```typescript
function splitByDelimiters(text: string): string[] {
  const delimiters = compositeFieldPatterns.delimiters;
  const regex = new RegExp(
    `[${delimiters.map(d => d.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')).join('')}]`,
    'g'
  );
  return text.split(regex).map(s => s.trim()).filter(Boolean);
}
```

分隔符列表：`['/', '、', ',', '，', ';', '；', '|', ' ', '，', '／']`

正则中的特殊字符会被转义。拆分后去除空白片段。

#### classifyFragment(fragment) — 片段分类

```typescript
function classifyFragment(fragment: string): {
  type: 'material' | 'process' | 'requirement' | 'unknown';
  confidence: number;
  matchedStandard?: string;
} {
  const lower = fragment.toLowerCase();

  // 1. 材质匹配
  for (const material of allMaterialStandards) {
    for (const alias of material.aliases) {
      const sim = similarity(lower, alias.toLowerCase());
      if (sim >= 0.8) {
        return { type: 'material', confidence: sim, matchedStandard: material.standard };
      }
    }
  }

  // 材质指示词检查
  for (const indicator of compositeFieldPatterns.materialIndicators) {
    if (lower.includes(indicator.toLowerCase())) {
      return { type: 'material', confidence: 0.6 };
    }
  }

  // 2. 工艺匹配
  for (const process of processStandards) {
    for (const alias of process.aliases) {
      const sim = similarity(lower, alias.toLowerCase());
      if (sim >= 0.8) {
        return { type: 'process', confidence: sim, matchedStandard: process.standard };
      }
    }
  }

  // 工艺指示词检查
  for (const indicator of compositeFieldPatterns.processIndicators) {
    if (lower.includes(indicator.toLowerCase())) {
      return { type: 'process', confidence: 0.6 };
    }
  }

  // 3. 技术要求匹配
  for (const indicator of compositeFieldPatterns.requirementIndicators) {
    if (lower.includes(indicator.toLowerCase())) {
      return { type: 'requirement', confidence: 0.5 };
    }
  }

  return { type: 'unknown', confidence: 0 };
}
```

分类优先级：材质匹配 → 材质指示词 → 工艺匹配 → 工艺指示词 → 技术要求指示词 → unknown。

#### fuzzyMatchMaterial(input) — 材质模糊匹配

```typescript
export function fuzzyMatchMaterial(input: string): {
  standard: string;
  confidence: number;
  matchedBy: 'exact' | 'contains' | 'fuzzy' | 'none';
  original: string;
} {
  const normalized = input.toUpperCase().replace(/\s/g, '');

  // 第1层：精确匹配
  for (const material of allMaterialStandards) {
    for (const alias of material.aliases) {
      if (normalized === alias.toUpperCase().replace(/\s/g, '')) {
        return { standard: material.standard, confidence: 1.0, matchedBy: 'exact', original: input };
      }
    }
  }

  // 第2层：包含匹配
  for (const material of allMaterialStandards) {
    for (const alias of material.aliases) {
      const aliasNorm = alias.toUpperCase().replace(/\s/g, '');
      if (normalized.includes(aliasNorm) || aliasNorm.includes(normalized)) {
        return { standard: material.standard, confidence: 0.85, matchedBy: 'contains', original: input };
      }
    }
  }

  // 第3层：模糊匹配（编辑距离）
  let bestMatch: { standard: string; distance: number; alias: string } | null = null;

  for (const material of allMaterialStandards) {
    for (const alias of material.aliases) {
      const aliasNorm = alias.toUpperCase().replace(/\s/g, '');
      let distance = 0;
      const maxLen = Math.max(normalized.length, aliasNorm.length);

      if (maxLen > 0) {
        for (let i = 0; i < Math.min(normalized.length, aliasNorm.length); i++) {
          if (normalized[i] !== aliasNorm[i]) distance++;
        }
        distance += Math.abs(normalized.length - aliasNorm.length);
      }

      if (!bestMatch || distance < bestMatch.distance) {
        bestMatch = { standard: material.standard, distance, alias };
      }
    }
  }

  if (bestMatch && bestMatch.distance <= 2 && normalized.length >= 2) {
    const confidence = 1 - (bestMatch.distance / Math.max(normalized.length, bestMatch.alias.length));
    return { standard: bestMatch.standard, confidence: Math.max(0.5, confidence), matchedBy: 'fuzzy', original: input };
  }

  // 未匹配到标准材质
  return { standard: input, confidence: 0.3, matchedBy: 'none', original: input };
}
```

三层匹配策略：
1. 精确匹配（大小写+空格归一化后完全相等）→ confidence=1.0
2. 包含匹配（互相包含）→ confidence=0.85
3. 模糊匹配（编辑距离≤2）→ confidence=0.5~1.0
4. 未匹配 → 原值保留，confidence=0.3

#### fuzzyMatchProcess(input) — 工艺模糊匹配

与 fuzzyMatchMaterial 类似的三层匹配，额外支持组合工艺处理：

```typescript
// 组合工艺处理（如"淬火+回火"）
const comboDelimiters = /[+加\/&]/;
if (comboDelimiters.test(input)) {
  const parts = input.split(comboDelimiters).map(s => s.trim()).filter(Boolean);
  const matchedParts = parts.map(p => fuzzyMatchProcess(p)).filter(r => r.confidence > 0.5);

  if (matchedParts.length > 0) {
    const combined = matchedParts.map(p => p.standard).join('+');
    const avgConfidence = matchedParts.reduce((sum, p) => sum + p.confidence, 0) / matchedParts.length;
    return {
      standard: combined,
      confidence: avgConfidence * 0.9,
      matchedBy: 'contains',
      original: input,
    };
  }
}
```

递归处理：将组合工艺按 `+加/&` 分隔，对每个子部分递归调用 fuzzyMatchProcess，合并匹配结果（confidence取平均*0.9）。

#### splitCompositeField(text) — 混合字段拆分主函数

```typescript
export function splitCompositeField(text: string): CompositeSplit {
  const original = text.trim();

  if (!original) {
    return { original, confidence: 0 };
  }

  // 1. 尝试键值对提取
  const keyValueResult = extractByKeyValue(original);
  if (keyValueResult.material || keyValueResult.process || keyValueResult.techRequirement) {
    const hasMaterial = !!keyValueResult.material;
    const hasProcess = !!keyValueResult.process;
    const hasRequirement = !!keyValueResult.techRequirement;

    return {
      material: keyValueResult.material,
      process: keyValueResult.process,
      techRequirement: keyValueResult.techRequirement,
      original,
      confidence: (hasMaterial ? 0.3 : 0) + (hasProcess ? 0.3 : 0) + (hasRequirement ? 0.3 : 0) + 0.1,
    };
  }

  // 2. 按分隔符拆分 + 片段分类
  const fragments = splitByDelimiters(original);
  const classified = fragments.map(f => ({
    fragment: f,
    ...classifyFragment(f),
  }));

  const result: CompositeSplit = { original, confidence: 0 };
  let classifiedCount = 0;

  for (const item of classified) {
    if (item.type === 'material' && !result.material) {
      const matched = fuzzyMatchMaterial(item.fragment);
      result.material = {
        value: matched.standard,
        confidence: matched.confidence,
        raw: item.fragment,
        warnings: matched.matchedBy === 'none' ? ['未匹配到标准材质'] : undefined,
      };
      classifiedCount++;
    } else if (item.type === 'process' && !result.process) {
      const matched = fuzzyMatchProcess(item.fragment);
      result.process = {
        value: matched.standard,
        confidence: matched.confidence,
        raw: item.fragment,
        warnings: matched.matchedBy === 'none' ? ['未匹配到标准工艺'] : undefined,
      };
      classifiedCount++;
    } else if (item.type === 'requirement' && !result.techRequirement) {
      result.techRequirement = parseText(item.fragment, 500);
      classifiedCount++;
    }
  }

  result.confidence = classifiedCount > 0
    ? Math.min(0.9, classifiedCount * 0.3 + 0.1)
    : 0.3;

  return result;
}
```

拆分策略：
1. 优先尝试键值对提取（如"材质：45# 工艺：淬火"）
2. 失败则按分隔符拆分 + 逐片段分类
3. 对分类为材质的片段调用 fuzzyMatchMaterial 标准化
4. 对分类为工艺的片段调用 fuzzyMatchProcess 标准化
5. 对分类为技术要求的片段调用 parseText
6. confidence = 已分类片段数 * 0.3 + 0.1（上限0.9）

### 26.6 材质标准库（materialStandards.ts 462行）

#### 碳素结构钢（carbonSteels）

| 标准 | 名称 | 别名 |
|------|------|------|
| Q195 | 碳素结构钢 | Q195, 195, Q195A, Q195B |
| Q215 | 碳素结构钢 | Q215, 215, Q215A, Q215B |
| Q235 | 碳素结构钢 | Q235, 235, Q235A, Q235B, Q235C, Q235D, A3, A3钢 |
| Q275 | 碳素结构钢 | Q275, 275 |

#### 优质碳素结构钢（qualityCarbonSteels）

| 标准 | 名称 | 别名 |
|------|------|------|
| 08# | 优质碳素结构钢 | 08#, 08, 08F, 08钢, 零八号钢 |
| 10# | 优质碳素结构钢 | 10#, 10, 10F, 10钢, 十号钢 |
| 15# | 优质碳素结构钢 | 15#, 15, 15F, 15钢, 十五号钢 |
| 20# | 优质碳素结构钢 | 20#, 20, 20F, 20钢, 二十号钢 |
| 25# | 优质碳素结构钢 | 25#, 25, 25钢, 二十五号钢 |
| 30# | 优质碳素结构钢 | 30#, 30, 30钢, 三十号钢 |
| 35# | 优质碳素结构钢 | 35#, 35, 35钢, 三十五号钢 |
| 40# | 优质碳素结构钢 | 40#, 40, 40钢, 四十号钢 |
| 45# | 优质碳素结构钢 | 45#, 45, 45钢, 四十五号钢, 45号钢, 45#钢 |
| 50# | 优质碳素结构钢 | 50#, 50, 50钢, 五十号钢 |
| 55# | 优质碳素结构钢 | 55#, 55, 55钢, 五十五号钢 |
| 60# | 优质碳素结构钢 | 60#, 60, 60钢 |
| 65# | 优质碳素结构钢 | 65#, 65, 65钢 |
| 70# | 优质碳素结构钢 | 70#, 70, 70钢 |
| 75# | 优质碳素结构钢 | 75#, 75, 75钢 |
| 80# | 优质碳素结构钢 | 80#, 80, 80钢 |
| 85# | 优质碳素结构钢 | 85#, 85, 85钢 |

#### 合金结构钢（alloySteels）

| 标准 | 名称 | 别名 |
|------|------|------|
| 20Cr | 合金结构钢 | 20Cr, 20铬, 20CrMo |
| 40Cr | 合金结构钢 | 40Cr, 40铬, 40CrMo |
| 45Cr | 合金结构钢 | 45Cr, 45铬 |
| 50Cr | 合金结构钢 | 50Cr, 50铬 |
| 20Mn | 合金结构钢 | 20Mn, 20锰 |
| 40Mn | 合金结构钢 | 40Mn, 40锰 |
| 50Mn | 合金结构钢 | 50Mn, 50锰 |
| 20CrMnTi | 合金结构钢 | 20CrMnTi, 20铬锰钛 |
| 40CrMnTi | 合金结构钢 | 40CrMnTi, 40铬锰钛 |
| 30CrMnSi | 合金结构钢 | 30CrMnSi, 30铬锰硅 |
| 35CrMnSiA | 合金结构钢 | 35CrMnSiA, 35铬锰硅A |
| 20CrMo | 合金结构钢 | 20CrMo, 20铬钼 |
| 35CrMo | 合金结构钢 | 35CrMo, 35铬钼 |
| 42CrMo | 合金结构钢 | 42CrMo, 42铬钼, 42CrMo4 |
| 40CrNi | 合金结构钢 | 40CrNi, 40铬镍 |
| 40CrNiMoA | 合金结构钢 | 40CrNiMoA, 40铬镍钼A |
| 18CrNiMo7-6 | 合金结构钢 | 18CrNiMo7-6, 18CrNiMo |

#### 不锈钢（stainlessSteels）

| 标准 | 名称 | 别名 |
|------|------|------|
| 304 | 不锈钢 | 304, 304不锈钢, 0Cr18Ni9, 06Cr19Ni10 |
| 316 | 不锈钢 | 316, 316不锈钢, 0Cr17Ni12Mo2, 06Cr17Ni12Mo2 |
| 201 | 不锈钢 | 201, 201不锈钢 |
| 202 | 不锈钢 | 202, 202不锈钢 |
| 321 | 不锈钢 | 321, 321不锈钢, 0Cr18Ni9Ti |
| 309 | 不锈钢 | 309, 309不锈钢, 2Cr23Ni13 |
| 310 | 不锈钢 | 310, 310不锈钢, 2Cr25Ni20 |
| 430 | 不锈钢 | 430, 430不锈钢, 1Cr17 |
| 410 | 不锈钢 | 410, 410不锈钢, 1Cr13 |
| 420 | 不锈钢 | 420, 420不锈钢, 2Cr13 |

#### 工具钢（toolSteels）

| 标准 | 名称 | 别名 |
|------|------|------|
| T8 | 碳素工具钢 | T8, T8A, T8钢 |
| T10 | 碳素工具钢 | T10, T10A, T10钢 |
| T12 | 碳素工具钢 | T12, T12A, T12钢 |
| 9SiCr | 合金工具钢 | 9SiCr, 9硅铬 |
| CrWMn | 合金工具钢 | CrWMn, 铬钨锰 |
| 9Mn2V | 合金工具钢 | 9Mn2V |
| Cr12 | 合金工具钢 | Cr12, D3 |
| Cr12MoV | 合金工具钢 | Cr12MoV, D2 |
| 3Cr2W8V | 合金工具钢 | 3Cr2W8V, H21 |
| 5CrNiMo | 合金工具钢 | 5CrNiMo, L6 |
| 5CrMnMo | 合金工具钢 | 5CrMnMo |
| H13 | 热作模具钢 | H13, 4Cr5MoSiV1, SKD61 |
| P20 | 塑料模具钢 | P20, 3Cr2Mo |
| 718 | 塑料模具钢 | 718, 3Cr2NiMo |
| NAK80 | 塑料模具钢 | NAK80, 10Ni3MnCuAl |
| S136 | 塑料模具钢 | S136, 4Cr13 |

#### allMaterialStandards 聚合

```typescript
export const allMaterialStandards: MaterialStandard[] = [
  ...carbonSteels,
  ...qualityCarbonSteels,
  ...alloySteels,
  ...stainlessSteels,
  ...toolSteels,
];
```

#### 工艺标准库（processStandards）

**热处理类（heat）**：

| 标准 | 名称 | 别名 |
|------|------|------|
| 淬火 | 热处理 | 淬火, 淬, Quenching, quench |
| 回火 | 热处理 | 回火, 回, Tempering, temper |
| 正火 | 热处理 | 正火, 常化, Normalizing |
| 退火 | 热处理 | 退火, Annealing, anneal |
| 调质 | 热处理 | 调质, 调质处理, Quenching and Tempering, QT |
| 固溶 | 热处理 | 固溶, 固溶处理, Solution Treatment |
| 时效 | 热处理 | 时效, 时效处理, Aging |
| 渗碳 | 热处理 | 渗碳, 渗碳处理, Carburizing |
| 碳氮共渗 | 热处理 | 碳氮共渗, Carbonitriding |
| 氮化 | 热处理 | 氮化, 渗氮, Nitriding, Nitro |
| 软氮化 | 热处理 | 软氮化, 氮碳共渗, Ferritic Nitrocarburizing |
| 高频淬火 | 热处理 | 高频淬火, 高频, HF Quenching |
| 中频淬火 | 热处理 | 中频淬火, 中频, MF Quenching |
| 火焰淬火 | 热处理 | 火焰淬火, Flame Quenching |

**表面处理类（surface）**：

| 标准 | 名称 | 别名 |
|------|------|------|
| 喷砂 | 表面处理 | 喷砂, Sandblasting |
| 抛光 | 表面处理 | 抛光, Polishing, polish |
| 镀硬铬 | 表面处理 | 镀硬铬, 硬铬, Hard Chrome |
| 镀锌 | 表面处理 | 镀锌, Galvanizing |
| 发黑 | 表面处理 | 发黑, 发黑处理, Blackening |
| 磷化 | 表面处理 | 磷化, 磷化处理, Phosphating |
| 阳极氧化 | 表面处理 | 阳极氧化, Anodizing, Anode |
| 电泳 | 表面处理 | 电泳, 电泳涂装, Electrophoresis |

**机加工类（machining）**：

| 标准 | 名称 | 别名 |
|------|------|------|
| 车削 | 机加工 | 车削, 车加工, Turning |
| 铣削 | 机加工 | 铣削, 铣加工, Milling |
| 磨削 | 机加工 | 磨削, 磨加工, Grinding |
| 线切割 | 机加工 | 线切割, 线割, WEDM, Wire EDM |

### 26.7 字段别名配置（fieldAliases.ts 122行）

#### productFieldAliases — 12个字段的完整匹配配置

| 字段 | exact别名 | fuzzy别名 | patterns正则 | dataPatterns |
|------|----------|----------|-------------|--------------|
| code | 编码, 编号, 产品编码, 产品编号, code, productCode, 编号 | 码, 号, 编号, 编码, 代号, SKU, 货号 | `/^编[码号]?/`, `/code/i`, `/编号?/`, `/sku/i`, `/货号?/` | `/^[A-Za-z0-9\-]+$/` |
| name | 产品名称, 产品名, 品名, name, productName, 货物名称, 货品名称 | 产品, 名称, 品名, 货品, 货物 | `/^产品(名\|名称)?$/`, `/品名/`, `/^name$/i`, `/^product(name)?$/i` | `/.{2,50}/` |
| material | 材质, 材料, 材质规格, material, 钢种, 牌号 | 钢, 材质, 材料, 钢种, 钢号, 材质类型, 材料规格 | `/材质?/`, `/材料?/`, `/钢号?/`, `/钢种?/`, `/牌号?/`, `/\d{2,}#/` | `/[#钢铁铝铜合金]/`, `/^(Q\d\|\d{2,}#\|20Cr\|40Cr\|42CrMo)/i` |
| process | 工艺, 加工工艺, 处理工艺, process, 加工方式, 热处理 | 处理, 工艺, 加工, 热处理方式, 表面工艺 | `/工艺?/`, `/process/i`, `/处理/`, `/加工/`, `/淬火\|回火\|正火\|退火\|调质\|渗碳\|氮化/` | — |
| techRequirement | 技术要求, 技术条件, 质量要求, techRequirement, 验收标准 | 要求, 技术, 质量, 标准, 规范 | `/技术(要求\|条件\|标准)?/`, `/质量(要求\|标准)?/`, `/验收/`, `/规范/`, `/HRC\|HB\|HV/` | — |
| workpieceNo | 图号, 工件号, 零件号, workpieceNo, drawingNo, 件号 | 图号, 工件, 零件, 图纸, drawing | `/图号?/`, `/工件号?/`, `/零件号?/`, `/drawing/i`, `/件号?/` | — |
| unit | 单位, 计量单位, unit | 单位, 件, 个, kg, 套 | `/单位?/`, `/unit/i` | `/^(件\|个\|kg\|套\|只\|支\|根\|片\|块\|套\|组)$/` |
| unitPrice | 单价, 价格, 单价(元), unitPrice, price, 报价 | 价, 金额, 单价, 价格, 成本, 费用, 元, 钱 | `/^单价?/`, `/price/i`, `/cost/i`, `/金额?/`, `/元/`, `/报价/` | `/^\d+\.?\d*$/`, `/[¥￥]\s*\d+/`, `/\d+\s*[元块]/` |
| customerCode | 客户编码, 客户编号, customerCode, 客户代码 | 客户, 编码, 编号, 代码 | `/客户(编码\|编号\|代码)?/`, `/customer( code\| id)?/i` | — |
| customerName | 客户名称, 客户名, customerName, 客户单位, 客户公司名称 | 客户名称, 客户名, 客户单位, 公司名称, 客户公司 | `/客户(名\|名称\|单位)$/`, `/^customer( name)?$/i`, `/客户公司/` | `/^[^\d]{2,20}$/` |
| stock | 库存, 库存数量, stock, 库存量, 现有库存 | 库存, 数量, 存量, 现有, 剩余 | `/库存?/`, `/stock/i`, `/数量/`, `/存量/` | `/^\d+$/`, `/^\d+\.?\d*$/` |
| warningThreshold | 预警值, 阈值, 库存预警, warningThreshold, 预警数量 | 预警, 阈值, 告警, 提醒值, 安全库存 | `/预警/`, `/阈值/`, `/告警/`, `/warning/i`, `/threshold/i`, `/安全库存/` | `/^\d+$/` |

#### compositeFieldPatterns — 复合字段模式

```typescript
export const compositeFieldPatterns = {
  delimiters: ['/', '、', ',', '，', ';', '；', '|', ' ', '，', '／'],

  materialIndicators: [
    '钢', '铁', '铝', '铜', '合金', '#', 'Q', 'CR', 'MO', 'MN', 'NI', 'TI',
    '45', '40', '42', '20', '35', '304', '316', '201', 'Q235', 'Q345'
  ],

  processIndicators: [
    '淬火', '回火', '正火', '退火', '调质', '渗碳', '氮化', '碳氮共渗',
    '高频', '中频', '感应', '表面', '喷砂', '抛光', '镀铬', '镀锌',
    '发黑', '磷化', '氧化'
  ],

  requirementIndicators: [
    '硬度', 'HRC', 'HB', 'HV', '强度', '精度', '粗糙度', 'Ra', '公差',
    '尺寸', '规格', '范围', '-', '~', '至'
  ],

  keyValuePatterns: [
    { regex: /材质[：:]?\s*([^工艺要求\s]+)/i, field: 'material' },
    { regex: /材料[：:]?\s*([^工艺要求\s]+)/i, field: 'material' },
    { regex: /工艺[：:]?\s*([^要求\s]+)/i, field: 'process' },
    { regex: /处理[：:]?\s*([^要求\s]+)/i, field: 'process' },
    { regex: /要求[：:]?\s*(.+)/i, field: 'techRequirement' },
    { regex: /技术[：:]?\s*(.+)/i, field: 'techRequirement' },
  ],
};
```

### 26.8 主入口与完整流程（index.ts 739行）

#### parseExcelFile(file) — 解析Excel文件

```typescript
export function parseExcelFile(file: File): Promise<{
  headers: string[];
  data: Record<string, unknown>[];
  sheetName: string;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
          header: 1,
          defval: '',
        });

        if (jsonData.length < 2) {
          reject(new Error('Excel文件数据不足，至少需要包含表头和一行数据'));
          return;
        }

        const headers = (jsonData[0] as unknown as string[]).map(h => String(h).trim());
        const rows = jsonData.slice(1).map((row) => {
          const obj: Record<string, unknown> = {};
          headers.forEach((header, index) => {
            obj[header] = (row as unknown as unknown[])[index];
          });
          return obj;
        });

        resolve({ headers, data: rows, sheetName: firstSheetName });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };

    reader.readAsArrayBuffer(file);
  });
}
```

使用 XLSX 库（SheetJS）解析 Excel 文件。流程：
1. FileReader 读取为 ArrayBuffer
2. XLSX.read 解析工作簿（type: 'array'）
3. 取第一个工作表
4. sheet_to_json 转换（header: 1 表示第一行作为数组返回，defval: '' 空值填充）
5. 至少需要 2 行（表头 + 1 行数据）
6. 提取 headers（trim）和 rows（按 header 建对象）

#### analyzeColumnSamples(data, headers) — 分析列数据样本

```typescript
function analyzeColumnSamples(
  data: Record<string, unknown>[],
  headers: string[]
): Record<string, unknown[]> {
  const samples: Record<string, unknown[]> = {};

  for (const header of headers) {
    samples[header] = data
      .map(row => row[header])
      .filter(v => v !== undefined && v !== null && v !== '')
      .slice(0, 10);
  }

  return samples;
}
```

提取每列前 10 个有效值（非 undefined/null/空字符串），用于列匹配引擎的数据模式分析。

#### normalizeData(data, columnMappings) — 标准化Excel数据

```typescript
function normalizeData(
  data: Record<string, unknown>[],
  columnMappings: ColumnMapping[]
): NormalizedRow[] {
  const normalizedRows: NormalizedRow[] = [];

  for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
    const row = data[rowIndex];
    const normalizedRow: NormalizedRow = {
      _rowIndex: rowIndex,
      _quality: 'valid',
      _issues: [],
    };

    // 检查是否有复合字段列
    const compositeMapping = columnMappings.find(
      m => m.targetField === 'composite[material+process]'
    );

    let compositeSplit: CompositeSplit | null = null;
    if (compositeMapping) {
      const compositeValue = row[compositeMapping.sourceColumn];
      if (compositeValue) {
        compositeSplit = splitCompositeField(String(compositeValue));
      }
    }

    for (const mapping of columnMappings) {
      if (!mapping.targetField || mapping.targetField.startsWith('composite')) continue;

      // 从复合字段拆分的值
      if (compositeSplit && ['material', 'process', 'techRequirement'].includes(mapping.targetField)) {
        const splitValue = compositeSplit[mapping.targetField as keyof CompositeSplit];
        if (typeof splitValue === 'object' && splitValue !== null && 'value' in splitValue) {
          normalizedRow[mapping.targetField] = splitValue as ParseResult;
          if (splitValue.warnings) {
            for (const warning of splitValue.warnings) {
              normalizedRow._issues.push({
                rowIndex,
                column: mapping.targetField,
                type: 'warning',
                message: warning,
                rawValue: compositeSplit.original,
              });
            }
          }
          continue;
        }
      }

      // 普通字段解析
      const value = row[mapping.sourceColumn];
      const parsed = parseValueByField(value, mapping.targetField);
      normalizedRow[mapping.targetField] = parsed;

      const issue = generateDataIssue(rowIndex, mapping.targetField, parsed);
      if (issue) {
        normalizedRow._issues.push(issue);
      }
    }

    // 必填字段验证
    const requiredFields = ['code', 'name', 'customerCode', 'customerName'];
    for (const field of requiredFields) {
      const fieldValue = normalizedRow[field];
      let value: string | null = null;

      if (typeof fieldValue === 'object' && fieldValue !== null && 'value' in fieldValue) {
        value = String((fieldValue as ParseResult).value || '');
      } else if (typeof fieldValue === 'string') {
        value = fieldValue;
      } else {
        value = String(fieldValue || '');
      }

      if (!value || value.trim() === '') {
        const fieldLabels: Record<string, string> = {
          code: '产品编码',
          name: '产品名称',
          customerCode: '客户编码',
          customerName: '客户名称',
        };
        normalizedRow._issues.push({
          rowIndex,
          column: field,
          type: 'error',
          message: `${fieldLabels[field]}不能为空`,
          rawValue: '',
        });
      }
    }

    // 确定行质量
    const errors = normalizedRow._issues.filter(i => i.type === 'error').length;
    const warnings = normalizedRow._issues.filter(i => i.type === 'warning').length;

    if (errors > 0) {
      normalizedRow._quality = 'error';
    } else if (warnings > 0) {
      normalizedRow._quality = 'warning';
    }

    normalizedRows.push(normalizedRow);
  }

  return normalizedRows;
}
```

标准化流程：
1. 遍历每行数据
2. 检查是否有复合字段列（`composite[material+process]`），如有则调用 splitCompositeField
3. 对每个列映射，优先使用复合字段拆分结果，否则调用 parseValueByField
4. 生成数据问题（generateDataIssue）
5. 必填字段验证（code/name/customerCode/customerName）
6. 行质量分级：有 error → 'error'，仅有 warning → 'warning'，无问题 → 'valid'

#### generateQualityReport(totalRows, normalizedData) — 生成数据质量报告

```typescript
function generateQualityReport(
  totalRows: number,
  normalizedData: NormalizedRow[]
): DataQualityReport {
  const validRows = normalizedData.filter(r => r._quality === 'valid').length;
  const warningRows = normalizedData.filter(r => r._quality === 'warning').length;
  const errorRows = normalizedData.filter(r => r._quality === 'error').length;

  const allIssues: DataIssue[] = [];
  for (const row of normalizedData) {
    allIssues.push(...row._issues);
  }

  // 按错误类型统计
  const errorTypes = new Map<string, number>();
  for (const issue of allIssues) {
    const key = `${issue.type}:${issue.column}:${issue.message}`;
    errorTypes.set(key, (errorTypes.get(key) || 0) + 1);
  }

  // 取最常见的问题（前20条）
  const topIssues = Array.from(errorTypes.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([key, count]) => {
      const [type, column, ...messageParts] = key.split(':');
      const firstIssue = allIssues.find(i =>
        i.type === type && i.column === column
      );
      return {
        rowIndex: -1,
        column,
        type: type as 'error' | 'warning' | 'info',
        message: `${messageParts.join(':')} (影响${count}行)`,
        rawValue: firstIssue?.rawValue,
      };
    });

  const overall = totalRows > 0
    ? (validRows + warningRows * 0.5) / totalRows
    : 0;

  return {
    overall: Math.round(overall * 100) / 100,
    totalRows,
    validRows,
    warningRows,
    errorRows,
    issues: topIssues,
  };
}
```

报告生成逻辑：
1. 统计 valid/warning/error 行数
2. 收集所有 DataIssue
3. 按 `type:column:message` 为 key 聚合统计
4. 取出现次数最多的前 20 条问题
5. 每条聚合问题的 message 追加 "(影响N行)"
6. overall 评分 = (valid + warning*0.5) / total

#### rowHasAnyData(row) — 检查行是否有有效数据

```typescript
function rowHasAnyData(row: Record<string, unknown>): boolean {
  return Object.values(row).some(val => {
    if (val === undefined || val === null) return false;
    const str = String(val).trim();
    return str !== '' && str !== '0';
  });
}
```

注意：值为 '0' 的单元格被视为无数据（因为可能是默认填充值）。只有至少有一个非空非零值的行才被保留。

#### analyzeExcelFile(file) — 完整分析流程

```typescript
export async function analyzeExcelFile(file: File): Promise<ImportPreviewState> {
  // 1. 解析Excel
  const { headers, data, sheetName } = await parseExcelFile(file);

  // 1.5 自动过滤完全空白的行
  const filteredData = data.filter(row => rowHasAnyData(row));
  const emptyRowCount = data.length - filteredData.length;

  if (emptyRowCount > 0) {
    toast.info(`已自动过滤 ${emptyRowCount} 行空白数据`);
  }

  // 2. 分析列样本
  const samples = analyzeColumnSamples(filteredData, headers);

  // 3. 智能列匹配
  let columnMappings = matchColumns(headers, samples);

  // 4. 检查是否有材质和工艺合并的列
  const materialMapping = columnMappings.find(m => m.targetField === 'material');
  const processMapping = columnMappings.find(m => m.targetField === 'process');

  if (materialMapping && processMapping &&
      materialMapping.sourceColumn === processMapping.sourceColumn) {
    columnMappings = columnMappings.filter(m => m.targetField !== 'process');
    const materialMap = columnMappings.find(m => m.targetField === 'material');
    if (materialMap) {
      materialMap.targetField = 'composite[material+process]';
      materialMap.suggestion = 'confirm';
    }
  }

  // 5. 标准化数据
  const normalizedData = normalizeData(filteredData, columnMappings);

  // 6. 生成质量报告
  const qualityReport = generateQualityReport(filteredData.length, normalizedData);

  return {
    fileName: file.name,
    totalRows: filteredData.length,
    columnMappings,
    normalizedData,
    qualityReport,
    selectedRows: normalizedData
      .filter(r => r._quality !== 'error')
      .map(r => r._rowIndex),
    forcedImportRows: [],
  };
}
```

完整流程7步：
1. parseExcelFile 解析 Excel
2. rowHasAnyData 过滤空白行 + toast 提示
3. analyzeColumnSamples 采样
4. matchColumns 列匹配
5. 复合字段检测（材质+工艺同列 → composite[material+process]）
6. normalizeData 标准化
7. generateQualityReport 生成报告

返回的 ImportPreviewState 中，selectedRows 默认包含所有非 error 行，forcedImportRows 为空。

#### updateColumnMapping(state, sourceColumn, newTargetField) — 更新列映射

当用户在预览界面手动更改某列的目标字段时调用：

1. 找到对应列的映射索引
2. 更新映射：targetField 改为新值，confidence=1（用户手动设置），suggestion='auto'
3. 迁移旧字段数据到新字段
4. 重新验证必填字段（优先使用用户编辑值 _userEdits）
5. 重新计算行质量
6. 重新生成质量报告
7. 保留用户选择状态（selectedRows / forcedImportRows 过滤掉已不存在的行）
8. 如果用户之前没做过选择，自动选中新解析出的非错误行

#### convertToProducts(state, defaultCustomerCode?, defaultCustomerName?) — 转换为产品对象

```typescript
export function convertToProducts(
  state: ImportPreviewState,
  defaultCustomerCode?: string,
  defaultCustomerName?: string
): Partial<IProduct>[] {
  const products: Partial<IProduct>[] = [];
  const allFields = ['code', 'name', 'material', 'process', 'techRequirement',
    'workpieceNo', 'unit', 'unitPrice', 'stock', 'warningThreshold',
    'customerCode', 'customerName'];

  for (const rowIndex of state.selectedRows) {
    const row = state.normalizedData.find(r => r._rowIndex === rowIndex);
    if (!row) continue;

    // 自动过滤空白行
    if (!hasAnyData(row, allFields)) continue;

    // 获取值（优先用户编辑）
    const getValue = (field: string): unknown => {
      const result = row[field];
      if (typeof result === 'object' && result !== null && 'value' in result) {
        return (result as ParseResult).value;
      }
      return result;
    };

    let code = String(getValue('code') || '');
    let name = String(getValue('name') || '');
    let customerCode = String(getValue('customerCode') || '');
    let customerName = String(getValue('customerName') || '');

    // 默认值填充
    if (!customerCode && defaultCustomerCode) {
      customerCode = defaultCustomerCode;
    }
    if (!customerName && defaultCustomerName) {
      customerName = defaultCustomerName;
    }

    // 强制导入模式
    const isForcedImport = state.forcedImportRows.includes(row._rowIndex);

    if (!isForcedImport) {
      // 正常模式：必填字段检查
      const missingFields: string[] = [];
      if (!code.trim()) missingFields.push('产品编码');
      if (!name.trim()) missingFields.push('产品名称');
      if (!customerCode.trim()) missingFields.push('客户编码');
      if (!customerName.trim()) missingFields.push('客户名称');

      if (missingFields.length > 0) continue;
    }

    const product: Partial<IProduct> = {
      code: code.trim(),
      name: name.trim(),
      material: String(getValue('material') || ''),
      process: String(getValue('process') || ''),
      techRequirement: String(getValue('techRequirement') || ''),
      workpieceNo: String(getValue('workpieceNo') || ''),
      unit: String(getValue('unit') || '件'),
      unitPrice: Number(getValue('unitPrice') || 0),
      stock: Number(getValue('stock') || 0),
      warningThreshold: Number(getValue('warningThreshold') || 50),
      customerCode: customerCode.trim(),
      customerName: customerName.trim(),
      status: isForcedImport ? 'incomplete' : 'complete',
    };

    products.push(product);
  }

  return products;
}
```

转换逻辑：
1. 遍历选中的行
2. 过滤空白行（hasAnyData 检查所有12个字段）
3. 获取每个字段值（从 ParseResult 中提取 .value）
4. 客户编码/名称空值时使用默认值填充
5. 正常模式：跳过缺失必填字段的行
6. 强制导入模式：绕过必填检查，status 设为 'incomplete'
7. 默认值：unit='件', unitPrice=0, stock=0, warningThreshold=50

#### exportIssuesToExcel(state, filename) — 导出数据问题为Excel

```typescript
export function exportIssuesToExcel(
  state: ImportPreviewState,
  filename: string
): void {
  const issues = state.normalizedData.flatMap(r =>
    r._issues.map(i => ({
      行号: r._rowIndex + 2,
      字段: i.column,
      类型: i.type === 'error' ? '错误' : i.type === 'warning' ? '警告' : '提示',
      问题描述: i.message,
      原始值: i.rawValue,
      建议: i.suggestion || '',
    }))
  );

  const ws = XLSX.utils.json_to_sheet(issues);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '数据问题');
  XLSX.writeFile(wb, filename);
}
```

行号 +2 是因为 Excel 行号从 1 开始，第 1 行是表头。

#### getCellValue(row, field) — 获取单元格值

```typescript
export function getCellValue(row: NormalizedRow, field: string): ParseResult {
  const userEdit = row._userEdits?.find(e => e.field === field);
  if (userEdit) {
    return {
      value: userEdit.value,
      confidence: 1,
      raw: userEdit.value,
    };
  }
  return (row[field] as ParseResult) || { value: null, confidence: 0, raw: null };
}
```

优先返回用户编辑的值（confidence=1），否则返回解析结果。用于 UI 表格中显示单元格值。

### 26.9 SmartExcelImportDialog组件

SmartExcelImportDialog 是一个1,338行的完整交互组件，提供以下功能区块：

**文件上传区**：
- 支持拖拽上传和点击选择
- 文件格式校验（.xlsx/.xls）
- 文件大小限制提示

**列映射预览区**：
- 自动匹配结果展示（sourceColumn → targetField）
- 置信度颜色编码：绿色(auto)、黄色(confirm)、红色(reject)
- 手动调整下拉框（可重新选择目标字段）
- 样例值展示（前5个）

**数据质量报告面板**：
- 总体评分进度条（0-100%）
- 有效/警告/错误行数统计
- 最常见问题列表（前20条，带影响行数）

**数据预览表格**：
- 行级错误标注（红色背景=error，黄色=warning）
- 单元格级别的 ParseResult 展示
- 用户编辑追踪（标记修改过的单元格）
- 行选择复选框（默认选中非error行）
- 强制导入勾选（允许导入error行，标记为incomplete）

**底部操作栏**：
- 全选/取消全选
- 强制导入选中行
- 导出问题报告为Excel
- 确认导入（调用convertToProducts）

### 26.10 完整导入流程示例

以一个典型Excel文件为例，展示完整处理过程：

**输入Excel**：

| 编号 | 产品名称 | 材质/工艺 | 单价 | 数量 | 客户 |
|------|---------|----------|------|------|------|
| P001 | 齿轮 | 45#/调质 | 25元 | 100 | 甲公司 |
| P002 | 轴套 | 20Cr/淬火+回火 | ￥30 | 200 | 乙公司 |

**Step 1 - 列匹配结果**：

| 源列 | 目标字段 | 置信度 | 建议 |
|------|---------|--------|------|
| 编号 | code | 1.0 | auto |
| 产品名称 | name | 1.0 | auto |
| 材质/工艺 | composite[material+process] | 0.65 | confirm |
| 单价 | unitPrice | 0.92 | auto |
| 数量 | stock | 0.85 | auto |
| 客户 | customerName | 0.80 | confirm |

**Step 2 - 复合字段拆分**：

"45#/调质" → material: 45# (confidence 1.0, exact match), process: 调质 (confidence 1.0, exact match)

"20Cr/淬火+回火" → material: 20Cr (confidence 1.0, exact match), process: 淬火+回火 (confidence 0.81, fuzzy match)

**Step 3 - 数据标准化**：

"25元" → unitPrice: 25 (confidence 0.92, format: standard)
"￥30" → unitPrice: 30 (confidence 0.92, format: standard)

**Step 4 - 质量报告**：

- 总行数: 2
- 有效行: 2
- 警告行: 0
- 错误行: 0
- 总体评分: 1.0

**Step 5 - 产品对象输出**：

```json
[
  {
    "code": "P001",
    "name": "齿轮",
    "material": "45#",
    "process": "调质",
    "unitPrice": 25,
    "stock": 100,
    "customerName": "甲公司",
    "unit": "件",
    "warningThreshold": 50,
    "status": "complete"
  },
  {
    "code": "P002",
    "name": "轴套",
    "material": "20Cr",
    "process": "淬火+回火",
    "unitPrice": 30,
    "stock": 200,
    "customerName": "乙公司",
    "unit": "件",
    "warningThreshold": 50,
    "status": "complete"
  }
]
```
