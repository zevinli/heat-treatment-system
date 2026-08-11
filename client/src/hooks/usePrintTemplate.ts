import { useState, useEffect, useCallback } from 'react';
import { tenantScopedStorageKey } from '@/lib/tenant-storage';

// 字段对齐方式
export type FieldAlign = 'left' | 'center' | 'right';

// 打印模板字段配置
export interface ITemplateField {
  id: string;
  name: string;
  label: string;
  width: number;
  align: FieldAlign;
  isRequired: boolean;
  visible: boolean;
}

// 打印模板配置
export interface ITemplateConfig {
  fields: ITemplateField[];
  paperSize: 'a4' | 'a5' | 'custom';
  paperOrientation: 'portrait' | 'landscape';
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  fontSize: number;
  companyName: string;
  showCompanyName: boolean;
  showCreator: boolean;
  showCustomerConfirm: boolean;
}

// 标识卡模板字段定义（与入库单数据对应）
export const PROCESS_CARD_FIELDS: ITemplateField[] = [
  { id: 'seq', name: 'seq', label: '序号', width: 40, align: 'center', isRequired: true, visible: true },
  { id: 'customerCode', name: 'customerCode', label: '客户编码', width: 100, align: 'center', isRequired: true, visible: true },
  { id: 'productName', name: 'productName', label: '产品名称', width: 150, align: 'left', isRequired: true, visible: true },
  { id: 'workpieceNo', name: 'workpieceNo', label: '工件编号', width: 100, align: 'center', isRequired: false, visible: true },
  { id: 'unit', name: 'unit', label: '计价单位', width: 80, align: 'center', isRequired: true, visible: true },
  { id: 'unitPrice', name: 'unitPrice', label: '单价', width: 80, align: 'right', isRequired: false, visible: true },
  { id: 'quantity', name: 'quantity', label: '入库数量(件)', width: 100, align: 'right', isRequired: true, visible: true },
  { id: 'weight', name: 'weight', label: '入库重量(kg)', width: 100, align: 'right', isRequired: false, visible: true },
  { id: 'amount', name: 'amount', label: '入库金额', width: 100, align: 'right', isRequired: false, visible: true },
  { id: 'inboundType', name: 'inboundType', label: '入库类型', width: 100, align: 'center', isRequired: false, visible: true },
  { id: 'process', name: 'process', label: '加工工艺', width: 120, align: 'left', isRequired: false, visible: true },
  { id: 'material', name: 'material', label: '材质', width: 100, align: 'left', isRequired: false, visible: true },
  { id: 'techRequirement', name: 'techRequirement', label: '技术要求', width: 200, align: 'left', isRequired: false, visible: true },
];

// 送货单模板字段定义（与出库单数据对应）
export const DELIVERY_NOTE_FIELDS: ITemplateField[] = [
  { id: 'seq', name: 'seq', label: '序号', width: 40, align: 'center', isRequired: true, visible: true },
  { id: 'customerName', name: 'customerName', label: '客户名称', width: 150, align: 'left', isRequired: true, visible: true },
  { id: 'customerCode', name: 'customerCode', label: '客户编码', width: 100, align: 'center', isRequired: true, visible: true },
  { id: 'productName', name: 'productName', label: '产品名称', width: 150, align: 'left', isRequired: true, visible: true },
  { id: 'workpieceNo', name: 'workpieceNo', label: '工件编号', width: 100, align: 'center', isRequired: false, visible: true },
  { id: 'batchNo', name: 'batchNo', label: '入库批次', width: 100, align: 'center', isRequired: false, visible: true },
  { id: 'unit', name: 'unit', label: '计价单位', width: 80, align: 'center', isRequired: true, visible: true },
  { id: 'unitPrice', name: 'unitPrice', label: '单价', width: 80, align: 'right', isRequired: false, visible: true },
  { id: 'quantity', name: 'quantity', label: '出库数量', width: 80, align: 'right', isRequired: true, visible: true },
  { id: 'weight', name: 'weight', label: '出库重量', width: 80, align: 'right', isRequired: false, visible: true },
  { id: 'amount', name: 'amount', label: '出库金额', width: 100, align: 'right', isRequired: true, visible: true },
  { id: 'process', name: 'process', label: '加工工艺', width: 120, align: 'left', isRequired: false, visible: true },
  { id: 'material', name: 'material', label: '材质', width: 100, align: 'left', isRequired: false, visible: true },
  { id: 'inboundDate', name: 'inboundDate', label: '入库日期', width: 100, align: 'center', isRequired: false, visible: true },
];

