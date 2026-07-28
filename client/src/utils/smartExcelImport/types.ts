/**
 * 智能Excel导入类型定义
 */

// 字段匹配置信度
export interface MatchConfidence {
  nameSimilarity: number;
  semanticSimilarity: number;
  dataPatternScore: number;
  overall: number;
}

// 列映射结果
export interface ColumnMapping {
  sourceColumn: string;
  sourceHeader: string;
  targetField: string;
  confidence: number;
  matchDetails: MatchConfidence;
  sampleValues: string[];
  suggestion: 'auto' | 'confirm' | 'reject';
}

// 解析结果
export interface ParseResult<T = unknown> {
  value: T | null;
  confidence: number;
  format?: string;
  error?: string;
  raw: unknown;
  warnings?: string[];
}

// 数据质量报告
export interface DataQualityReport {
  overall: number;
  totalRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
  issues: DataIssue[];
}

// 数据问题
export interface DataIssue {
  rowIndex: number;
  column: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  rawValue: unknown;
  suggestion?: string;
}

// 用户编辑记录
export interface UserEdit {
  field: string;
  value: unknown;
  editedAt: number;
}

// 标准化后的行数据
export interface NormalizedRow extends Record<string, ParseResult | number | string | DataIssue[] | UserEdit[] | undefined> {
  _rowIndex: number;
  _quality: 'valid' | 'warning' | 'error';
  _issues: DataIssue[];
  _userEdits?: UserEdit[]; // 用户手动编辑记录
}

// 混合字段拆分结果
export interface CompositeSplit {
  material?: ParseResult<string>;
  process?: ParseResult<string>;
  techRequirement?: ParseResult<string>;
  original: string;
  confidence: number;
}

// 导入预览状态
export interface ImportPreviewState {
  fileName: string;
  totalRows: number;
  columnMappings: ColumnMapping[];
  normalizedData: NormalizedRow[];
  qualityReport: DataQualityReport;
  selectedRows: number[];
  forcedImportRows: number[]; // 用户强制导入的错误行（将被标记为incomplete）
}

// 材质标准信息
export interface MaterialStandard {
  standard: string;
  name: string;
  category: 'carbon' | 'alloy' | 'stainless' | 'tool' | 'other';
  aliases: string[];
}

// 工艺标准信息
export interface ProcessStandard {
  standard: string;
  name: string;
  category: 'heat' | 'surface' | 'machining' | 'other';
  aliases: string[];
}

// 字段别名配置
export interface FieldAliasConfig {
  field: string;
  exact: string[];
  fuzzy: string[];
  patterns: RegExp[];
  dataPatterns?: RegExp[];
}

// 产品导入字段
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
