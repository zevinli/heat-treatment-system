import * as XLSX from '@e965/xlsx';
import type { IProduct } from '@/data/mockData';

export type InboundImportField =
  | 'productCode'
  | 'productName'
  | 'workpieceNo'
  | 'quantity'
  | 'weight'
  | 'unit'
  | 'unitPrice'
  | 'material'
  | 'process'
  | 'techRequirement'
  | 'inboundType'
  | 'urgent'
  | 'remark';

export interface InboundImportRow {
  id: string;
  rowNumber: number;
  productCode: string;
  productName: string;
  workpieceNo: string;
  quantity: number;
  weight: number;
  unit: string;
  unitPrice?: number;
  material: string;
  process: string;
  techRequirement: string;
  inboundType: string;
  urgent: boolean;
  remark: string;
  matchedProductId?: string;
  matchConfidence: number;
  matchReason: string;
  selected: boolean;
  issues: string[];
  parseIssues?: string[];
}

export interface InboundImportAnalysis {
  fileName: string;
  sheetName: string;
  headerRowNumber: number;
  mappings: Partial<Record<InboundImportField, string>>;
  rows: InboundImportRow[];
  ignoredRows: number;
}

const FIELD_ALIASES: Record<InboundImportField, string[]> = {
  productCode: ['产品编码', '产品编号', '产品代码', '物料编码', '物料编号', '货号', '编码', 'code', 'productcode', 'itemcode', 'sku'],
  productName: ['产品名称', '产品名', '物料名称', '物料名', '工件名称', '品名', '名称', '产品', 'product', 'productname', 'item', 'itemname'],
  workpieceNo: ['工件编号', '工件号', '零件号', '图号', '规格型号', '型号', '规格', 'workpieceno', 'partno', 'drawingno', 'model', 'spec'],
  quantity: ['入库数量', '来货数量', '送货数量', '数量件', '数量', '件数', 'qty', 'quantity', 'count'],
  weight: ['入库重量', '来货重量', '送货重量', '净重', '重量kg', '重量', '公斤', '千克', 'weight', 'netweight', 'kg'],
  unit: ['计价单位', '单位', 'unit', 'uom'],
  unitPrice: ['加工单价', '含税单价', '单价', '价格', 'unitprice', 'price'],
  material: ['材料牌号', '材质牌号', '材质', '材料', 'material', 'grade'],
  process: ['加工工艺', '热处理工艺', '热处理方式', '处理方式', '处理工艺', '工艺要求', '工艺', 'process', 'treatment'],
  techRequirement: ['技术要求内容', '技术要求', '质量要求', '硬度要求', '要求', 'techrequirement', 'requirement'],
  inboundType: ['入库类型', '来货类型', '业务类型', '类型', 'inboundtype'],
  urgent: ['是否加急', '加急', '紧急', 'urgent'],
  remark: ['备注说明', '备注', '说明', 'remark', 'note'],
};

function normalizeText(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[（(][^）)]*[）)]/g, '')
    .replace(/[\s_\-—:：/\\.,，。·]+/g, '');
}

const NORMALIZED_ALIASES = Object.fromEntries(
  Object.entries(FIELD_ALIASES).map(([field, aliases]) => [field, aliases.map(normalizeText)]),
) as Record<InboundImportField, string[]>;

function fieldForHeader(header: unknown): InboundImportField | undefined {
  const normalized = normalizeText(header);
  if (!normalized) return undefined;
  const entries = Object.entries(NORMALIZED_ALIASES) as [InboundImportField, string[]][];
  const exact = entries.find(([, aliases]) => aliases.includes(normalized));
  if (exact) return exact[0];
  const fuzzy = entries
    .map(([field, aliases]) => ({
      field,
      score: Math.max(...aliases.map(alias => {
        if (normalized.includes(alias) || alias.includes(normalized)) {
          const coverage = Math.min(normalized.length, alias.length) / Math.max(normalized.length, alias.length);
          return alias.length >= 2 && normalized.includes(alias) ? Math.max(0.9, coverage) : coverage;
        }
        return 0;
      })),
    }))
    .sort((a, b) => b.score - a.score)[0];
  return fuzzy?.score >= 0.72 ? fuzzy.field : undefined;
}

function rowValues(row: unknown[]): string[] {
  return row.map(value => String(value ?? '').trim()).filter(Boolean);
}

