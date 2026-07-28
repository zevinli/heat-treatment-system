/**
 * 混合字段拆分器 - 处理材质+工艺+要求混合的情况
 */
import type { CompositeSplit, ParseResult } from './types';
import { compositeFieldPatterns } from './fieldAliases';
import { allMaterialStandards, processStandards } from './materialStandards';
import { parseText } from './dataParsers';

// 计算字符串相似度
function similarity(a: string, b: string): number {
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();
  
  if (aLower === bLower) return 1;
  
  // 包含关系
  if (aLower.includes(bLower) || bLower.includes(aLower)) {
    return 0.8;
  }
  
  // 编辑距离简化计算
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  
  let common = 0;
  for (const char of aLower) {
    if (bLower.includes(char)) common++;
  }
  
  return common / maxLen;
}

/**
 * 使用键值对模式提取
 */
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

/**
 * 按分隔符拆分
 */
function splitByDelimiters(text: string): string[] {
  const delimiters = compositeFieldPatterns.delimiters;
  const regex = new RegExp(`[${delimiters.map(d => d.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')).join('')}]`, 'g');
  return text.split(regex).map(s => s.trim()).filter(Boolean);
}

/**
 * 判断片段类型
 */
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

/**
 * 材质模糊匹配 - 返回最佳匹配的标准材质
 */
