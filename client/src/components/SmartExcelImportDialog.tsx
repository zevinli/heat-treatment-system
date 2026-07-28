/**
 * 智能Excel导入预览对话框
 * Phase 1: 支持单元格级编辑
 */
import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  X,
  Download,
  ChevronDown,
  ChevronUp,
  Loader2,
  Settings2,
  Info,
  Edit2,
  Check,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type {
  ImportPreviewState,
  ColumnMapping,
  NormalizedRow,
  DataIssue,
} from '@/utils/smartExcelImport';
import {
  analyzeExcelFile,
  updateColumnMapping,
  convertToProducts,
  exportIssuesToExcel,
  updateCellValue,
  getCellValue,
  toggleForceImport,
} from '@/utils/smartExcelImport';
import { productFieldAliases } from '@/utils/smartExcelImport/fieldAliases';
import type { IProduct } from '@/data/mockData';
import { getCustomers } from '@/api';

interface SmartExcelImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (products: Partial<IProduct>[]) => void;
  defaultCustomerCode?: string;
  defaultCustomerName?: string;
}

// 字段标签映射
const FIELD_LABELS: Record<string, string> = {
  code: '产品编码',
  name: '产品名称',
  material: '材质',
  process: '工艺',
  techRequirement: '技术要求',
  workpieceNo: '工件号',
  unit: '单位',
  unitPrice: '单价',
  customerCode: '客户编码',
  customerName: '客户名称',
  stock: '库存',
  warningThreshold: '预警阈值',
};

// 文件上传区域
const UploadArea: React.FC<{
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}> = ({ onFileSelect, isLoading }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      onFileSelect(file);
    } else {
      toast.error('请上传Excel文件(.xlsx或.xls)');
    }
  }, [onFileSelect]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div
      className={cn(
        'border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer',
        isDragOver ? 'border-primary bg-primary/5' : 'border-border',
        'hover:border-primary/50 hover:bg-muted/50'
      )}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleChange}
        className="hidden"
      />
      {isLoading ? (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-muted-foreground">正在解析文件...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <Upload className="w-10 h-10 text-muted-foreground" />
          <p className="font-medium">点击或拖拽上传Excel文件</p>
          <p className="text-sm text-muted-foreground">支持 .xlsx 和 .xls 格式</p>
        </div>
      )}
    </div>
  );
};

// 置信度徽章
const getConfidenceBadge = (confidence: number, suggestion: ColumnMapping['suggestion']) => {
  if (suggestion === 'auto') {
    return <Badge variant="default" className="text-xs">自动匹配</Badge>;
  }
  if (confidence >= 0.8) {
    return <Badge variant="secondary" className="text-xs">高置信度</Badge>;
  }
  if (confidence >= 0.5) {
    return <Badge variant="outline" className="text-xs">建议确认</Badge>;
  }
  return <Badge variant="destructive" className="text-xs">需手动配置</Badge>;
};

// 可用的目标字段列表
const SKIP_FIELD_VALUE = '__skip__';

const AVAILABLE_FIELDS = [
  { value: SKIP_FIELD_VALUE, label: '不导入', required: false },
  { value: 'code', label: '产品编码', required: true },
  { value: 'name', label: '产品名称', required: true },
  { value: 'material', label: '材质', required: false },
  { value: 'process', label: '工艺', required: false },
  { value: 'techRequirement', label: '技术要求', required: false },
  { value: 'workpieceNo', label: '工件号', required: false },
  { value: 'unit', label: '单位', required: false },
  { value: 'unitPrice', label: '单价', required: false },
  { value: 'customerCode', label: '客户编码', required: true },
  { value: 'customerName', label: '客户名称', required: true },
  { value: 'stock', label: '库存', required: false },
  { value: 'warningThreshold', label: '预警阈值', required: false },
];

// 获取映射状态
const getMappingStatus = (mapping: ColumnMapping): {
  type: 'matched' | 'confirm' | 'unmapped';
  label: string;
  icon: React.ReactNode;
  color: string;
} => {
  if (!mapping.targetField) {
    return {
      type: 'unmapped',
      label: '未识别',
      icon: <HelpCircle className="w-4 h-4" />,
      color: 'text-muted-foreground',
    };
  }
  if (mapping.confidence >= 0.8) {
    return {
      type: 'matched',
      label: '已匹配',
      icon: <CheckCircle2 className="w-4 h-4" />,
      color: 'text-success',
    };
  }
  return {
    type: 'confirm',
    label: '需确认',
    icon: <AlertTriangle className="w-4 h-4" />,
    color: 'text-warning',
  };
};

