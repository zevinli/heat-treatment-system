/**
 * Excel 导出工具函数
 * 支持将表格数据导出为格式化的 Excel 文件
 */

import * as XLSX from 'xlsx';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { toast } from 'sonner';

export interface IExcelColumn {
  title: string;
  dataIndex: string;
  key: string;
  width?: number;
  render?: (value: any, record: any, index: number) => string | number;
}

export interface IExportOptions {
  filename: string;
  sheetName?: string;
  title?: string;
  headers?: Record<string, string>;
}

/**
 * 将数据导出为格式化的 Excel 文件
 * @param data 数据数组
 * @param columns 列定义
 * @param options 导出选项
 */
export function exportToExcel(
  data: any[],
  columns: IExcelColumn[],
  options: IExportOptions
): void {
  const { filename, sheetName = 'Sheet1', title, headers } = options;

  // 创建工作簿
  const wb = XLSX.utils.book_new();

  // 准备表头数据
  const headerRow = columns.map(col => col.title);

  // 准备数据行
  const dataRows = data.map((record, index) => {
    return columns.map(col => {
      const value = record[col.dataIndex];
      if (col.render) {
        return col.render(value, record, index);
      }
      return value ?? '';
    });
  });

  // 构建完整的工作表数据
  let wsData: any[][] = [];

  // 添加标题
  if (title) {
    wsData.push([title]);
    wsData.push([]);
  }

  // 添加头部信息
  if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      wsData.push([key, value]);
    });
    wsData.push([]);
  }

  // 添加表头
  wsData.push(headerRow);

  // 添加数据
  wsData.push(...dataRows);

  // 创建工作表
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // 设置列宽
  const colWidths = columns.map(col => ({ wch: col.width || 15 }));
  ws['!cols'] = colWidths;

  // 设置行高
  ws['!rows'] = wsData.map((_, i) => ({ hpt: 20 }));

  // 设置单元格样式（通过自定义属性，xlsx 库支持有限）
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

  // 为标题行添加样式标记
  let currentRow = 0;
  if (title) {
    // 标题行合并并居中
    const titleCell = ws[XLSX.utils.encode_cell({ r: 0, c: 0 })];
    if (titleCell) {
      titleCell.s = {
        font: { bold: true, sz: 16 },
        alignment: { horizontal: 'center', vertical: 'center' },
      };
    }
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: columns.length - 1 } }];
    currentRow = 3; // 标题 + 空行 + 头部信息
    if (headers) {
      currentRow += Object.keys(headers).length + 1;
    }
  } else if (headers) {
    currentRow = Object.keys(headers).length + 1;
  }

  // 为表头添加样式
  for (let c = 0; c < columns.length; c++) {
    const cellRef = XLSX.utils.encode_cell({ r: currentRow, c });
    if (ws[cellRef]) {
      ws[cellRef].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '4472C4' }, patternType: 'solid' },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } },
        },
      };
    }
  }

  // 为数据行添加边框
  for (let r = currentRow + 1; r <= range.e.r; r++) {
    for (let c = 0; c < columns.length; c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      if (ws[cellRef]) {
        ws[cellRef].s = {
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } },
          },
        };
      }
    }
  }

  // 将工作表添加到工作簿
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // 下载文件
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/**
 * 导出表格数据为 CSV 文件
 * @param data 数据数组
 * @param columns 列定义
 * @param filename 文件名
 */