function detectHeader(matrix: unknown[][]): { index: number; fields: (InboundImportField | undefined)[]; score: number } {
  let best = { index: -1, fields: [] as (InboundImportField | undefined)[], score: -1 };
  matrix.slice(0, 25).forEach((row, index) => {
    const fields = row.map(fieldForHeader);
    const unique = new Set(fields.filter(Boolean));
    const hasProduct = unique.has('productCode') || unique.has('productName') || unique.has('workpieceNo');
    const hasQuantity = unique.has('quantity') || unique.has('weight');
    const score = unique.size + (hasProduct ? 4 : 0) + (hasQuantity ? 3 : 0);
    if (score > best.score) best = { index, fields, score };
  });
  if (best.score >= 8) return best;

  const firstDataRow = matrix.findIndex(row => rowValues(row).length > 0);
  if (firstDataRow < 0) return best;
  const width = matrix[firstDataRow].length;
  const nextDataRow = matrix.findIndex((row, index) => index > firstDataRow && rowValues(row).length > 0);
  const firstSecondCell = String(matrix[firstDataRow]?.[1] ?? '').trim();
  const nextSecondCell = nextDataRow >= 0 ? String(matrix[nextDataRow]?.[1] ?? '').trim() : '';
  const looksLikeUnknownHeader = Boolean(
    firstSecondCell
    && !/\d/.test(firstSecondCell)
    && /\d/.test(nextSecondCell),
  );
  // 无表头清单也能使用：默认前三列依次识别为产品、数量、重量。
  return {
    index: looksLikeUnknownHeader ? firstDataRow : firstDataRow - 1,
    fields: Array.from({ length: width }, (_, index) =>
      index === 0 ? 'productName' : index === 1 ? 'quantity' : index === 2 ? 'weight' : undefined),
    score: 1,
  };
}

function parseNumber(value: unknown): { value: number; invalid: boolean } {
  if (value === undefined || value === null || String(value).trim() === '') return { value: 0, invalid: false };
  if (typeof value === 'number') return { value, invalid: !Number.isFinite(value) };
  const normalized = String(value)
    .trim()
    .replace(/[，,\s]/g, '')
    .replace(/[件公斤千克吨元￥¥]/g, '')
    .replace(/kg|kgs|pcs?|rmb/gi, '');
  const matched = normalized.match(/[-+]?\d+(?:\.\d+)?/);
  const number = matched ? Number(matched[0]) : Number.NaN;
  return { value: Number.isFinite(number) ? number : 0, invalid: !Number.isFinite(number) };
}

function normalizeUnit(value: unknown): string {
  const normalized = normalizeText(value);
  if (['kg', 'kgs', '公斤', '千克', '重量'].some(unit => normalized.includes(normalizeText(unit)))) return 'kg';
  if (normalized.includes('吨') || normalized === 't') return 'kg';
  return '件';
}

function parseWeight(value: unknown): { value: number; invalid: boolean } {
  const parsed = parseNumber(value);
  if (parsed.invalid) return parsed;
  const raw = String(value ?? '').trim().toLowerCase();
  // 客户清单偶尔直接填写“0.5吨”；系统内部统一使用 kg，导入时完成换算。
  if (/吨|ton(?:s)?\b/.test(raw)) return { value: parsed.value * 1000, invalid: false };
  return parsed;
}

function levenshtein(left: string, right: string): number {
  if (!left.length) return right.length;
  if (!right.length) return left.length;
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let row = 1; row <= left.length; row += 1) {
    let diagonal = previous[0];
    previous[0] = row;
    for (let column = 1; column <= right.length; column += 1) {
      const before = previous[column];
      previous[column] = Math.min(
        previous[column] + 1,
        previous[column - 1] + 1,
        diagonal + (left[row - 1] === right[column - 1] ? 0 : 1),
      );
      diagonal = before;
    }
  }
  return previous[right.length];
}

function similarity(left: unknown, right: unknown): number {
  const a = normalizeText(left);
  const b = normalizeText(right);
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return Math.min(a.length, b.length) / Math.max(a.length, b.length) * 0.92;
  return 1 - levenshtein(a, b) / Math.max(a.length, b.length);
}

function findProductMatch(
  row: Pick<InboundImportRow, 'productCode' | 'productName' | 'workpieceNo' | 'material' | 'process'>,
  products: IProduct[],
): { product?: IProduct; confidence: number; reason: string } {
  const candidates = products.map(product => {
    const combinedIdentity = normalizeText(`${row.productCode}${row.productName}${row.workpieceNo}`);
    const embeddedIdentity = [product.code, product.name, product.workpieceNo]
      .map(normalizeText)
      .filter(Boolean)
      .some(value => combinedIdentity.includes(value));
    const codeScore = Math.max(similarity(row.productCode, product.code), similarity(row.productCode, product.workpieceNo));
    const nameScore = Math.max(
      similarity(row.productName, product.name),
      similarity(row.productName, product.code),
      similarity(row.productName, product.workpieceNo),
    );
    const workpieceScore = Math.max(similarity(row.workpieceNo, product.workpieceNo), similarity(row.workpieceNo, product.code));
    const identityScore = Math.max(codeScore, nameScore, workpieceScore, embeddedIdentity ? 0.97 : 0);
    const contextScores = [similarity(row.material, product.material), similarity(row.process, product.process)].filter(score => score > 0);
    const contextScore = contextScores.length ? contextScores.reduce((sum, score) => sum + score, 0) / contextScores.length : 0;
    return { product, score: Math.min(1, identityScore * 0.9 + contextScore * 0.1), identityScore };
  }).sort((a, b) => b.score - a.score);

  const best = candidates[0];
  const second = candidates[1];
  if (!best || best.identityScore < 0.6) return { confidence: 0, reason: '未找到相似产品' };
  const ambiguous = second && best.score - second.score < 0.06 && second.score > 0.75;
  if (ambiguous) return { product: best.product, confidence: best.score, reason: '有多个相似产品，请确认' };
  if (best.score >= 0.86) return { product: best.product, confidence: best.score, reason: '已智能匹配' };
  return { product: best.product, confidence: best.score, reason: '可能匹配，请确认' };
}