export function fuzzyMatchMaterial(input: string): {
  standard: string;
  confidence: number;
  matchedBy: 'exact' | 'contains' | 'fuzzy' | 'none';
  original: string;
} {
  const normalized = input.toUpperCase().replace(/\s/g, '');
  
  // 1. 精确匹配
  for (const material of allMaterialStandards) {
    for (const alias of material.aliases) {
      if (normalized === alias.toUpperCase().replace(/\s/g, '')) {
        return {
          standard: material.standard,
          confidence: 1.0,
          matchedBy: 'exact',
          original: input,
        };
      }
    }
  }
  
  // 2. 包含匹配
  for (const material of allMaterialStandards) {
    for (const alias of material.aliases) {
      const aliasNorm = alias.toUpperCase().replace(/\s/g, '');
      if (normalized.includes(aliasNorm) || aliasNorm.includes(normalized)) {
        return {
          standard: material.standard,
          confidence: 0.85,
          matchedBy: 'contains',
          original: input,
        };
      }
    }
  }
  
  // 3. 模糊匹配（编辑距离）
  let bestMatch: { standard: string; distance: number; alias: string } | null = null;
  
  for (const material of allMaterialStandards) {
    for (const alias of material.aliases) {
      const aliasNorm = alias.toUpperCase().replace(/\s/g, '');
      
      // 简单编辑距离计算
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
    return {
      standard: bestMatch.standard,
      confidence: Math.max(0.5, confidence),
      matchedBy: 'fuzzy',
      original: input,
    };
  }
  
  // 未匹配到标准材质，但可能包含材质信息
  return {
    standard: input,
    confidence: 0.3,
    matchedBy: 'none',
    original: input,
  };
}

/**
 * 工艺模糊匹配
 */
export function fuzzyMatchProcess(input: string): {
  standard: string;
  confidence: number;
  matchedBy: 'exact' | 'contains' | 'fuzzy' | 'none';
  original: string;
} {
  const normalized = input.toLowerCase().replace(/\s/g, '');
  
  // 1. 精确匹配
  for (const process of processStandards) {
    for (const alias of process.aliases) {
      if (normalized === alias.toLowerCase().replace(/\s/g, '')) {
        return {
          standard: process.standard,
          confidence: 1.0,
          matchedBy: 'exact',
          original: input,
        };
      }
    }
  }
  
  // 2. 包含匹配
  for (const process of processStandards) {
    for (const alias of process.aliases) {
      const aliasNorm = alias.toLowerCase().replace(/\s/g, '');
      if (normalized.includes(aliasNorm) || aliasNorm.includes(normalized)) {
        return {
          standard: process.standard,
          confidence: 0.85,
          matchedBy: 'contains',
          original: input,
        };
      }
    }
  }
  
  // 3. 组合工艺处理（如"淬火+回火"）
  const comboDelimiters = /[+加\/&]/;
  if (comboDelimiters.test(input)) {
    const parts = input.split(comboDelimiters).map(s => s.trim()).filter(Boolean);
    const matchedParts = parts.map(p => fuzzyMatchProcess(p)).filter(r => r.confidence > 0.5);
    
    if (matchedParts.length > 0) {
      const combined = matchedParts.map(p => p.standard).join('+');
      const avgConfidence = matchedParts.reduce((sum, p) => sum + p.confidence, 0) / matchedParts.length;
      return {
        standard: combined,
        confidence: avgConfidence * 0.9, // 组合稍微降低置信度
        matchedBy: 'contains',
        original: input,
      };
    }
  }
  
  return {
    standard: input,
    confidence: 0.3,
    matchedBy: 'none',
    original: input,
  };
}

/**
 * 拆分混合字段
 */
export function splitCompositeField(text: string): CompositeSplit {
  const original = text.trim();
  
  if (!original) {
    return {
      original,
      confidence: 0,
    };
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
  
  // 2. 按分隔符拆分
  const fragments = splitByDelimiters(original);
  
  if (fragments.length === 0) {
    return { original, confidence: 0 };
  }
  
  // 3. 分类每个片段
  const classified = fragments.map(f => ({
    fragment: f,
    ...classifyFragment(f),
  }));
  
  // 4. 提取材质
  const materialFragments = classified.filter(c => c.type === 'material');
  let materialResult: ParseResult<string> | undefined;
  
  if (materialFragments.length > 0) {
    const bestMaterial = materialFragments.sort((a, b) => b.confidence - a.confidence)[0];
    const matched = fuzzyMatchMaterial(bestMaterial.fragment);
    materialResult = {
      value: matched.standard,
      confidence: matched.confidence,
      raw: bestMaterial.fragment,
      warnings: matched.matchedBy === 'none' ? [`未识别材质"${bestMaterial.fragment}"`] : undefined,
    };
  }
  
  // 5. 提取工艺
  const processFragments = classified.filter(c => c.type === 'process');
  let processResult: ParseResult<string> | undefined;
  
  if (processFragments.length > 0) {
    const processTexts = processFragments.map(p => p.fragment);
    const combined = processTexts.join('+');
    const matched = fuzzyMatchProcess(combined);
    processResult = {
      value: matched.standard,
      confidence: matched.confidence,
      raw: combined,
      warnings: matched.matchedBy === 'none' ? [`未识别工艺"${combined}"`] : undefined,
    };
  }
  
  // 6. 提取技术要求
  const requirementFragments = classified.filter(c => c.type === 'requirement');
  let requirementResult: ParseResult<string> | undefined;
  
  if (requirementFragments.length > 0) {
    const combined = requirementFragments.map(r => r.fragment).join('，');
    requirementResult = parseText(combined) as ParseResult<string>;
    requirementResult.confidence = 0.7;
  }
  
  // 7. 处理未知片段
  const unknownFragments = classified.filter(c => c.type === 'unknown');
  if (unknownFragments.length > 0 && !materialResult && !processResult) {
    // 如果全部未识别，可能是一个整体的材质或工艺描述
    const combined = unknownFragments.map(u => u.fragment).join(' ');
    const materialTry = fuzzyMatchMaterial(combined);
    
    if (materialTry.confidence > 0.5) {
      materialResult = {
        value: materialTry.standard,
        confidence: materialTry.confidence,
        raw: combined,
      };
    } else {
      const processTry = fuzzyMatchProcess(combined);
      if (processTry.confidence > 0.5) {
        processResult = {
          value: processTry.standard,
          confidence: processTry.confidence,
          raw: combined,
        };
      }
    }
  }
  
  // 计算整体置信度
  const confidenceParts = [
    materialResult?.confidence || 0,
    processResult?.confidence || 0,
    requirementResult?.confidence || 0,
  ].filter(c => c > 0);
  
  const overallConfidence = confidenceParts.length > 0
    ? confidenceParts.reduce((a, b) => a + b, 0) / confidenceParts.length
    : 0.2;
  
  return {
    material: materialResult,
    process: processResult,
    techRequirement: requirementResult,
    original,
    confidence: Math.round(overallConfidence * 100) / 100,
  };
}

/**
 * 检测是否为复合字段（材质+工艺混合）
 */
export function isCompositeField(text: string): boolean {
  const composite = splitCompositeField(text);
  
  // 如果成功拆分出多个有效字段，认为是复合字段
  const hasMultiple = 
    (composite.material?.value ? 1 : 0) +
    (composite.process?.value ? 1 : 0) +
    (composite.techRequirement?.value ? 1 : 0) >= 2;
  
  return hasMultiple && composite.confidence > 0.5;
}
