/**
 * 智能Excel导入系统 - 主入口
 * 
 * 功能特性：
 * 1. 智能列识别 - 多维度相似度匹配
 * 2. 数据清洗 - 支持各种数字格式、价格、库存文本
 * 3. 混合字段拆分 - 材质+工艺智能分离
 * 4. 材质标准化 - 模糊匹配标准材质库
 * 5. 数据质量报告 - 全面的数据验证
 */

import * as XLSX from '@e965/xlsx';
import { toast } from 'sonner';
import type {
  ImportPreviewState,
  ColumnMapping,
  NormalizedRow,
  DataQualityReport,
  DataIssue,
  CompositeSplit,
  ParseResult,
  UserEdit,
} from './types';
import { matchColumns, remapColumn } from './columnMatcher';
import { parseValueByField, generateDataIssue } from './dataParsers';
import { splitCompositeField } from './fieldSplitter';
import type { IProduct } from '@/data/mockData';

export * from './types';
export { matchColumns, remapColumn } from './columnMatcher';
export { parseValueByField, parsePrice, parseNumber, parseStock } from './dataParsers';
export { splitCompositeField, fuzzyMatchMaterial, fuzzyMatchProcess } from './fieldSplitter';
export { allMaterialStandards, processStandards } from './materialStandards';

/**
 * 解析Excel文件为原始数据
 */
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
        
        // 使用第一个工作表
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // 转换为JSON
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
          header: 1,
          defval: '',
        });
        
        if (jsonData.length < 2) {
          reject(new Error('Excel文件数据不足，至少需要包含表头和一行数据'));
          return;
        }
        
        // 提取表头和数据
        const headers = (jsonData[0] as unknown as string[]).map(h => String(h).trim());
        const rows = jsonData.slice(1).map((row) => {
          const obj: Record<string, unknown> = {};
          headers.forEach((header, index) => {
            obj[header] = (row as unknown as unknown[])[index];
          });
          return obj;
        });
        
        resolve({
          headers,
          data: rows,
          sheetName: firstSheetName,
        });
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

/**
 * 分析列数据样本
 */
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

