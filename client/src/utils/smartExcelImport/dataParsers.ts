/**
 * 数据清洗与标准化解析器
 * 处理各种格式的数值、价格、库存等数据
 */
import type { ParseResult, DataIssue } from './types';

// 价格解析模式
const pricePatterns = [
  { regex: /[¥￥]\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/, extract: 1 }, // ¥1,234.56
  { regex: /(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*[元块]?/, extract: 1 }, // 1,234.56元
  { regex: /(\d+\.?\d*)\s*[w万]/i, multiplier: 10000 }, // 1.5万
  { regex: /(\d+\.?\d*)\s*[k千]/i, multiplier: 1000 }, // 5k
  { regex: /(\d+\.?\d*)\s*[百]/, multiplier: 100 }, // 3百
  { regex: /^\d+\.?\d*$/, extract: 0 }, // 纯数字
];

// 中文数字映射
const chineseNumbers: Record<string, number> = {
  '零': 0, '一': 1, '二': 2, '三': 3, '四': 4,
  '五': 5, '六': 6, '七': 7, '八': 8, '九': 9,
  '十': 10, '百': 100, '千': 1000, '万': 10000,
  '两': 2, '廿': 20, '卅': 30,
};

// 库存文本映射
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
  ' ': null, // 空格视为空
};

/**
 * 解析中文字符串为数字
 */
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

/**
 * 解析价格
 */
export function parsePrice(value: unknown): ParseResult<number> {
  const raw = value;
  const str = String(value).trim();
  
  if (value === null || value === undefined || str === '') {
    return { value: null, confidence: 0, raw, error: '空值' };
  }
  
  // 检查是否为"面议"、"待定"等无效值
  const invalidKeywords = ['面议', '待定', '询价', '电议', '协商', '—', '-', '/'];
  if (invalidKeywords.some(kw => str.includes(kw))) {
    return { value: null, confidence: 0, raw, error: `无法解析的价格描述: "${str}"`, warnings: ['建议手动输入具体价格'] };
  }
  
  for (const pattern of pricePatterns) {
    const match = str.match(pattern.regex);
    if (match) {
      const captured = match[pattern.extract ?? 0];
      if (captured === undefined) continue;
      let num = parseFloat(captured.replace(/,/g, ''));
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

/**
 * 解析数字（通用）
 */
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

/**
 * 解析库存数量（支持文本描述）
 */
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

/**
 * 解析文本字段
 */
export function parseText(value: unknown, maxLength?: number): ParseResult<string> {
  const raw = value;
  
  if (value === null || value === undefined) {
    return { value: '', confidence: 0.5, raw };
  }
  
  let str = String(value).trim();
  
  // 去除多余空格
  str = str.replace(/\s+/g, ' ');
  
  // 检查长度
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

/**
 * 解析单位
 */
export function parseUnit(value: unknown): ParseResult<string> {
  const raw = value;
  const str = String(value).trim();
  
  if (!str) {
    return { value: '件', confidence: 0.5, raw, warnings: ['未指定单位，默认为"件"'] };
  }
  
  const validUnits = ['件', '个', 'kg', '套', '只', '支', '根', '片', '块', '组', '台', '套', '米', '平方米'];
  
  // 精确匹配
  if (validUnits.includes(str)) {
    return { value: str, confidence: 0.98, raw };
  }
  
  // 模糊匹配
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

/**
 * 解析状态
 */
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
  
  return { value: 'active', confidence: 0.5, raw, warnings: [`无法识别的状态"${str}"，默认为"正常"`] };
}

/**
 * 根据字段类型选择解析器
 */
export function parseValueByField(
  value: unknown,
  field: string
): ParseResult {
  switch (field) {
    case 'unitPrice':
      return parsePrice(value);
    case 'stock':
      return parseStock(value);
    case 'warningThreshold':
      const num = parseNumber(value);
      return num.value !== null ? num : { value: 50, confidence: 0.5, raw: value, warnings: ['默认阈值50'] };
    case 'unit':
      return parseUnit(value);
    case 'status':
      return parseStatus(value);
    case 'code':
    case 'name':
    case 'material':
    case 'process':
    case 'techRequirement':
    case 'workpieceNo':
    case 'customerCode':
    case 'customerName':
      return parseText(value, field === 'code' ? 50 : 255);
    default:
      return parseText(value);
  }
}

/**
 * 生成数据质量问题
 */
export function generateDataIssue(
  rowIndex: number,
  column: string,
  parseResult: ParseResult
): DataIssue | null {
  if (!parseResult.error && (!parseResult.warnings || parseResult.warnings.length === 0)) {
    return null;
  }
  
  const issue: DataIssue = {
    rowIndex,
    column,
    type: parseResult.error ? 'error' : 'warning',
    message: parseResult.error || parseResult.warnings?.[0] || '数据异常',
    rawValue: parseResult.raw,
  };
  
  if (parseResult.warnings && parseResult.warnings.length > 1) {
    issue.suggestion = parseResult.warnings.slice(1).join('; ');
  }
  
  return issue;
}
