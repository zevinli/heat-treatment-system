/**
 * Excel 导出工具函数
 */

import { toast } from 'sonner';
import { logger } from '@lark-apaas/client-toolkit/logger';

/**
 * 导出数据到 Excel 文件
 * @param data 要导出的数据数组
 * @param columns 列定义 { key: 数据键, title: 列标题, formatter?: 格式化函数 }
 * @param filename 文件名（不含扩展名）
 */
export const exportToExcel = async (
  data: any[],
  columns: { key: string; title: string; formatter?: (value: unknown, row: any) => string | number }[],
  filename: string
) => {
  try {
    const XLSX = await import('@e965/xlsx');
    
    // 转换数据格式
    const exportData = data.map(row => {
      const obj: Record<string, string | number> = {};
      columns.forEach(col => {
        const value = row[col.key];
        if (col.formatter) {
          obj[col.title] = col.formatter(value, row);
        } else {
          obj[col.title] = value !== undefined && value !== null ? String(value) : '';
        }
      });
      return obj;
    });

    // 创建工作簿
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    
    // 设置列宽
    const colWidths = columns.map(col => ({ wch: Math.max(col.title.length, 12) }));
    ws['!cols'] = colWidths;

    // 下载文件
    XLSX.writeFile(wb, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success(`成功导出 ${data.length} 条数据`);
  } catch (error) {
    logger.error('导出Excel失败:', error);
    toast.error('导出Excel失败，请重试');
  }
};

/**
 * 产品导出列定义
 */
export const getProductExportColumns = () => [
  { key: 'code', title: '产品编号' },
  { key: 'name', title: '产品名称' },
  { key: 'material', title: '材质' },
  { key: 'process', title: '工艺' },
  { key: 'techRequirement', title: '技术要求' },
  { key: 'workpieceNo', title: '工件编号' },
  { key: 'unit', title: '计价单位' },
  { key: 'unitPrice', title: '单价', formatter: (v: unknown) => v !== undefined ? Number(v).toFixed(2) : '0.00' },
  { key: 'customerCode', title: '客户编码' },
  { key: 'customerName', title: '客户名称' },
  { key: 'stock', title: '库存数量' },
  { key: 'status', title: '状态', formatter: (v: unknown) => v === 'active' ? '启用' : '停用' },
  { key: 'remark', title: '备注' },
];

/**
 * 客户导出列定义
 */
export const getCustomerExportColumns = () => [
  { key: 'code', title: '客户编号' },
  { key: 'name', title: '客户名称' },
  { key: 'contact', title: '联系人' },
  { key: 'phone', title: '联系电话' },
  { key: 'address', title: '地址' },
  { key: 'transport', title: '运输方式' },
  { key: 'paymentTerm', title: '付款期' },
  { key: 'deliveryDirection', title: '送货方向' },
  { key: 'settlement', title: '结算方式' },
  { key: 'category', title: '客户分类' },
  { key: 'inboundCount', title: '入库频次' },
  { key: 'status', title: '状态', formatter: (v: unknown) => v === 'active' ? '合作中' : '暂停' },
  { key: 'remark', title: '备注' },
];

/**
 * 库存导出列定义
 */
export const getInventoryExportColumns = () => [
  { key: 'productCode', title: '产品编号' },
  { key: 'productName', title: '产品名称' },
  { key: 'material', title: '材质' },
  { key: 'process', title: '工艺' },
  { key: 'techRequirement', title: '技术要求' },
  { key: 'workpieceNo', title: '工件编号' },
  { key: 'unit', title: '计价单位' },
  { key: 'unitPrice', title: '单价', formatter: (v: unknown) => v !== undefined ? Number(v).toFixed(2) : '0.00' },
  { key: 'inboundQuantity', title: '入库数量' },
  { key: 'inboundWeight', title: '入库重量' },
  { key: 'currentStock', title: '当前库存' },
  { key: 'customerCode', title: '客户编码' },
  { key: 'customerName', title: '客户名称' },
  { key: 'status', title: '状态', formatter: (_: unknown, row: Record<string, unknown>) => {
    const stock = Number(row.currentStock) || 0;
    const threshold = Number(row.warningThreshold) || 0;
    if (stock <= 0) return '缺货';
    if (stock < threshold) return '预警';
    return '正常';
  }},
];

/**
 * 对账单导出列定义
 */
export const getReconciliationExportColumns = () => [
  { key: 'reconciliationNo', title: '对账单号' },
  { key: 'customerCode', title: '客户编码' },
  { key: 'customerName', title: '客户名称' },
  { key: 'month', title: '对账月份' },
  { key: 'status', title: '状态', formatter: (v: unknown) => {
    const statusMap: Record<string, string> = {
      draft: '草稿',
      confirmed: '已确认',
      audited: '已审核',
      invoiced: '已开票',
      paid: '已回款',
    };
    return statusMap[String(v)] || String(v);
  }},
  { key: 'totalAmount', title: '总金额', formatter: (v: unknown) => v !== undefined ? Number(v).toFixed(2) : '0.00' },
  { key: 'deductionAmount', title: '扣减金额', formatter: (v: unknown) => v !== undefined ? Number(v).toFixed(2) : '0.00' },
  { key: 'otherAmount', title: '其他金额', formatter: (v: unknown) => v !== undefined ? Number(v).toFixed(2) : '0.00' },
  { key: 'compensationAmount', title: '赔偿金额', formatter: (v: unknown) => v !== undefined ? Number(v).toFixed(2) : '0.00' },
  { key: 'finalAmount', title: '最终金额', formatter: (v: unknown) => v !== undefined ? Number(v).toFixed(2) : '0.00' },
  { key: 'invoiceAmount', title: '已开票金额', formatter: (v: unknown) => v !== undefined ? Number(v).toFixed(2) : '0.00' },
  { key: 'uninvoiceAmount', title: '未开票金额', formatter: (v: unknown) => v !== undefined ? Number(v).toFixed(2) : '0.00' },
  { key: 'receiptAmount', title: '已回款金额', formatter: (v: unknown) => v !== undefined ? Number(v).toFixed(2) : '0.00' },
  { key: 'unreceivedAmount', title: '未回款金额', formatter: (v: unknown) => v !== undefined ? Number(v).toFixed(2) : '0.00' },
];