/**
 * 标准化Excel数据
 */
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
      
      let value: unknown;
      
      // 如果是从复合字段拆分的
      if (compositeSplit && ['material', 'process', 'techRequirement'].includes(mapping.targetField)) {
        const splitValue = compositeSplit[mapping.targetField as keyof CompositeSplit];
        if (typeof splitValue === 'object' && splitValue !== null && 'value' in splitValue) {
          value = splitValue.value;
          normalizedRow[mapping.targetField] = splitValue as ParseResult;
          
          // 添加拆分警告
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
      value = row[mapping.sourceColumn];
      const parsed = parseValueByField(value, mapping.targetField);
      normalizedRow[mapping.targetField] = parsed;
      
      // 生成数据问题
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

/**
 * 生成数据质量报告
 */
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
  
  // 取最常见的问题
  const topIssues = Array.from(errorTypes.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([key, count]) => {
      const [type, column, ...messageParts] = key.split(':');
      const firstIssue = allIssues.find(i => 
        i.type === type && i.column === column
      );
      return {
        rowIndex: -1, // 聚合问题
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

/**
 * 检查一行是否有任何有效数据
 */
function rowHasAnyData(row: Record<string, unknown>): boolean {
  return Object.values(row).some(val => {
    if (val === undefined || val === null) return false;
    const str = String(val).trim();
    return str !== '' && str !== '0';
  });
}

/**
 * 分析Excel文件并生成预览状态
 */
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
  
  // 如果材质和工艺都映射到同一列，标记为复合字段
  if (materialMapping && processMapping && 
      materialMapping.sourceColumn === processMapping.sourceColumn) {
    // 合并为一个复合字段映射
    columnMappings = columnMappings.filter(
      m => m.targetField !== 'process' // 移除process映射
    );
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

/**
 * 更新列映射
 */
export function updateColumnMapping(
  state: ImportPreviewState,
  sourceColumn: string,
  newTargetField: string
): ImportPreviewState {
  const mappingIndex = state.columnMappings.findIndex(m => m.sourceColumn === sourceColumn);
  if (mappingIndex === -1) return state;
  
  const oldMapping = state.columnMappings[mappingIndex];
  
  // 更新映射配置
  const newMapping: ColumnMapping = {
    ...oldMapping,
    targetField: newTargetField,
    confidence: 1, // 用户手动设置，置信度为1
    suggestion: 'auto' as const,
  };
  
  const newMappings = [...state.columnMappings];
  newMappings[mappingIndex] = newMapping;
  
  // 重新标准化数据 - 但保留用户编辑
  const newNormalizedData: NormalizedRow[] = state.normalizedData.map(row => {
    const newRow: NormalizedRow = {
      ...row,
      [newTargetField]: row[oldMapping.targetField], // 迁移旧字段数据
    };
    
    // 如果旧字段和新字段不同，删除旧字段
    if (oldMapping.targetField !== newTargetField && 
        !oldMapping.targetField.startsWith('composite')) {
      delete (newRow as Record<string, unknown>)[oldMapping.targetField];
    }
    
    // 重新验证该行
    const allIssues: DataIssue[] = [];
    
    // 检查必填字段
    const requiredFields = ['code', 'name', 'customerCode', 'customerName'];
    for (const reqField of requiredFields) {
      const fieldValue = newRow[reqField];
      let value: unknown;
      
      if (typeof fieldValue === 'object' && fieldValue !== null && 'value' in fieldValue) {
        value = (fieldValue as ParseResult).value;
      } else {
        value = fieldValue;
      }
      
      // 优先使用用户编辑值
      const userEdit = newRow._userEdits?.find(e => e.field === reqField);
      if (userEdit) {
        value = userEdit.value;
      }
      
      if (!value || String(value).trim() === '') {
        allIssues.push({
          rowIndex: row._rowIndex,
          column: reqField,
          type: 'error',
          message: `${reqField}不能为空`,
          rawValue: '',
        });
      }
    }
    
    newRow._issues = allIssues;
    
    // 重新计算行质量
    const errors = allIssues.filter(i => i.type === 'error').length;
    const warnings = allIssues.filter(i => i.type === 'warning').length;
    
    if (errors > 0) {
      newRow._quality = 'error';
    } else if (warnings > 0) {
      newRow._quality = 'warning';
    } else {
      newRow._quality = 'valid';
    }
    
    return newRow;
  });
  
  const newQualityReport = generateQualityReport(state.totalRows, newNormalizedData);

  // 保留用户之前的选择状态，但过滤掉已经不存在的行
  const validRowIndices = new Set(newNormalizedData.map(r => r._rowIndex));
  const preservedSelectedRows = state.selectedRows.filter(i => validRowIndices.has(i));
  const preservedForcedRows = state.forcedImportRows.filter(i => validRowIndices.has(i));

  // 自动选中新解析出的非错误行（如果用户之前没有做过选择）
  const autoSelectedRows = preservedSelectedRows.length === 0
    ? newNormalizedData.filter(r => r._quality !== 'error').map(r => r._rowIndex)
    : preservedSelectedRows;

  return {
    ...state,
    columnMappings: newMappings,
    normalizedData: newNormalizedData,
    qualityReport: newQualityReport,
    selectedRows: autoSelectedRows,
    forcedImportRows: preservedForcedRows,
  };
}

/**
 * 检查一行是否有任何有效数据
 */
function hasAnyData(row: NormalizedRow, fields: string[]): boolean {
  return fields.some(field => {
    const value = row[field];
    if (typeof value === 'object' && value !== null && 'value' in value) {
      const val = (value as ParseResult).value;
      return val !== undefined && val !== null && String(val).trim() !== '';
    }
    return value !== undefined && value !== null && String(value).trim() !== '';
  });
}

/**
 * 将标准化数据转换为产品对象
 * 
 * 核心逻辑：
 * 1. 强制导入模式：绕过所有必填验证，允许导入不完整数据
 * 2. 自动过滤：没有任何字段数据的空白行会被自动排除
 * 3. 正常模式：检查必填字段（code, name, customerCode, customerName）
 */
export function convertToProducts(
  state: ImportPreviewState,
  defaultCustomerCode?: string,
  defaultCustomerName?: string
): Partial<IProduct>[] {
  const products: Partial<IProduct>[] = [];
  const allFields = ['code', 'name', 'material', 'process', 'techRequirement', 'workpieceNo', 'unit', 'unitPrice', 'stock', 'warningThreshold', 'customerCode', 'customerName'];

  for (const rowIndex of state.selectedRows) {
    const row = state.normalizedData.find(r => r._rowIndex === rowIndex);
    if (!row) continue;

    // 自动过滤空白行：没有任何字段数据的行
    if (!hasAnyData(row, allFields)) {
      continue;
    }

    const getValue = (field: string): unknown => {
      const result = row[field];
      if (typeof result === 'object' && result !== null && 'value' in result) {
        return (result as ParseResult).value;
      }
      return result;
    };

    // 获取原始值
    let code = String(getValue('code') || '');
    let name = String(getValue('name') || '');
    let customerCode = String(getValue('customerCode') || '');
    let customerName = String(getValue('customerName') || '');

    // 使用默认值填充
    if (!customerCode && defaultCustomerCode) {
      customerCode = defaultCustomerCode;
    }
    if (!customerName && defaultCustomerName) {
      customerName = defaultCustomerName;
    }

    // 判断是否强制导入（有错误但被用户选择）
    const isForcedImport = state.forcedImportRows.includes(row._rowIndex);

    // 强制导入模式：绕过必填验证，允许导入不完整数据
    // 正常模式：检查必填字段
    if (!isForcedImport) {
      // 正常模式：必填字段检查
      const missingFields: string[] = [];
      if (!code.trim()) missingFields.push('产品编码');
      if (!name.trim()) missingFields.push('产品名称');
      if (!customerCode.trim()) missingFields.push('客户编码');
      if (!customerName.trim()) missingFields.push('客户名称');

      if (missingFields.length > 0) {
        // 正常模式下跳过不完整的行
        continue;
      }
    }

    // 构建产品对象（强制导入模式下允许空值）
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

/**
 * 导出数据问题为Excel
 */
export function exportIssuesToExcel(
  state: ImportPreviewState,
  filename: string
): void {
  const issues = state.normalizedData.flatMap(r => 
    r._issues.map(i => ({
      行号: r._rowIndex + 2, // Excel行号从1开始，第1行是表头
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

/**
 * 获取单元格值（优先返回用户编辑的值）
 */
export function getCellValue(
  row: NormalizedRow,
  field: string
): ParseResult {
  // 优先检查用户编辑
  const userEdit = row._userEdits?.find(e => e.field === field);
  if (userEdit) {
    return {
      value: userEdit.value,
      confidence: 1,
      raw: userEdit.value,
    };
  }
  
  // 返回原始解析值
  const result = row[field];
  if (typeof result === 'object' && result !== null && 'value' in result) {
    return result as ParseResult;
  }
  
  return { value: result, confidence: 0.5, raw: result };
}

/**
 * 更新单元格值
 */
export function updateCellValue(
  state: ImportPreviewState,
  rowIndex: number,
  field: string,
  value: unknown
): ImportPreviewState {
  const newData = state.normalizedData.map(row => {
    if (row._rowIndex !== rowIndex) return row;
    
    // 创建新的行数据
    const newRow: NormalizedRow = { ...row };
    
    // 更新或添加用户编辑记录
    const existingEdits = row._userEdits || [];
    const editIndex = existingEdits.findIndex(e => e.field === field);
    
    let newEdits: UserEdit[];
    if (editIndex >= 0) {
      // 更新现有编辑
      newEdits = existingEdits.map((e, i) =>
        i === editIndex
          ? { field, value, editedAt: Date.now() }
          : e
      );
    } else {
      // 添加新编辑
      newEdits = [...existingEdits, { field, value, editedAt: Date.now() }];
    }
    
    newRow._userEdits = newEdits;
    
    // 重新验证该字段
    const parsed = parseValueByField(value, field);
    newRow[field] = parsed;
    
    // 重新计算行质量
    const allIssues: DataIssue[] = [];
    
    // 检查必填字段
    const requiredFields = ['code', 'name', 'customerCode', 'customerName'];
    for (const reqField of requiredFields) {
      const fieldValue = getCellValue(newRow, reqField).value;
      if (!fieldValue || String(fieldValue).trim() === '') {
        allIssues.push({
          rowIndex,
          column: reqField,
          type: 'error',
          message: `${reqField}不能为空`,
          rawValue: '',
        });
      }
    }
    
    // 添加解析产生的问题
    if (parsed.error) {
      allIssues.push({
        rowIndex,
        column: field,
        type: 'error',
        message: parsed.error,
        rawValue: parsed.raw,
      });
    } else if (parsed.warnings) {
      for (const warning of parsed.warnings) {
        allIssues.push({
          rowIndex,
          column: field,
          type: 'warning',
          message: warning,
          rawValue: parsed.raw,
        });
      }
    }
    
    newRow._issues = allIssues;
    
    const errors = allIssues.filter(i => i.type === 'error').length;
    const warnings = allIssues.filter(i => i.type === 'warning').length;
    
    if (errors > 0) {
      newRow._quality = 'error';
    } else if (warnings > 0) {
      newRow._quality = 'warning';
    } else {
      newRow._quality = 'valid';
    }
    
    return newRow;
  });
  
  // 重新生成质量报告
  const newQualityReport = generateQualityReport(state.totalRows, newData);
  
  return {
    ...state,
    normalizedData: newData,
    qualityReport: newQualityReport,
  };
}

/**
 * 切换错误行的强制导入状态
 */
export function toggleForceImport(
  state: ImportPreviewState,
  rowIndex: number
): ImportPreviewState {
  const isForced = state.forcedImportRows.includes(rowIndex);
  const newForcedRows = isForced
    ? state.forcedImportRows.filter(i => i !== rowIndex)
    : [...state.forcedImportRows, rowIndex];
  
  const newSelectedRows = isForced
    ? state.selectedRows.filter(i => i !== rowIndex)
    : [...state.selectedRows, rowIndex];
  
  return {
    ...state,
    forcedImportRows: newForcedRows,
    selectedRows: newSelectedRows,
  };
}
