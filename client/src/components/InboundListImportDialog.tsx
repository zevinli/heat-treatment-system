import React, { useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, Loader2, Sparkles, Upload, WandSparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { IProduct } from '@/data/mockData';
import {
  analyzeInboundImportFile,
  downloadInboundImportTemplate,
  revalidateInboundImportRow,
  type InboundImportAnalysis,
  type InboundImportRow,
} from '@/utils/inbound-list-import';

export interface ResolvedInboundImportRow {
  source: InboundImportRow;
  product: IProduct;
}

interface InboundListImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerCode: string;
  customerName: string;
  products: IProduct[];
  addProduct: (product: Omit<IProduct, 'id' | 'stock' | 'inboundQuantity' | 'inboundWeight' | 'inboundDate' | 'batchNo'>) => Promise<IProduct>;
  onApply: (rows: ResolvedInboundImportRow[]) => void;
}

function uniqueImportedCode(sourceCode: string, products: IProduct[], rowIndex: number): string {
  const sanitized = sourceCode.trim().replace(/[^A-Za-z0-9_-]/g, '').slice(0, 70);
  if (sanitized && !products.some(product => product.code.toLowerCase() === sanitized.toLowerCase())) return sanitized;
  const random = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID().replace(/-/g, '').slice(0, 8)
    : `${Date.now().toString(36)}${rowIndex}`;
  return `IMP-${random}`.toUpperCase();
}