// 列映射配置 - 新版三栏布局
const ColumnMappingConfig: React.FC<{
  mappings: ColumnMapping[];
  onMappingChange: (sourceColumn: string, targetField: string) => void;
  onBatchMapping?: (columns: string[], targetField: string) => void;
}> = ({ mappings, onMappingChange, onBatchMapping }) => {
  const [expanded, setExpanded] = useState(true);
  const [batchTargetField, setBatchTargetField] = useState('');

  // 统计映射情况
  const stats = useMemo(() => {
    const matched = mappings.filter(m => m.confidence >= 0.8 && m.targetField).length;
    const confirm = mappings.filter(m => m.targetField && m.confidence < 0.8).length;
    const unmapped = mappings.filter(m => !m.targetField).length;
    return { matched, confirm, unmapped, total: mappings.length };
  }, [mappings]);

  // 获取未识别的列
  const unmappedColumns = useMemo(() => {
    return mappings.filter(m => !m.targetField).map(m => m.sourceColumn);
  }, [mappings]);

  // 处理批量映射
  const handleBatchMapping = () => {
    if (!batchTargetField || unmappedColumns.length === 0) return;
    onBatchMapping?.(unmappedColumns, batchTargetField);
    setBatchTargetField('');
    toast.success(`已将 ${unmappedColumns.length} 个未识别列映射为"${AVAILABLE_FIELDS.find(f => f.value === batchTargetField)?.label}"`);
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4" />
            列映射配置
            <span className="text-xs font-normal">
              <span className="text-success">已匹配 {stats.matched}</span>
              {stats.confirm > 0 && <span className="text-warning ml-2">需确认 {stats.confirm}</span>}
              {stats.unmapped > 0 && <span className="text-muted-foreground ml-2">未识别 {stats.unmapped}</span>}
            </span>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </CardTitle>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0">
          {/* 批量操作栏 */}
          {unmappedColumns.length > 0 && (
            <div className="mb-4 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  批量映射 {unmappedColumns.length} 个未识别列：
                </span>
                <Select value={batchTargetField} onValueChange={setBatchTargetField}>
                  <SelectTrigger className="w-40 h-8">
                    <SelectValue placeholder="选择目标字段" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_FIELDS.filter(f => f.value !== SKIP_FIELD_VALUE).map(field => (
                      <SelectItem key={field.value} value={field.value}>
                        {field.label} {field.required && '*'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!batchTargetField}
                  onClick={handleBatchMapping}
                >
                  应用
                </Button>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                提示：可将多个Excel列批量映射为同一个目标字段（如多个"备注"列都映射为"技术要求"）
              </div>
            </div>
          )}

          {/* 三栏映射表头 */}
          <div className="grid grid-cols-[1fr_80px_1fr] gap-3 px-3 py-2 text-xs font-medium text-muted-foreground border-b">
            <div>📄 Excel 源列</div>
            <div className="text-center">状态</div>
            <div>🎯 系统目标字段</div>
          </div>

          {/* 映射列表 */}
          <div className="max-h-64 overflow-auto space-y-1 mt-1">
            {mappings.map((mapping) => {
              const status = getMappingStatus(mapping);
              const targetFieldInfo = AVAILABLE_FIELDS.find(f => f.value === mapping.targetField);

              return (
                <div
                  key={mapping.sourceColumn}
                  className={cn(
                    'grid grid-cols-[1fr_80px_1fr] gap-3 p-2 rounded items-center',
                    status.type === 'matched' && 'bg-success/5',
                    status.type === 'confirm' && 'bg-warning/5',
                    status.type === 'unmapped' && 'bg-muted/30'
                  )}
                >
                  {/* 源列信息 */}
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate" title={mapping.sourceHeader}>
                      {mapping.sourceHeader}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <span className="truncate">
                        样例: {mapping.sampleValues.slice(0, 2).join(', ')}
                      </span>
                      {mapping.sampleValues.length > 2 && (
                        <span className="text-[10px] bg-muted px-1 rounded">
                          +{mapping.sampleValues.length - 2}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 状态 */}
                  <div className={cn('flex flex-col items-center justify-center', status.color)}>
                    {status.icon}
                    <span className="text-[10px] mt-0.5">{status.label}</span>
                  </div>

                  {/* 目标字段选择 */}
                  <Select
                    value={mapping.targetField}
                    onValueChange={(value) => onMappingChange(mapping.sourceColumn, value)}
                  >
                    <SelectTrigger
                      className={cn(
                        'w-full h-8 text-sm',
                        !mapping.targetField && 'border-warning text-warning'
                      )}
                    >
                      <SelectValue placeholder="选择字段...">
                        {targetFieldInfo ? (
                          <span className="flex items-center gap-1">
                            {targetFieldInfo.label}
                            {targetFieldInfo.required && <span className="text-error">*</span>}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">选择字段...</span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SKIP_FIELD_VALUE}>
                        <span className="text-muted-foreground">不导入此列</span>
                      </SelectItem>
                      {AVAILABLE_FIELDS.filter(f => f.value !== SKIP_FIELD_VALUE).map(field => (
                        <SelectItem key={field.value} value={field.value}>
                          <span className="flex items-center justify-between w-full">
                            <span>{field.label}</span>
                            {field.required && <span className="text-error text-xs">*必填</span>}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>

          {/* 底部统计 */}
          <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-success" />
                已匹配: {stats.matched}
              </span>
              <span className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-warning" />
                需确认: {stats.confirm}
              </span>
              <span className="flex items-center gap-1">
                <HelpCircle className="w-3 h-3 text-muted-foreground" />
                未识别: {stats.unmapped}
              </span>
            </div>
            <div className="text-muted-foreground">
              共 {stats.total} 列
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

// 数据质量概览
const QualityOverview: React.FC<{
  report: ImportPreviewState['qualityReport'];
  onDownloadIssues: () => void;
  missingCustomerCount?: number;
}> = ({ report, onDownloadIssues, missingCustomerCount }) => {
  const hasIssues = report.errorRows > 0 || report.warningRows > 0;

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Info className="w-4 h-4" />
          数据质量概览
          {missingCustomerCount && missingCustomerCount > 0 && (
            <Badge variant="outline" className="text-xs">
              {missingCustomerCount}行待完善
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm">整体质量</span>
              <span className="text-sm font-medium">{Math.round(report.overall * 100)}%</span>
            </div>
            <Progress value={report.overall * 100} className="h-2" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2 rounded bg-muted">
            <div className="text-lg font-semibold">{report.totalRows}</div>
            <div className="text-xs text-muted-foreground">总行数</div>
          </div>
          <div className="p-2 rounded bg-success/10">
            <div className="text-lg font-semibold text-success">{report.validRows}</div>
            <div className="text-xs text-muted-foreground">正常</div>
          </div>
          <div className="p-2 rounded bg-warning/10">
            <div className="text-lg font-semibold text-warning">{report.warningRows}</div>
            <div className="text-xs text-muted-foreground">警告</div>
          </div>
          <div className="p-2 rounded bg-error/10">
            <div className="text-lg font-semibold text-error">{report.errorRows}</div>
            <div className="text-xs text-muted-foreground">错误</div>
          </div>
        </div>
        {hasIssues && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-3"
            onClick={onDownloadIssues}
          >
            <Download className="w-4 h-4 mr-2" />
            下载问题数据报告
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

// 全局客户选择器 - 用于批量设置默认客户
const GlobalCustomerSelector: React.FC<{
  onSelect: (customer: { code: string; name: string }) => void;
  selectedCustomer?: { code: string; name: string } | null;
}> = ({ onSelect, selectedCustomer }) => {
  const [searchValue, setSearchValue] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 搜索客户
  const searchCustomers = useCallback(async (keyword: string) => {
    if (!keyword.trim()) {
      setSuggestions([]);
      return;
    }
    setIsLoading(true);
    try {
      const response = await getCustomers({ search: keyword, pageSize: 10 });
      setSuggestions(response.items.map(c => ({ id: c.id, name: c.name, code: c.code })));
    } catch {
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isOpen) {
        searchCustomers(searchValue);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue, isOpen, searchCustomers]);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (customer: { name: string; code: string }) => {
    onSelect(customer);
    setIsOpen(false);
    setSearchValue('');
  };

  if (selectedCustomer) {
    return (
      <div className="flex items-center gap-2 p-2 bg-success/10 rounded border border-success/20">
        <CheckCircle2 className="w-4 h-4 text-success" />
        <span className="text-sm">默认客户: {selectedCustomer.name}</span>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 px-2"
          onClick={() => onSelect({ code: '', name: '' })}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2">
        <Input
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="搜索并选择默认客户..."
          className="h-8"
        />
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      </div>
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-popover border rounded-md shadow-lg max-h-48 overflow-auto">
          {suggestions.length > 0 ? (
            suggestions.map(customer => (
              <div
                key={customer.id}
                className="px-3 py-2 hover:bg-muted cursor-pointer"
                onClick={() => handleSelect(customer)}
              >
                <div className="font-medium">{customer.name}</div>
                <div className="text-xs text-muted-foreground">{customer.code}</div>
              </div>
            ))
          ) : searchValue ? (
            <div className="p-3 text-sm text-muted-foreground text-center">
              未找到匹配客户
            </div>
          ) : (
            <div className="p-3 text-sm text-muted-foreground text-center">
              输入客户名称搜索
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// 客户联想输入组件
const CustomerSelectCell: React.FC<{
  value: unknown;
  row: NormalizedRow;
  onEdit: (rowIndex: number, field: string, value: unknown) => void;
}> = ({ value, row, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [searchValue, setSearchValue] = useState(String(value || ''));
  const [suggestions, setSuggestions] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 获取字段相关的issue
  const issues = row._issues?.filter(i => i.column === 'customerName') || [];
  const hasError = issues.some(i => i.type === 'error');
  const wasEdited = row._userEdits?.some(e => e.field === 'customerName');

  // 搜索客户
  const searchCustomers = useCallback(async (keyword: string) => {
    if (!keyword.trim()) {
      setSuggestions([]);
      return;
    }
    setIsLoading(true);
    try {
      const response = await getCustomers({ search: keyword, pageSize: 10 });
      setSuggestions(response.items.map(c => ({ id: c.id, name: c.name, code: c.code })));
    } catch {
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isEditing) {
        searchCustomers(searchValue);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue, isEditing, searchCustomers]);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsEditing(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (customer: { name: string; code: string }) => {
    onEdit(row._rowIndex, 'customerName', customer.name);
    onEdit(row._rowIndex, 'customerCode', customer.code);
    setIsEditing(false);
  };

  const handleSave = () => {
    onEdit(row._rowIndex, 'customerName', searchValue.trim());
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div ref={containerRef} className="relative">
        <div className="flex items-center gap-1">
          <Input
            ref={inputRef}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') setIsEditing(false);
            }}
            className="h-7 min-w-24 text-xs py-0 px-2"
            autoFocus
            placeholder="搜索客户..."
          />
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={handleSave}
          >
            <Check className="w-3 h-3 text-success" />
          </Button>
        </div>
        {suggestions.length > 0 && (
          <div className="absolute z-50 mt-1 w-full bg-popover border rounded-md shadow-lg max-h-32 overflow-auto">
            {suggestions.map(customer => (
              <div
                key={customer.id}
                className="px-2 py-1 text-xs hover:bg-muted cursor-pointer"
                onClick={() => handleSelect(customer)}
              >
                <div className="font-medium">{customer.name}</div>
                <div className="text-muted-foreground text-[10px]">{customer.code}</div>
              </div>
            ))}
          </div>
        )}
        {isLoading && (
          <div className="absolute z-50 mt-1 w-full bg-popover border rounded-md shadow-lg p-2 text-xs text-center">
            <Loader2 className="w-3 h-3 animate-spin inline mr-1" />
            搜索中...
          </div>
        )}
        {searchValue && !isLoading && suggestions.length === 0 && (
          <div className="absolute z-50 mt-1 w-full bg-popover border rounded-md shadow-lg p-2 text-xs text-center text-muted-foreground">
            未找到匹配客户
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group flex items-center gap-1 cursor-pointer rounded px-1 py-0.5',
        'hover:bg-muted',
        hasError && 'text-error bg-error/10',
        wasEdited && 'border border-primary/30'
      )}
      onClick={() => {
        setIsEditing(true);
        setSearchValue(String(value || ''));
      }}
      title={issues.map(i => i.message).join('\n') || '点击编辑'}
    >
      <span className="truncate">{String(value || '-')}</span>
      {hasError && <AlertCircle className="w-3 h-3 shrink-0" />}
      {wasEdited && <Edit2 className="w-3 h-3 shrink-0 text-primary opacity-0 group-hover:opacity-100" />}
    </div>
  );
};

// 可编辑单元格组件
const EditableCell: React.FC<{
  value: unknown;
  field: string;
  row: NormalizedRow;
  onEdit: (rowIndex: number, field: string, value: unknown) => void;
}> = ({ value, field, row, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value || ''));
  const inputRef = useRef<HTMLInputElement>(null);
  
  // 客户名称字段使用特殊选择器 - 注意：必须在所有Hooks之后
  if (field === 'customerName') {
    return <CustomerSelectCell value={value} row={row} onEdit={onEdit} />;
  }

  // 获取字段相关的issue
  const issues = row._issues?.filter(i => i.column === field) || [];
  const hasError = issues.some(i => i.type === 'error');
  const hasWarning = issues.some(i => i.type === 'warning');
  const wasEdited = row._userEdits?.some(e => e.field === field);

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditValue(String(getCellValue(row, field).value || ''));
  };

  const handleSave = () => {
    onEdit(row._rowIndex, field, editValue.trim());
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(String(value || ''));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-7 min-w-20 text-xs py-0 px-2"
          autoFocus
        />
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={handleSave}
        >
          <Check className="w-3 h-3 text-success" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group flex items-center gap-1 cursor-pointer rounded px-1 py-0.5',
        'hover:bg-muted',
        hasError && 'text-error bg-error/10',
        hasWarning && 'text-warning bg-warning/10',
        wasEdited && 'border border-primary/30'
      )}
      onClick={handleStartEdit}
      title={issues.map(i => i.message).join('\n') || '点击编辑'}
    >
      <span className="truncate">{String(value || '-')}</span>
      {hasError && <AlertCircle className="w-3 h-3 shrink-0" />}
      {hasWarning && <AlertTriangle className="w-3 h-3 shrink-0" />}
      {wasEdited && <Edit2 className="w-3 h-3 shrink-0 text-primary opacity-0 group-hover:opacity-100" />}
    </div>
  );
};

// 数据预览表格
const DataPreviewTable: React.FC<{
  mappings: ColumnMapping[];
  data: NormalizedRow[];
  selectedRows: number[];
  forcedImportRows: number[];
  onToggleRow: (index: number) => void;
  onToggleAll: () => void;
  onToggleForceImport: (index: number) => void;
  onCellEdit: (rowIndex: number, field: string, value: unknown) => void;
}> = ({ mappings, data, selectedRows, forcedImportRows, onToggleRow, onToggleAll, onToggleForceImport, onCellEdit }) => {
  const [showErrorsOnly, setShowErrorsOnly] = useState(false);

  const targetFields = useMemo(() =>
    mappings
      .filter(m => m.targetField && !m.targetField.startsWith('composite'))
      .map(m => m.targetField),
    [mappings]
  );

  const filteredData = useMemo(() => {
    const filtered = showErrorsOnly
      ? data.filter(r => r._quality === 'error')
      : data;
    return filtered.slice(0, 50); // 只显示前50行预览
  }, [data, showErrorsOnly]);

  // 检查当前视图中的所有行是否都被选中
  const allSelected = filteredData.length > 0 &&
    filteredData.every(r => selectedRows.includes(r._rowIndex));

  // 统计当前视图中的选中行数
  const selectedCount = filteredData.filter(r => selectedRows.includes(r._rowIndex)).length;

  const getIssueIcon = (quality: NormalizedRow['_quality']) => {
    switch (quality) {
      case 'valid':
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-error" />;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            数据预览
            <span className="text-muted-foreground font-normal text-xs ml-2">
              共 {data.length} 行有效数据
              {data.length > 50 && ' (显示前50行)'}
            </span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowErrorsOnly(!showErrorsOnly)}
            >
              {showErrorsOnly ? '显示全部' : '仅显示错误'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="border rounded-md overflow-auto max-h-96">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <div className="flex flex-col items-center">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={onToggleAll}
                      className="rounded border-input"
                      title="全选/取消全选"
                    />
                    <span className="text-[10px] text-muted-foreground mt-0.5">导入</span>
                  </div>
                </TableHead>
                <TableHead className="w-10">状态</TableHead>
                {targetFields.map(field => (
                  <TableHead key={field} className="text-xs min-w-24">
                    {FIELD_LABELS[field] || field}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((row) => {
                const isSelected = selectedRows.includes(row._rowIndex);
                const isForced = forcedImportRows.includes(row._rowIndex);
                const isError = row._quality === 'error';

                return (
                <TableRow
                  key={row._rowIndex}
                  className={cn(
                    'transition-colors cursor-pointer',
                    !isSelected && 'opacity-50',
                    isForced && 'bg-warning/5',
                    isError && isSelected && !isForced && 'bg-error/5',
                    isSelected && 'bg-primary/5'
                  )}
                  onClick={(e) => {
                    // 如果点击的是可编辑单元格或按钮，不触发行选择
                    if ((e.target as HTMLElement).closest('input, button, [contenteditable="true"]')) {
                      return;
                    }
                    onToggleRow(row._rowIndex);
                  }}
                >
                  <TableCell>
                    <div className="flex flex-col items-center gap-1">
                      {/* 主选择框：控制是否导入 */}
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(row._rowIndex)}
                        onChange={() => onToggleRow(row._rowIndex)}
                        className="rounded border-input"
                        title={row._quality === 'error' ? '错误数据，建议先修复或勾选下方"强制导入"' : '选中导入'}
                      />
                      {/* 强制导入选项：仅对错误数据显示 */}
                      {row._quality === 'error' && (
                        <button
                          type="button"
                          onClick={() => onToggleForceImport(row._rowIndex)}
                          className={cn(
                            'text-[10px] px-1 py-0.5 rounded border transition-colors',
                            forcedImportRows.includes(row._rowIndex)
                              ? 'bg-warning/20 border-warning text-warning-foreground'
                              : 'bg-muted border-transparent text-muted-foreground hover:bg-warning/10'
                          )}
                          title={forcedImportRows.includes(row._rowIndex) ? '点击取消强制导入' : '强制导入此数据（将标记为待完善）'}
                        >
                          {forcedImportRows.includes(row._rowIndex) ? '✓ 强制' : '强制'}
                        </button>
                      )}
                      {/* 正常数据但被选中的提示 */}
                      {row._quality !== 'error' && selectedRows.includes(row._rowIndex) && (
                        <span className="text-[10px] text-success">✓</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getIssueIcon(row._quality)}</TableCell>
                  {targetFields.map(field => {
                    const cellValue = getCellValue(row, field).value;
                    return (
                      <TableCell key={field} className="text-xs p-1">
                        <EditableCell
                          value={cellValue}
                          field={field}
                          row={row}
                          onEdit={onCellEdit}
                        />
                    </TableCell>
                  );
                })}
              </TableRow>
              );
            })}
          </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

// 主组件
export const SmartExcelImportDialog: React.FC<SmartExcelImportDialogProps> = ({
  open,
  onOpenChange,
  onImport,
  defaultCustomerCode,
  defaultCustomerName,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [previewState, setPreviewState] = useState<ImportPreviewState | null>(null);

  // 全局默认客户（用于填充缺少客户信息的行）
  const [globalDefaultCustomer, setGlobalDefaultCustomer] = useState<{
    code: string;
    name: string;
  } | null>(() => {
    if (defaultCustomerCode && defaultCustomerName) {
      return { code: defaultCustomerCode, name: defaultCustomerName };
    }
    return null;
  });

  // 计算缺少客户信息的选中行数
  const missingCustomerCount = useMemo(() => {
    if (!previewState) return 0;
    return previewState.selectedRows.filter(rowIndex => {
      const row = previewState.normalizedData.find(r => r._rowIndex === rowIndex);
      if (!row) return false;
      const customerCode = getCellValue(row, 'customerCode').value;
      const customerName = getCellValue(row, 'customerName').value;
      return !customerCode || !customerName;
    }).length;
  }, [previewState]);

  // 检查是否可以导入 - 只要有选中的行就可以导入
  const canImport = useMemo(() => {
    return previewState !== null && previewState.selectedRows.length > 0;
  }, [previewState]);

  const handleFileSelect = async (file: File) => {
    setIsLoading(true);
    try {
      const state = await analyzeExcelFile(file);
      setPreviewState(state);
      toast.success(`成功识别 ${state.totalRows} 行数据`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '文件解析失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMappingChange = (sourceColumn: string, targetField: string) => {
    if (!previewState) return;
    // 将 SKIP_FIELD_VALUE 转换为空字符串
    const actualTargetField = targetField === SKIP_FIELD_VALUE ? '' : targetField;
    const newState = updateColumnMapping(previewState, sourceColumn, actualTargetField);
    setPreviewState(newState);
  };

  // 批量映射列 - 将多个未识别列一次性映射到同一目标字段
  const handleBatchMapping = (columns: string[], targetField: string) => {
    if (!previewState || columns.length === 0 || !targetField) return;

    // 将 SKIP_FIELD_VALUE 转换为空字符串
    const actualTargetField = targetField === SKIP_FIELD_VALUE ? '' : targetField;

    let newState = previewState;
    for (const column of columns) {
      newState = updateColumnMapping(newState, column, actualTargetField);
    }
    setPreviewState(newState);
  };

  const handleToggleRow = (rowIndex: number) => {
    if (!previewState) return;

    const isCurrentlySelected = previewState.selectedRows.includes(rowIndex);
    const row = previewState.normalizedData.find(r => r._rowIndex === rowIndex);
    const isErrorRow = row?._quality === 'error';

    let newSelected: number[];
    let newForced: number[];

    if (isCurrentlySelected) {
      // 取消选中：从选中列表和强制列表都移除
      newSelected = previewState.selectedRows.filter(i => i !== rowIndex);
      newForced = previewState.forcedImportRows.filter(i => i !== rowIndex);
    } else {
      // 选中：添加到选中列表
      newSelected = [...previewState.selectedRows, rowIndex];

      // 如果是错误行，自动标记为强制导入
      if (isErrorRow) {
        newForced = [...previewState.forcedImportRows, rowIndex];
        toast.warning('错误数据已自动标记为强制导入');
      } else {
        newForced = previewState.forcedImportRows;
      }
    }

    setPreviewState({
      ...previewState,
      selectedRows: newSelected,
      forcedImportRows: newForced,
    });
  };

  const handleToggleAll = () => {
    if (!previewState) return;

    // 获取所有行（包括错误行，因为错误行可能被标记为强制导入）
    const allRows = previewState.normalizedData.map(r => r._rowIndex);

    // 检查是否所有行都已选中（包括强制导入的错误行）
    const allSelected = allRows.every(r => previewState.selectedRows.includes(r));

    if (allSelected) {
      // 如果已全部选中，则取消全选
      setPreviewState({
        ...previewState,
        selectedRows: [],
        forcedImportRows: [],
      });
    } else {
      // 选中所有行（错误行会自动标记为强制导入）
      const errorRows = previewState.normalizedData
        .filter(r => r._quality === 'error')
        .map(r => r._rowIndex);

      setPreviewState({
        ...previewState,
        selectedRows: allRows,
        forcedImportRows: errorRows,
      });
    }
  };

  const handleCellEdit = (rowIndex: number, field: string, value: unknown) => {
    if (!previewState) return;
    const newState = updateCellValue(previewState, rowIndex, field, value);
    setPreviewState(newState);
    toast.success('已修改，数据已重新验证');
  };

  const handleToggleForceImport = (rowIndex: number) => {
    if (!previewState) return;

    const isCurrentlyForced = previewState.forcedImportRows.includes(rowIndex);
    const isCurrentlySelected = previewState.selectedRows.includes(rowIndex);

    let newForcedRows: number[];
    let newSelectedRows: number[];

    if (isCurrentlyForced) {
      // 取消强制导入：从强制列表移除，同时也从选中列表移除（因为是错误行）
      newForcedRows = previewState.forcedImportRows.filter(i => i !== rowIndex);
      newSelectedRows = previewState.selectedRows.filter(i => i !== rowIndex);
      toast.info('已取消强制导入');
    } else {
      // 启用强制导入：添加到强制列表，同时也添加到选中列表
      newForcedRows = [...previewState.forcedImportRows, rowIndex];
      if (!isCurrentlySelected) {
        newSelectedRows = [...previewState.selectedRows, rowIndex];
      } else {
        newSelectedRows = previewState.selectedRows;
      }
      toast.warning('已标记强制导入，该数据将以"待完善"状态导入');
    }

    setPreviewState({
      ...previewState,
      forcedImportRows: newForcedRows,
      selectedRows: newSelectedRows,
    });
  };

  const handleImport = () => {
    if (!previewState || previewState.selectedRows.length === 0) {
      toast.error('请先选择要导入的数据');
      return;
    }

    const products = convertToProducts(
      previewState,
      globalDefaultCustomer?.code || defaultCustomerCode,
      globalDefaultCustomer?.name || defaultCustomerName
    );

    if (products.length === 0) {
      toast.error('没有可导入的数据，请检查是否选中了有效数据行');
      return;
    }

    // 统计强制导入的数据
    const forcedCount = previewState.forcedImportRows.filter(
      rowIndex => previewState!.selectedRows.includes(rowIndex)
    ).length;

    if (forcedCount > 0) {
      toast.success(`已导入 ${products.length} 条数据（含 ${forcedCount} 条强制导入的不完整数据）`);
    }

    onImport(products);
    setPreviewState(null);
    setGlobalDefaultCustomer(null);
    onOpenChange(false);
  };

  const handleDownloadIssues = () => {
    if (!previewState) return;
    const filename = `数据问题报告_${new Date().toISOString().slice(0, 10)}.xlsx`;
    exportIssuesToExcel(previewState, filename);
    toast.success('问题报告已下载');
  };

  const handleClose = () => {
    setPreviewState(null);
    setGlobalDefaultCustomer(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            智能Excel导入
            {previewState && (
              <span className="text-sm font-normal text-muted-foreground">
                - {previewState.fileName}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto py-4">
          {!previewState ? (
            <UploadArea onFileSelect={handleFileSelect} isLoading={isLoading} />
          ) : (
            <div className="space-y-4">
              <QualityOverview
                report={previewState.qualityReport}
                onDownloadIssues={handleDownloadIssues}
                missingCustomerCount={missingCustomerCount}
              />

              {/* 全局默认客户选择器 - 可选的默认值设置 */}
              {missingCustomerCount > 0 && (
                <Card className="mb-4 border-info">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2 text-info">
                      <Info className="w-4 h-4" />
                      设置默认客户（可选）
                      <Badge variant="secondary" className="text-xs">
                        {missingCustomerCount} 行未填写客户
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-3">
                      选中的数据中有 {missingCustomerCount} 行缺少客户信息。
                      <br />
                      <span className="text-info">
                        • 可设置默认客户自动填充
                        • 或使用"强制导入"直接导入不完整数据
                        • 也可双击单元格直接编辑
                      </span>
                    </p>
                    <GlobalCustomerSelector
                      onSelect={(customer) => {
                        if (customer.code && customer.name) {
                          setGlobalDefaultCustomer(customer);
                          toast.success(`已设置默认客户: ${customer.name}，将自动填充到缺少客户的行`);
                        } else {
                          setGlobalDefaultCustomer(null);
                        }
                      }}
                      selectedCustomer={globalDefaultCustomer}
                    />
                  </CardContent>
                </Card>
              )}

              <ColumnMappingConfig
                mappings={previewState.columnMappings}
                onMappingChange={handleMappingChange}
                onBatchMapping={handleBatchMapping}
              />
              <DataPreviewTable
                mappings={previewState.columnMappings}
                data={previewState.normalizedData}
                selectedRows={previewState.selectedRows}
                forcedImportRows={previewState.forcedImportRows}
                onToggleRow={handleToggleRow}
                onToggleAll={handleToggleAll}
                onToggleForceImport={handleToggleForceImport}
                onCellEdit={handleCellEdit}
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {previewState && (
            <>
              <Button variant="outline" onClick={() => setPreviewState(null)}>
                重新上传
              </Button>
              <Button variant="outline" onClick={handleClose}>
                取消
              </Button>
              <Button
                onClick={handleImport}
                disabled={!canImport}
                className={cn(
                  previewState.forcedImportRows.length > 0 && 'border-warning text-warning hover:bg-warning/10'
                )}
                title={!canImport && missingCustomerCount > 0 ? '请先设置默认客户' : ''}
              >
                确认导入 ({previewState.selectedRows.length} 行)
                {previewState.forcedImportRows.length > 0 && (
                  <span className="ml-1 text-xs">
                    (含{previewState.forcedImportRows.length}行待完善)
                  </span>
                )}
                {missingCustomerCount > 0 && globalDefaultCustomer && (
                  <span className="ml-1 text-xs">
                    (使用默认客户)
                  </span>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SmartExcelImportDialog;
