export interface ParsedVoiceFields {
  productName?: string;
  quantity?: number;
  weight?: number;
  unit?: '件' | 'kg';
  unitPrice?: number;
  material?: string;
  process?: string;
  customerName?: string;
  remark?: string;
}

const CHINESE_DIGITS: Record<string, number> = {
  零: 0, 〇: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4,
  五: 5, 六: 6, 七: 7, 八: 8, 九: 9,
};
const CHINESE_UNITS: Record<string, number> = { 十: 10, 百: 100, 千: 1000, 万: 10000 };
const NUMBER_SOURCE = '[零〇一二两三四五六七八九十百千万点0-9.]+';

export function parseSpokenNumber(value: unknown): number | undefined {
  const raw = String(value ?? '').trim();
  if (!raw) return undefined;
  if (/^-?\d+(?:\.\d+)?$/.test(raw)) {
    const numeric = Number(raw);
    return Number.isFinite(numeric) ? numeric : undefined;
  }
  const normalized = raw.replace(/两/g, '二').replace(/〇/g, '零');
  const [integerPart, decimalPart] = normalized.split('点');
  let total = 0;
  let section = 0;
  let digit = 0;
  for (const char of integerPart) {
    if (char in CHINESE_DIGITS) {
      digit = CHINESE_DIGITS[char];
      continue;
    }
    const unit = CHINESE_UNITS[char];
    if (!unit) return undefined;
    if (unit === 10000) {
      total += (section + digit) * unit;
      section = 0;
      digit = 0;
    } else {
      section += (digit || 1) * unit;
      digit = 0;
    }
  }
  let result = total + section + digit;
  if (decimalPart) {
    const digits = [...decimalPart].map(char => CHINESE_DIGITS[char]);
    if (digits.some(value => value === undefined)) return undefined;
    result += Number(`0.${digits.join('')}`);
  }
  return Number.isFinite(result) ? result : undefined;
}

export function normalizeBillingUnit(value: unknown): '件' | 'kg' | undefined {
  const unit = String(value ?? '').trim().toLowerCase();
  if (!unit) return undefined;
  if (/^(kg|kgs|公斤|千克|公斤计价|按重量)$/.test(unit)) return 'kg';
  if (/^(件|个|只|套|支|pcs?|piece|pieces|按件)$/.test(unit)) return '件';
  return undefined;
}

function cleanCapturedText(value?: string): string | undefined {
  const cleaned = value?.trim().replace(/^(?:是|为|叫|名称是)/, '').replace(/[，,。；;].*$/, '').trim();
  return cleaned && !/^(?:null|未识别|无法识别)$/i.test(cleaned) ? cleaned : undefined;
}

export function normalizeVoiceFields(value: Record<string, unknown>): ParsedVoiceFields {
  const quantity = parseSpokenNumber(value.quantity);
  const weight = parseSpokenNumber(value.weight);
  const unitPrice = parseSpokenNumber(value.unitPrice);
  return {
    productName: cleanCapturedText(String(value.productName ?? '')),
    quantity: quantity !== undefined && Number.isInteger(quantity) && quantity > 0 ? quantity : undefined,
    weight: weight !== undefined && weight >= 0 ? weight : undefined,
    unit: normalizeBillingUnit(value.unit),
    unitPrice: unitPrice !== undefined && unitPrice >= 0 ? unitPrice : undefined,
    material: cleanCapturedText(String(value.material ?? '')),
    process: cleanCapturedText(String(value.process ?? '')),
    customerName: cleanCapturedText(String(value.customerName ?? '')),
    remark: cleanCapturedText(String(value.remark ?? '')),
  };
}

export function parseVoiceLocally(input: string): ParsedVoiceFields {
  const text = input.trim().replace(/\s+/g, ' ');
  const quantityMatch = new RegExp(`(${NUMBER_SOURCE})\\s*(个|件|只|套|支|pcs?)`, 'i').exec(text);
  const weightMatch = new RegExp(`(${NUMBER_SOURCE})\\s*(公斤|千克|kg|kgs|吨)`, 'i').exec(text);
  const priceMatch = new RegExp(`单价(?:是|为)?\\s*(${NUMBER_SOURCE})\\s*元?`, 'i').exec(text)
    || new RegExp(`(${NUMBER_SOURCE})\\s*元(?:一|每)(件|个|只|套|支|公斤|千克|kg)`, 'i').exec(text);
  const explicitUnit = /计价单位(?:是|为)?\s*(件|个|只|套|支|公斤|千克|kg)/i.exec(text)?.[1];

  const quantity = parseSpokenNumber(quantityMatch?.[1]);
  let weight = parseSpokenNumber(weightMatch?.[1]);
  if (weight !== undefined && weightMatch?.[2] === '吨') weight *= 1000;
  const unit = normalizeBillingUnit(explicitUnit || priceMatch?.[2] || quantityMatch?.[2]);
  const unitPrice = parseSpokenNumber(priceMatch?.[1]);

  let productName: string | undefined;
  if (quantityMatch?.index !== undefined) {
    productName = text.slice(0, quantityMatch.index)
      .replace(/^.*?(?:入库|来货|收货|收到|登记|录入)/, '')
      .replace(/^(?:产品|工件)(?:名称)?(?:是|为|叫)?/, '')
      .replace(/[，,。；;].*$/, '')
      .trim();
  }
  if (!productName) {
    productName = /(?:入库|来货|收货|收到|登记|录入)(?:产品|工件)?(?:名称)?(?:是|为|叫)?([^，,。；;]+?)(?=单价|重量|材质|工艺|计价单位|$)/.exec(text)?.[1]?.trim();
  }

  const material = /材质(?:是|为)?\s*([^，,。；;]+)/.exec(text)?.[1]?.trim();
  const knownProcess = /(调质\+高频淬火|渗碳淬火|氮化处理|调质|淬火|回火|正火|退火|高频淬火)/.exec(text)?.[1];
  const describedProcess = /(?:工艺(?:是|为)?\s*|进行)([^，,。；;]{1,16}?)(?:处理|$)/.exec(text)?.[1]?.trim();
  const remarks = ['加急', '返工', '退货'].filter(flag => text.includes(flag));

  return normalizeVoiceFields({
    productName,
    quantity,
    weight,
    unit,
    unitPrice,
    material,
    process: knownProcess || describedProcess,
    remark: remarks.join('、') || undefined,
  });
}

export function isVoiceResultComplete(data: ParsedVoiceFields): boolean {
  return Boolean(data.productName && data.quantity && data.unit && data.unitPrice !== undefined
    && (data.unit !== 'kg' || (data.weight || 0) > 0));
}
