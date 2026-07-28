/**
 * 智能列匹配引擎
 * 使用多维度相似度算法识别Excel列对应的标准字段
 */
import type { ColumnMapping, FieldAliasConfig, MatchConfidence } from './types';
import { productFieldAliases } from './fieldAliases';

// 计算Levenshtein编辑距离
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
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
    }
  }
  return matrix[b.length][a.length];
}

// 计算文本相似度 (0-1)
function textSimilarity(a: string, b: string): number {
  const aLower = a.toLowerCase().trim();
  const bLower = b.toLowerCase().trim();
  
  if (aLower === bLower) return 1;
  
  const distance = levenshtein(aLower, bLower);
  const maxLength = Math.max(aLower.length, bLower.length);
  return maxLength === 0 ? 1 : 1 - distance / maxLength;
}

// 计算Jaccard相似度
function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(a.split(''));
  const setB = new Set(b.split(''));
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

// 数据模式匹配分数
function calculateDataPatternScore(
  values: unknown[],
  config: FieldAliasConfig
): number {
  if (!config.dataPatterns || config.dataPatterns.length === 0) {
    return 0.5; // 中性分数
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

// 计算综合匹配置信度
function calculateConfidence(
  header: string,
  values: unknown[],
  config: FieldAliasConfig
): MatchConfidence {
  // 1. 精确匹配检查
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
  
  // 2. 名称相似度 (Levenshtein + Jaccard混合)
  let maxNameSim = 0;
  for (const alias of [...config.exact, ...config.fuzzy]) {
    const levSim = textSimilarity(header, alias);
    const jacSim = jaccardSimilarity(header, alias);
    const combinedSim = levSim * 0.7 + jacSim * 0.3;
    maxNameSim = Math.max(maxNameSim, combinedSim);
  }
  
  // 3. 模式匹配 (正则表达式)
  let patternMatchScore = 0;
  for (const pattern of config.patterns) {
    if (pattern.test(header)) {
      patternMatchScore = 1;
      break;
    }
  }
  
  // 名称相似度融合模式匹配
  const nameSimilarity = Math.max(maxNameSim, patternMatchScore * 0.9);
  
  // 4. 语义相似度 (简化版：基于词重叠)
  const headerWords = new Set(header.split(/[^\u4e00-\u9fa5a-zA-Z0-9]+/));
  let maxSemanticSim = 0;
  for (const alias of [...config.exact, ...config.fuzzy]) {
    const aliasWords = new Set(alias.split(/[^\u4e00-\u9fa5a-zA-Z0-9]+/));
    const intersection = new Set([...headerWords].filter(x => aliasWords.has(x)));
    const union = new Set([...headerWords, ...aliasWords]);
    const sim = intersection.size / union.size;
    maxSemanticSim = Math.max(maxSemanticSim, sim);
  }
  
  // 5. 数据模式匹配
  const dataPatternScore = calculateDataPatternScore(values, config);
  
  // 6. 综合置信度 (加权平均)
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

// 判断匹配建议
function getSuggestion(confidence: number): ColumnMapping['suggestion'] {
  if (confidence >= 0.85) return 'auto';
  if (confidence >= 0.6) return 'confirm';
  return 'reject';
}

/**
 * 智能匹配Excel列到标准字段
 * @param headers Excel列头数组
 * @param sampleData 每列的样例数据
 * @returns 列映射结果数组
 */
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
      // 跳过已匹配的字段（一对一映射）
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
      // 未匹配的列
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

/**
 * 重新匹配指定列
 * @param header 列头
 * @param values 列数据
 * @param targetField 目标字段
 * @returns 映射结果
 */
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