export const InboundListImportDialog: React.FC<InboundListImportDialogProps> = ({
  open,
  onOpenChange,
  customerCode,
  customerName,
  products,
  addProduct,
  onApply,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [analysis, setAnalysis] = useState<InboundImportAnalysis | null>(null);
  const [parsing, setParsing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [autoCreateMissing, setAutoCreateMissing] = useState(true);
  const customerProducts = useMemo(
    () => products.filter(product => product.customerCode === customerCode),
    [products, customerCode],
  );

  const rows = useMemo(() => analysis?.rows.map(row => revalidateInboundImportRow(row, autoCreateMissing)) || [], [analysis, autoCreateMissing]);
  const selectedRows = rows.filter(row => row.selected);
  const validRows = selectedRows.filter(row => row.issues.length === 0);
  const matchedCount = rows.filter(row => row.matchedProductId).length;
  const createCount = rows.filter(row => !row.matchedProductId && row.productName).length;
  const issueCount = rows.filter(row => row.issues.length > 0).length;

  const updateRow = (id: string, changes: Partial<InboundImportRow>) => {
    setAnalysis(current => current ? {
      ...current,
      rows: current.rows.map(row => {
        if (row.id !== id) return row;
        let parseIssues = row.parseIssues || [];
        if (changes.quantity !== undefined) parseIssues = parseIssues.filter(issue => issue !== '无法识别数量格式');
        if (changes.weight !== undefined) parseIssues = parseIssues.filter(issue => issue !== '无法识别重量格式');
        if (changes.unitPrice !== undefined) parseIssues = parseIssues.filter(issue => issue !== '无法识别单价格式');
        return { ...row, ...changes, parseIssues };
      }),
    } : current);
  };

  const handleFile = async (file?: File) => {
    if (!file) return;
    setParsing(true);
    try {
      const next = await analyzeInboundImportFile(file, products, customerCode);
      setAnalysis(next);
      const autoMatched = next.rows.filter(row => row.matchConfidence >= 0.86).length;
      toast.success(`已识别 ${next.rows.length} 行，其中 ${autoMatched} 行自动匹配产品`);
    } catch (error) {
      setAnalysis(null);
      toast.error(error instanceof Error ? error.message : '清单解析失败');
    } finally {
      setParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleApply = async () => {
    if (!selectedRows.length) {
      toast.error('请至少勾选一行');
      return;
    }
    if (validRows.length !== selectedRows.length) {
      toast.error(`还有 ${selectedRows.length - validRows.length} 行需要修正，请查看红色提示`);
      return;
    }
    const distinctProductCount = new Set(validRows.map(row => row.matchedProductId || (
      row.productCode || row.workpieceNo || `${row.productName}|${row.material}|${row.process}`
    ).trim().toLowerCase())).size;
    if (distinctProductCount > 500) {
      toast.error(`本次包含 ${distinctProductCount} 个不同产品，单张入库单最多500个，请拆分清单后导入`);
      return;
    }
    setApplying(true);
    const createdByRow = new Map<string, IProduct>();
    try {
      const createdProducts: IProduct[] = [];
      const createdByIdentity = new Map<string, IProduct>();
      const resolved: ResolvedInboundImportRow[] = [];
      for (let index = 0; index < validRows.length; index += 1) {
        const row = validRows[index];
        let product = products.find(item => item.id === row.matchedProductId)
          || createdProducts.find(item => item.id === row.matchedProductId);
        if (!product) {
          if (!autoCreateMissing || !row.productName) throw new Error(`第 ${row.rowNumber} 行未选择产品`);
          const identity = (row.productCode || row.workpieceNo
            || `${row.productName}|${row.material}|${row.process}`)
            .trim()
            .toLowerCase();
          product = createdByIdentity.get(identity);
          if (!product) {
            product = await addProduct({
              code: uniqueImportedCode(row.productCode, [...products, ...createdProducts], index),
              name: row.productName,
              material: row.material,
              process: row.process,
              techRequirement: row.techRequirement,
              workpieceNo: row.workpieceNo,
              unit: row.unit || '件',
              unitPrice: row.unitPrice ?? 0,
              customerCode,
              customerName,
              status: 'incomplete',
            });
            createdProducts.push(product);
            createdByIdentity.set(identity, product);
          }
          // 同一新产品可能被多行复用；若后续行失败，所有已解析行都要记住
          // 对应产品，用户重试时才不会再次创建重复档案。
          createdByRow.set(row.id, product);
        }
        resolved.push({ source: row, product });
      }
      onApply(resolved);
      toast.success(`已加入 ${resolved.length} 行${createdProducts.length ? `，并新建 ${createdProducts.length} 个待完善产品` : ''}`);
      setAnalysis(null);
      onOpenChange(false);
    } catch (error) {
      if (createdByRow.size) {
        setAnalysis(current => current ? {
          ...current,
          rows: current.rows.map(row => {
            const created = createdByRow.get(row.id);
            return created ? { ...row, matchedProductId: created.id, matchConfidence: 1, matchReason: '本次已创建' } : row;
          }),
        } : current);
      }
      toast.error(`导入未完成：${error instanceof Error ? error.message : '未知错误'}${createdByRow.size ? `；已创建的 ${createdByRow.size} 行已保留，可直接重试，不会重复建档` : ''}`);
    } finally {
      setApplying(false);
    }
  };

  const close = (next: boolean) => {
    if (applying) return;
    onOpenChange(next);
    if (!next) setAnalysis(null);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-6xl max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <WandSparkles className="w-5 h-5 text-primary" />
            智能导入来货清单
          </DialogTitle>
          <DialogDescription>
            自动识别标题行和同义表头、匹配“{customerName}”的产品；任何未识别项都会先展示，不会静默跳过。
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2 py-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv,.txt,text/plain"
            className="hidden"
            onChange={event => void handleFile(event.target.files?.[0])}
          />
          <Button onClick={() => fileInputRef.current?.click()} disabled={parsing || applying}>
            {parsing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            {analysis ? '重新选择清单' : '选择 Excel / CSV / TXT'}
          </Button>
          <Button variant="outline" onClick={downloadInboundImportTemplate} disabled={applying}>
            <Download className="w-4 h-4 mr-2" />下载标准模板
          </Button>
          <span className="text-xs text-muted-foreground">支持非标准表头、前置标题、空白行和常见数量/重量格式，最大 10MB</span>
        </div>

        {!analysis && !parsing && (
          <button
            type="button"
            className="min-h-52 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-primary hover:text-foreground transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileSpreadsheet className="w-12 h-12" />
            <span className="font-medium">选择客户发来的清单，系统会先智能识别并让您确认</span>
            <span className="text-sm">导入不会直接保存入库单，也不会丢弃问题行</span>
          </button>
        )}

        {analysis && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">识别数据</div><div className="text-xl font-semibold">{rows.length} 行</div></div>
              <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">匹配已有产品</div><div className="text-xl font-semibold text-success">{matchedCount} 行</div></div>
              <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">可自动新建</div><div className="text-xl font-semibold text-warning">{createCount} 行</div></div>
              <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">需要处理</div><div className={`text-xl font-semibold ${issueCount ? 'text-error' : 'text-success'}`}>{issueCount} 行</div></div>
            </div>

            <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
              <span>文件：{analysis.fileName}</span>
              <span>工作表：{analysis.sheetName}</span>
              <span>表头：第 {analysis.headerRowNumber || 1} 行</span>
              <span>识别字段：{Object.values(analysis.mappings).join('、') || '无表头三列清单'}</span>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="auto-create-import-product"
                  checked={autoCreateMissing}
                  onCheckedChange={checked => setAutoCreateMissing(Boolean(checked))}
                />
                <Label htmlFor="auto-create-import-product" className="cursor-pointer">未匹配产品自动建档</Label>
              </div>
              <span className="text-xs text-muted-foreground">新产品标记为“待完善”，保存前仍可核对单价、单位和工艺</span>
            </div>

            <div className="flex-1 min-h-0 overflow-auto rounded-lg border">
              <table className="w-full min-w-[1220px] text-sm">
                <thead className="bg-muted sticky top-0 z-10">
                  <tr>
                    <th className="p-2 text-left w-12">导入</th>
                    <th className="p-2 text-left w-16">行号</th>
                    <th className="p-2 text-left min-w-56">产品匹配</th>
                    <th className="p-2 text-left min-w-36">产品名称</th>
                    <th className="p-2 text-left w-28">数量</th>
                    <th className="p-2 text-left w-28">重量 kg</th>
                    <th className="p-2 text-left w-28">单位</th>
                    <th className="p-2 text-left w-28">单价</th>
                    <th className="p-2 text-left min-w-28">材质</th>
                    <th className="p-2 text-left min-w-28">工艺</th>
                    <th className="p-2 text-left min-w-52">检查结果</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => (
                    <tr key={row.id} className={`border-t align-top ${row.issues.length ? 'bg-error/5' : ''}`}>
                      <td className="p-2"><Checkbox checked={row.selected} onCheckedChange={checked => updateRow(row.id, { selected: Boolean(checked) })} /></td>
                      <td className="p-2 text-muted-foreground">{row.rowNumber}</td>
                      <td className="p-2">
                        <Select
                          value={row.matchedProductId || '__new__'}
                          onValueChange={value => {
                            const product = customerProducts.find(item => item.id === value);
                            updateRow(row.id, {
                              matchedProductId: value === '__new__' ? undefined : value,
                              matchReason: value === '__new__' ? '将自动新建' : '已手动确认',
                              matchConfidence: value === '__new__' ? 0 : 1,
                              ...(product ? {
                                productName: row.productName || product.name,
                                unit: product.unit || '件',
                                unitPrice: row.unitPrice ?? product.unitPrice,
                              } : {}),
                            });
                          }}
                        >
                          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__new__">{autoCreateMissing ? '＋ 自动新建产品' : '未选择产品'}</SelectItem>
                            {customerProducts.map(product => (
                              <SelectItem key={product.id} value={product.id}>{product.code} · {product.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                          {row.matchedProductId && row.matchConfidence >= 0.86 ? <Sparkles className="w-3 h-3 text-primary" /> : null}
                          {row.matchReason || '待确认'}
                          {row.matchedProductId ? `（${Math.round(row.matchConfidence * 100)}%）` : ''}
                          {row.matchedProductId && (row.matchConfidence < 0.86 || row.matchReason.includes('多个相似')) ? (
                            <Button
                              type="button"
                              variant="link"
                              size="sm"
                              className="h-auto p-0 text-xs"
                              onClick={() => updateRow(row.id, {
                                matchConfidence: 1,
                                matchReason: '已手动确认',
                              })}
                            >
                              确认此匹配
                            </Button>
                          ) : null}
                        </div>
                      </td>
                      <td className="p-2"><Input className="h-9" value={row.productName} onChange={event => updateRow(row.id, { productName: event.target.value })} placeholder="产品名称" /></td>
                      <td className="p-2"><Input className="h-9" type="number" min={0} step={1} value={row.quantity || ''} onChange={event => updateRow(row.id, { quantity: Number(event.target.value) })} /></td>
                      <td className="p-2"><Input className="h-9" type="number" min={0} step="0.001" value={row.weight || ''} onChange={event => updateRow(row.id, { weight: Number(event.target.value) })} /></td>
                      <td className="p-2">
                        <Select value={row.unit} onValueChange={unit => updateRow(row.id, { unit })}>
                          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="件">件</SelectItem><SelectItem value="kg">kg</SelectItem></SelectContent>
                        </Select>
                      </td>
                      <td className="p-2"><Input className="h-9" type="number" min={0} step="0.01" value={row.unitPrice ?? ''} onChange={event => updateRow(row.id, { unitPrice: event.target.value === '' ? undefined : Number(event.target.value) })} /></td>
                      <td className="p-2"><Input className="h-9" value={row.material} onChange={event => updateRow(row.id, { material: event.target.value })} /></td>
                      <td className="p-2"><Input className="h-9" value={row.process} onChange={event => updateRow(row.id, { process: event.target.value })} /></td>
                      <td className="p-2">
                        {row.issues.length ? (
                          <div className="text-xs text-error space-y-1"><div className="flex items-center gap-1 font-medium"><AlertCircle className="w-3.5 h-3.5" />需修正</div>{row.issues.map(issue => <div key={issue}>· {issue}</div>)}</div>
                        ) : (
                          <div className="text-xs text-success flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />可导入</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-3 border-t">
          <div className="text-sm text-muted-foreground">
            {analysis
              ? `已选 ${selectedRows.length} 行，可导入 ${validRows.length} 行${analysis.rows.length - validRows.length ? `；另有 ${analysis.rows.length - validRows.length} 行待修正` : ''}`
              : '请先选择清单'}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => close(false)} disabled={applying}>取消</Button>
            <Button onClick={() => void handleApply()} disabled={!analysis || applying || !validRows.length}>
              {applying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              {validRows.length ? `加入 ${validRows.length} 行可用数据` : '确认加入入库单'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