// 对账单模板字段定义
export const RECONCILIATION_FIELDS: ITemplateField[] = [
  { id: 'seq', name: 'seq', label: '序号', width: 40, align: 'center', isRequired: true, visible: true },
  { id: 'outboundNo', name: 'outboundNo', label: '出库单号', width: 150, align: 'left', isRequired: true, visible: true },
  { id: 'outboundDate', name: 'outboundDate', label: '出库日期', width: 100, align: 'center', isRequired: true, visible: true },
  { id: 'productName', name: 'productName', label: '产品名称', width: 150, align: 'left', isRequired: true, visible: true },
  { id: 'workpieceNo', name: 'workpieceNo', label: '工件编号', width: 100, align: 'center', isRequired: false, visible: true },
  { id: 'process', name: 'process', label: '加工工艺', width: 120, align: 'left', isRequired: false, visible: true },
  { id: 'material', name: 'material', label: '材质', width: 100, align: 'left', isRequired: false, visible: true },
  { id: 'quantity', name: 'quantity', label: '数量', width: 80, align: 'right', isRequired: true, visible: true },
  { id: 'weight', name: 'weight', label: '重量', width: 80, align: 'right', isRequired: false, visible: true },
  { id: 'unitPrice', name: 'unitPrice', label: '单价', width: 80, align: 'right', isRequired: false, visible: true },
  { id: 'amount', name: 'amount', label: '金额', width: 100, align: 'right', isRequired: true, visible: true },
];

// 默认模板配置
const DEFAULT_PROCESS_CARD_CONFIG: ITemplateConfig = {
  fields: PROCESS_CARD_FIELDS,
  paperSize: 'a5',
  paperOrientation: 'portrait',
  marginTop: 15,
  marginBottom: 15,
  marginLeft: 20,
  marginRight: 20,
  fontSize: 11,
  companyName: '大连文火热处理',
  showCompanyName: true,
  showCreator: true,
  showCustomerConfirm: true,
};

const DEFAULT_DELIVERY_NOTE_CONFIG: ITemplateConfig = {
  fields: DELIVERY_NOTE_FIELDS,
  paperSize: 'a4',
  paperOrientation: 'portrait',
  marginTop: 15,
  marginBottom: 15,
  marginLeft: 20,
  marginRight: 20,
  fontSize: 10,
  companyName: '大连文火热处理',
  showCompanyName: true,
  showCreator: true,
  showCustomerConfirm: true,
};

const DEFAULT_RECONCILIATION_CONFIG: ITemplateConfig = {
  fields: RECONCILIATION_FIELDS,
  paperSize: 'a4',
  paperOrientation: 'portrait',
  marginTop: 15,
  marginBottom: 15,
  marginLeft: 20,
  marginRight: 20,
  fontSize: 10,
  companyName: '大连文火热处理',
  showCompanyName: true,
  showCreator: true,
  showCustomerConfirm: true,
};

// Storage keys
const STORAGE_KEYS = {
  processCard: 'processCard',
  deliveryNote: 'deliveryNote',
  reconciliation: 'reconciliation',
};
const getTemplateStorageKey = () => tenantScopedStorageKey(
  'print_templates',
  typeof window === 'undefined' ? null : localStorage.getItem('currentOrgCode'),
);
const LEGACY_STORAGE_KEYS: Record<string, string> = {
  processCard: 'print_template_process_card',
  deliveryNote: 'print_template_delivery_note',
  reconciliation: 'print_template_reconciliation',
};

// 获取存储的模板配置
const getStoredTemplate = (key: string, defaultConfig: ITemplateConfig): ITemplateConfig => {
  try {
    const registry = localStorage.getItem(getTemplateStorageKey());
    if (registry) {
      const parsed = JSON.parse(registry);
      if (parsed?.[key]) return { ...defaultConfig, ...parsed[key] };
    }
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEYS[key]);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      const migrated = { ...defaultConfig, ...parsed };
      saveTemplateToStorage(key, migrated);
      return migrated;
    }
  } catch {
    // ignore
  }
  return { ...defaultConfig };
};

// 保存模板配置到存储
const saveTemplateToStorage = (key: string, config: ITemplateConfig) => {
  try {
    const storageKey = getTemplateStorageKey();
    const current = JSON.parse(localStorage.getItem(storageKey) || '{}');
    localStorage.setItem(storageKey, JSON.stringify({ ...current, [key]: config }));
  } catch {
    // ignore
  }
};

// Hook for Process Card Template
export const useProcessCardTemplate = () => {
  const [config, setConfig] = useState<ITemplateConfig>(() =>
    getStoredTemplate(STORAGE_KEYS.processCard, DEFAULT_PROCESS_CARD_CONFIG)
  );

  const updateConfig = useCallback((updates: Partial<ITemplateConfig>) => {
    setConfig((prev) => {
      const newConfig = { ...prev, ...updates };
      saveTemplateToStorage(STORAGE_KEYS.processCard, newConfig);
      return newConfig;
    });
  }, []);

  const updateField = useCallback((fieldId: string, updates: Partial<ITemplateField>) => {
    setConfig((prev) => {
      const newFields = prev.fields.map((f) =>
        f.id === fieldId ? { ...f, ...updates } : f
      );
      const newConfig = { ...prev, fields: newFields };
      saveTemplateToStorage(STORAGE_KEYS.processCard, newConfig);
      return newConfig;
    });
  }, []);

  const updateFieldOrder = useCallback((newOrder: ITemplateField[]) => {
    setConfig((prev) => {
      const newConfig = { ...prev, fields: newOrder };
      saveTemplateToStorage(STORAGE_KEYS.processCard, newConfig);
      return newConfig;
    });
  }, []);

  const resetToDefault = useCallback(() => {
    const defaultConfig = { ...DEFAULT_PROCESS_CARD_CONFIG };
    saveTemplateToStorage(STORAGE_KEYS.processCard, defaultConfig);
    setConfig(defaultConfig);
  }, []);

  // 获取可见字段（按顺序）
  const visibleFields = config.fields.filter((f) => f.visible);

  return {
    config,
    visibleFields,
    updateConfig,
    updateField,
    updateFieldOrder,
    resetToDefault,
  };
};