export function validateInboundImportRow(row: InboundImportRow, autoCreateMissing: boolean): string[] {
  const issues: string[] = [...(row.parseIssues || [])];
  if (!row.productName && !row.productCode && !row.workpieceNo) issues.push('缺少产品名称或编号');
  if (!row.matchedProductId && (!autoCreateMissing || !row.productName)) issues.push('请选择已有产品，或填写产品名称后自动新建');
  if (row.matchedProductId && (row.matchConfidence < 0.86 || row.matchReason.includes('多个相似'))) {
    issues.push('产品匹配不够确定，请手动确认');
  }
  if (!Number.isFinite(row.quantity) || row.quantity <= 0) issues.push('入库数量必须大于0');
  if (!Number.isInteger(row.quantity)) issues.push('入库数量必须为整数');
  if (!Number.isFinite(row.weight) || row.weight < 0) issues.push('入库重量不能为负数');
  if (row.unit === 'kg' && row.weight <= 0) issues.push('按重量计价时必须填写重量');
  if (row.unitPrice !== undefined && (!Number.isFinite(row.unitPrice) || row.unitPrice < 0)) issues.push('单价不能为负数');
  return issues;
}

export function revalidateInboundImportRow(row: InboundImportRow, autoCreateMissing: boolean): InboundImportRow {
  const next = { ...row, issues: [] };
  return { ...next, issues: validateInboundImportRow(next, autoCreateMissing) };
}

export function analyzeInboundMatrix(
  matrix: unknown[][],
  products: IProduct[],
  customerCode: string,
  metadata: { fileName?: string; sheetName?: string } = {},
): InboundImportAnalysis {
  if (!matrix.some(row => rowValues(row).length)) throw new Error('清单为空');
  const nonEmptyRowCount = matrix.reduce((count, row) => count + (rowValues(row).length ? 1 : 0), 0);
  if (nonEmptyRowCount > 5_000) {
    throw new Error('清单超过5000行，请按客户或批次拆分后再导入');
  }
  const header = detectHeader(matrix);
  const customerProducts = products.filter(product => product.customerCode === customerCode);
  const mappings: Partial<Record<InboundImportField, string>> = {};
  const rawHeaders = header.index >= 0 ? matrix[header.index] : [];
  header.fields.forEach((field, column) => {
    if (field && !mappings[field]) mappings[field] = String(rawHeaders[column] || `第${column + 1}列`);
  });

  let ignoredRows = 0;
  const rows = matrix.slice(Math.max(0, header.index + 1)).flatMap((rawRow, dataIndex) => {
    if (!rowValues(rawRow).length) {
      ignoredRows += 1;
      return [];
    }
    const values: Partial<Record<InboundImportField, unknown>> = {};
    header.fields.forEach((field, column) => {
      if (field && values[field] === undefined) values[field] = rawRow[column];
    });
    const quantity = parseNumber(values.quantity);
    const weight = parseWeight(values.weight);
    const unitPrice = parseNumber(values.unitPrice);
    const base: InboundImportRow = {
      id: `row-${header.index + dataIndex + 2}`,
      rowNumber: header.index + dataIndex + 2,
      productCode: String(values.productCode ?? '').trim(),
      productName: String(values.productName ?? '').trim(),
      workpieceNo: String(values.workpieceNo ?? '').trim(),
      quantity: quantity.value,
      weight: weight.value,
      unit: normalizeUnit(values.unit),
      unitPrice: values.unitPrice === undefined || String(values.unitPrice).trim() === '' ? undefined : unitPrice.value,
      material: String(values.material ?? '').trim(),
      process: String(values.process ?? '').trim(),
      techRequirement: String(values.techRequirement ?? '').trim(),
      inboundType: String(values.inboundType ?? '').trim() || '正常',
      urgent: /^(1|true|yes|y|是|加急|紧急)$/i.test(String(values.urgent ?? '').trim()) || /加急|紧急/.test(String(values.remark ?? '')),
      remark: String(values.remark ?? '').trim(),
      matchConfidence: 0,
      matchReason: '',
      selected: true,
      issues: [],
    };
    const match = findProductMatch(base, customerProducts);
    base.matchedProductId = match.product?.id;
    base.matchConfidence = match.confidence;
    base.matchReason = match.reason;
    if ((values.unit === undefined || String(values.unit).trim() === '') && match.product?.unit) {
      base.unit = match.product.unit;
    }
    if (base.unitPrice === undefined && match.product) base.unitPrice = match.product.unitPrice;
    base.parseIssues = [];
    if (quantity.invalid) base.parseIssues.push('无法识别数量格式');
    if (weight.invalid) base.parseIssues.push('无法识别重量格式');
    if (unitPrice.invalid) base.parseIssues.push('无法识别单价格式');
    base.issues = validateInboundImportRow(base, true);
    // 问题行仍完整展示，但默认不勾选，避免用户第一次点击“确认”毫无进展。
    base.selected = base.issues.length === 0;
    return [base];
  });
  if (!rows.length) throw new Error('未找到可识别的数据行');
  return {
    fileName: metadata.fileName || '',
    sheetName: metadata.sheetName || '清单',
    headerRowNumber: Math.max(0, header.index + 1),
    mappings,
    rows,
    ignoredRows,
  };
}