export function exportToCSV(
  data: any[],
  columns: IExcelColumn[],
  filename: string
): void {
  // 构建表头
  const headerRow = columns.map(col => `"${col.title}"`).join(',');

  // 构建数据行
  const dataRows = data.map((record, index) => {
    return columns
      .map(col => {
        let value = record[col.dataIndex];
        if (col.render) {
          value = col.render(value, record, index);
        }
        // 处理包含逗号或引号的值
        const strValue = String(value ?? '').replace(/"/g, '""');
        return `"${strValue}"`;
      })
      .join(',');
  });

  const content = headerRow + '\n' + dataRows.join('\n');

  // 添加 BOM 以支持中文
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

/**
 * 检测当前是否为深色模式
 */
function isDarkMode(): boolean {
  if (typeof document === 'undefined') return false;
  return document.documentElement.getAttribute('data-theme') === 'dark';
}

/**
 * 处理打印内容中的样式，适配深色模式
 * 将深色模式的样式转换为适合打印的样式（白底黑字）
 */
function processPrintContent(content: string): string {
  // 创建临时容器来解析内容
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = content;
  
  const processElement = (element: HTMLElement) => {
    // 获取计算样式
    const computedStyle = window.getComputedStyle(element);
    const bgColor = computedStyle.backgroundColor;
    const color = computedStyle.color;
    
    // 如果是透明背景或深色背景，设置为白色背景
    if (bgColor === 'transparent' || bgColor === 'rgba(0, 0, 0, 0)' || bgColor.includes('15') || bgColor.includes('10')) {
      element.style.backgroundColor = '#ffffff';
    }
    
    // 如果是浅色文字，设置为深色文字
    if (color.includes('98%') || color.includes('255') || color.includes('hsl(220 20% 98%)')) {
      element.style.color = '#000000';
    }
    
    // 处理表格边框颜色
    if (element.tagName === 'TABLE' || element.tagName === 'TH' || element.tagName === 'TD') {
      element.style.borderColor = '#666666';
    }
    
    // 处理表头背景
    if (element.tagName === 'TH' || (element.parentElement?.tagName === 'THEAD' && element.tagName === 'TR')) {
      element.style.backgroundColor = '#f3f4f6';
      element.style.color = '#000000';
    }
    
    // 递归处理子元素
    Array.from(element.children).forEach(child => {
      processElement(child as HTMLElement);
    });
  };
  
  processElement(tempDiv);
  return tempDiv.innerHTML;
}

/**
 * 触发浏览器打印
 * @param elementId 要打印的元素ID，不传则打印整个页面
 */
export function triggerPrint(elementId?: string): void {
  if (elementId) {
    const element = document.getElementById(elementId);
    if (!element) {
      logger.error(`Element with id "${elementId}" not found`);
      return;
    }

    // 创建打印窗口
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      logger.error('Failed to open print window');
      toast('打印窗口被浏览器拦截，请允许弹窗后重试');
      return;
    }

    // 获取元素内容并处理样式
    const rawContent = element.outerHTML;
    const isDark = isDarkMode();
    
    // 如果是深色模式，需要转换样式为适合打印的样式
    const content = isDark ? processPrintContent(rawContent) : rawContent;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>打印</title>
          <style>
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              font-family: "SimSun", "Songti SC", "STSong", "Microsoft YaHei", serif;
              font-size: 14px;
              line-height: 1.5;
              color: #000000 !important;
              background-color: #ffffff !important;
              margin: 0;
              padding: 20px;
            }
            #print-preview-content {
              background-color: #ffffff !important;
              color: #000000 !important;
            }
            #print-preview-content * {
              color: #000000 !important;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              background-color: #ffffff !important;
            }
            th, td {
              border: 1px solid #666666 !important;
              padding: 8px;
              text-align: left;
              vertical-align: middle;
              background-color: #ffffff !important;
              color: #000000 !important;
            }
            th {
              background-color: #f3f4f6 !important;
              font-weight: bold;
              color: #000000 !important;
            }
            tr {
              background-color: #ffffff !important;
            }
            /* 合计行样式 */
            tr[style*="backgroundColor"] td,
            tr[style*="background-color"] td {
              background-color: #f9fafb !important;
            }
            h1, h2, h3 {
              margin: 0;
              color: #000000 !important;
            }
            p, span, div {
              color: #000000 !important;
            }
            p {
              margin: 4px 0;
            }
            @media print {
              body {
                margin: 0;
                padding: 15px;
                background-color: #ffffff !important;
                color: #000000 !important;
              }
              .no-print {
                display: none !important;
              }
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `);

    printWindow.document.close();

    // 等待内容渲染完成后打印
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      // 打印对话框关闭后关闭窗口
      setTimeout(() => {
        if (!printWindow.closed) {
          printWindow.close();
        }
      }, 100);
    }, 300);
  } else {
    // 打印整个页面
    window.print();
  }
}

/**
 * 创建打印样式表
 * 添加到需要打印的元素上
 */