// Hook for Delivery Note Template
export const useDeliveryNoteTemplate = () => {
  const [config, setConfig] = useState<ITemplateConfig>(() =>
    getStoredTemplate(STORAGE_KEYS.deliveryNote, DEFAULT_DELIVERY_NOTE_CONFIG)
  );

  const updateConfig = useCallback((updates: Partial<ITemplateConfig>) => {
    setConfig((prev) => {
      const newConfig = { ...prev, ...updates };
      saveTemplateToStorage(STORAGE_KEYS.deliveryNote, newConfig);
      return newConfig;
    });
  }, []);

  const updateField = useCallback((fieldId: string, updates: Partial<ITemplateField>) => {
    setConfig((prev) => {
      const newFields = prev.fields.map((f) =>
        f.id === fieldId ? { ...f, ...updates } : f
      );
      const newConfig = { ...prev, fields: newFields };
      saveTemplateToStorage(STORAGE_KEYS.deliveryNote, newConfig);
      return newConfig;
    });
  }, []);

  const updateFieldOrder = useCallback((newOrder: ITemplateField[]) => {
    setConfig((prev) => {
      const newConfig = { ...prev, fields: newOrder };
      saveTemplateToStorage(STORAGE_KEYS.deliveryNote, newConfig);
      return newConfig;
    });
  }, []);

  const resetToDefault = useCallback(() => {
    const defaultConfig = { ...DEFAULT_DELIVERY_NOTE_CONFIG };
    saveTemplateToStorage(STORAGE_KEYS.deliveryNote, defaultConfig);
    setConfig(defaultConfig);
  }, []);

  const visibleFields = config.fields.filter((f) => f.visible);

  return {
    config,
    visibleFields,
    updateConfig,
    updateField,
    updateFieldOrder,
    resetToDefault,
  };
};

// Hook for Reconciliation Template
export const useReconciliationTemplate = () => {
  const [config, setConfig] = useState<ITemplateConfig>(() =>
    getStoredTemplate(STORAGE_KEYS.reconciliation, DEFAULT_RECONCILIATION_CONFIG)
  );

  const updateConfig = useCallback((updates: Partial<ITemplateConfig>) => {
    setConfig((prev) => {
      const newConfig = { ...prev, ...updates };
      saveTemplateToStorage(STORAGE_KEYS.reconciliation, newConfig);
      return newConfig;
    });
  }, []);

  const updateField = useCallback((fieldId: string, updates: Partial<ITemplateField>) => {
    setConfig((prev) => {
      const newFields = prev.fields.map((f) =>
        f.id === fieldId ? { ...f, ...updates } : f
      );
      const newConfig = { ...prev, fields: newFields };
      saveTemplateToStorage(STORAGE_KEYS.reconciliation, newConfig);
      return newConfig;
    });
  }, []);

  const updateFieldOrder = useCallback((newOrder: ITemplateField[]) => {
    setConfig((prev) => {
      const newConfig = { ...prev, fields: newOrder };
      saveTemplateToStorage(STORAGE_KEYS.reconciliation, newConfig);
      return newConfig;
    });
  }, []);

  const resetToDefault = useCallback(() => {
    const defaultConfig = { ...DEFAULT_RECONCILIATION_CONFIG };
    saveTemplateToStorage(STORAGE_KEYS.reconciliation, defaultConfig);
    setConfig(defaultConfig);
  }, []);

  const visibleFields = config.fields.filter((f) => f.visible);

  return {
    config,
    visibleFields,
    updateConfig,
    updateField,
    updateFieldOrder,
    resetToDefault,
  };
};

// 获取所有模板配置（用于打印时一次性获取）
export const getAllTemplates = () => {
  return {
    processCard: getStoredTemplate(STORAGE_KEYS.processCard, DEFAULT_PROCESS_CARD_CONFIG),
    deliveryNote: getStoredTemplate(STORAGE_KEYS.deliveryNote, DEFAULT_DELIVERY_NOTE_CONFIG),
    reconciliation: getStoredTemplate(STORAGE_KEYS.reconciliation, DEFAULT_RECONCILIATION_CONFIG),
  };
};

export default {
  useProcessCardTemplate,
  useDeliveryNoteTemplate,
  useReconciliationTemplate,
  getAllTemplates,
  PROCESS_CARD_FIELDS,
  DELIVERY_NOTE_FIELDS,
  RECONCILIATION_FIELDS,
};