function textToMatrix(text: string): unknown[][] {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(line => line.trim());
  if (!lines.length) return [];
  const delimiter = lines.some(line => line.includes('\t')) ? /\t/ : /[,，;]/;
  return lines.map(line => line.split(delimiter).map(value => value.trim().replace(/^"|"$/g, '')));
}

export async function analyzeInboundImportFile(
  file: File,
  products: IProduct[],
  customerCode: string,
): Promise<InboundImportAnalysis> {
  if (file.size <= 0) throw new Error('文件为空');
  if (file.size > 10 * 1024 * 1024) throw new Error('文件不能超过10MB');
  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith('.txt')) {
    return analyzeInboundMatrix(textToMatrix(await file.text()), products, customerCode, { fileName: file.name, sheetName: '文本清单' });
  }
  if (!/\.(xlsx|xls|csv)$/i.test(lowerName)) throw new Error('仅支持 Excel（.xlsx/.xls）、CSV 或 TXT 清单');
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
  const sheetErrors: Error[] = [];
  const analyses = workbook.SheetNames.flatMap(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '', raw: false });
    try {
      return [analyzeInboundMatrix(matrix, products, customerCode, { fileName: file.name, sheetName })];
    } catch (error) {
      if (error instanceof Error) sheetErrors.push(error);
      return [];
    }
  });
  if (!analyses.length) {
    const actionableError = sheetErrors.find(error => error.message.includes('超过5000行'));
    throw actionableError || new Error('所有工作表均未找到可识别的清单数据');
  }
  return analyses.sort((a, b) => {
    const usable = (analysis: InboundImportAnalysis) => analysis.rows.filter(row => row.issues.length === 0).length;
    return usable(b) - usable(a) || b.rows.length - a.rows.length;
  })[0];
}

export function downloadInboundImportTemplate(): void {
  const rows = [
    { 产品编码: 'P001', 产品名称: '齿轮轴', 工件编号: 'M3-Z20', 入库数量: 100, 入库重量: 85.5, 计价单位: '件', 材质: '40Cr', 加工工艺: '调质', 技术要求: '硬度 HRC 28-32', 是否加急: '否', 备注: '' },
    { 产品编码: '', 产品名称: '新产品示例', 工件编号: 'NEW-01', 入库数量: 20, 入库重量: 12.3, 计价单位: 'kg', 材质: '42CrMo', 加工工艺: '淬火', 技术要求: '', 是否加急: '是', 备注: '未建档产品可自动新建' },
  ];
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(rows);
  sheet['!cols'] = [12, 18, 14, 12, 12, 12, 12, 16, 24, 12, 26].map(width => ({ wch: width }));
  XLSX.utils.book_append_sheet(workbook, sheet, '来货清单');
  const instructions = XLSX.utils.aoa_to_sheet([
    ['使用说明'],
    ['1. 至少填写“产品名称/产品编码/工件编号”中的一项，以及入库数量。'],
    ['2. 系统会自动识别常见同义表头、标题行、空白行，并匹配当前客户产品。'],
    ['3. 未匹配且有产品名称的行，可在预览中确认后自动创建为“待完善”产品。'],
    ['4. 按 kg 计价的产品必须同时填写重量；导入前可在预览中修改。'],
  ]);
  instructions['!cols'] = [{ wch: 95 }];
  XLSX.utils.book_append_sheet(workbook, instructions, '填写说明');
  XLSX.writeFile(workbook, '来货登记导入模板.xlsx');
}
