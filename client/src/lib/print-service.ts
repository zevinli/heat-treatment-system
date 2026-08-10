import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import { triggerPrint } from './excel-export';

export type PrinterMode = 'browser' | 'network' | 'bluetooth';

export interface PrinterConfig {
  mode: PrinterMode;
  networkUrl: string;
  bluetoothServiceUuid: string;
  bluetoothCharacteristicUuid: string;
}

export const PRINTER_CONFIG_KEY = '__global_heat_printer_config';

export const DEFAULT_PRINTER_CONFIG: PrinterConfig = {
  mode: 'browser',
  networkUrl: '',
  bluetoothServiceUuid: '',
  bluetoothCharacteristicUuid: '',
};

export function getPrinterConfig(): PrinterConfig {
  try {
    const value = localStorage.getItem(PRINTER_CONFIG_KEY);
    return value ? { ...DEFAULT_PRINTER_CONFIG, ...JSON.parse(value) } : DEFAULT_PRINTER_CONFIG;
  } catch {
    return DEFAULT_PRINTER_CONFIG;
  }
}

export function savePrinterConfig(config: PrinterConfig): void {
  localStorage.setItem(PRINTER_CONFIG_KEY, JSON.stringify(config));
}

function getPrintableElement(elementId: string): HTMLElement {
  const element = document.getElementById(elementId);
  if (!element) throw new Error(`未找到打印区域：${elementId}`);
  return element;
}

async function networkPrint(element: HTMLElement, url: string, title: string): Promise<void> {
  if (!url) throw new Error('请先配置网络打印服务地址');
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title,
      html: element.outerHTML,
      text: element.innerText,
      requestedAt: new Date().toISOString(),
    }),
  });
  if (!response.ok) throw new Error(`网络打印失败（HTTP ${response.status}）`);
}

async function bluetoothPrint(element: HTMLElement, config: PrinterConfig): Promise<void> {
  const bluetooth = (navigator as any).bluetooth;
  if (!bluetooth) throw new Error('当前浏览器不支持 Web Bluetooth，请使用 Chrome/Edge 并通过 HTTPS 访问');
  if (!config.bluetoothServiceUuid || !config.bluetoothCharacteristicUuid) {
    throw new Error('请先配置蓝牙打印机 Service UUID 和 Characteristic UUID');
  }

  const device = await bluetooth.requestDevice({
    filters: [{ services: [config.bluetoothServiceUuid] }],
    optionalServices: [config.bluetoothServiceUuid],
  });
  const server = await device.gatt?.connect();
  if (!server) throw new Error('无法连接蓝牙打印机');
  try {
    const service = await server.getPrimaryService(config.bluetoothServiceUuid);
    const characteristic = await service.getCharacteristic(config.bluetoothCharacteristicUuid);
    const bytes = new TextEncoder().encode(`${element.innerText}\n\n`);
    // 多数蓝牙热敏打印机对单包长度有限制，分块发送避免截断。
    for (let offset = 0; offset < bytes.length; offset += 180) {
      const chunk = bytes.slice(offset, offset + 180);
      if (characteristic.writeValueWithoutResponse) await characteristic.writeValueWithoutResponse(chunk);
      else await characteristic.writeValue(chunk);
    }
  } finally {
    server.disconnect();
  }
}

export async function smartPrint(elementId: string, title = '单据打印'): Promise<void> {
  const config = getPrinterConfig();
  if (config.mode === 'browser') {
    triggerPrint(elementId);
    return;
  }

  const element = getPrintableElement(elementId);
  try {
    if (config.mode === 'network') await networkPrint(element, config.networkUrl, title);
    else await bluetoothPrint(element, config);
    toast.success(`${config.mode === 'network' ? '网络' : '蓝牙'}打印任务已发送`);
  } catch (error) {
    const message = error instanceof Error ? error.message : '打印失败';
    toast.error(message);
    throw error;
  }
}

export async function exportElementToPdf(
  elementId: string,
  filename: string,
  orientation: 'portrait' | 'landscape' = 'portrait',
): Promise<void> {
  const element = getPrintableElement(elementId);
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
  });
  const pdf = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imageHeight = canvas.height * pageWidth / canvas.width;
  const image = canvas.toDataURL('image/png');
  let remaining = imageHeight;
  let y = 0;
  pdf.addImage(image, 'PNG', 0, y, pageWidth, imageHeight);
  remaining -= pageHeight;
  while (remaining > 0) {
    y = remaining - imageHeight;
    pdf.addPage();
    pdf.addImage(image, 'PNG', 0, y, pageWidth, imageHeight);
    remaining -= pageHeight;
  }
  pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}
