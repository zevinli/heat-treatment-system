import * as XLSX from '@e965/xlsx';
import {
  analyzeInboundImportFile,
  analyzeInboundMatrix,
  revalidateInboundImportRow,
} from '../../client/src/utils/inbound-list-import';
import type { IProduct } from '../../client/src/data/mockData';

const products: IProduct[] = [
  {
    id: 'product-a', code: 'P-001', name: '齿轮轴', material: '40Cr', process: '调质',
    techRequirement: '', workpieceNo: 'M3-Z20', unit: '件', unitPrice: 12,
    customerCode: 'TENANT-A', customerName: '客户A', stock: 0, inboundQuantity: 0,
    inboundWeight: 0, inboundDate: '', batchNo: '', status: 'complete',
  },
  {
    id: 'product-kg', code: 'P-002', name: '轴承', material: 'GCr15', process: '淬火',
    techRequirement: '', workpieceNo: 'BR-01', unit: 'kg', unitPrice: 8,
    customerCode: 'TENANT-A', customerName: '客户A', stock: 0, inboundQuantity: 0,
    inboundWeight: 0, inboundDate: '', batchNo: '', status: 'complete',
  },
  {
    id: 'product-other', code: 'P-003', name: '齿轮轴', material: '40Cr', process: '调质',
    techRequirement: '', workpieceNo: 'M3-Z20', unit: '件', unitPrice: 12,
    customerCode: 'TENANT-B', customerName: '客户B', stock: 0, inboundQuantity: 0,
    inboundWeight: 0, inboundDate: '', batchNo: '', status: 'complete',
  },
];

describe('inbound list intelligent import', () => {
  const mockFile = (name: string, content: ArrayBuffer | string): File => {
    const bytes = typeof content === 'string' ? new TextEncoder().encode(content) : new Uint8Array(content);
    return {
      name,
      size: bytes.byteLength,
      arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
      text: async () => new TextDecoder().decode(bytes),
    } as File;
  };

  it('parses a real xlsx file and automatically chooses the sheet with usable business rows', async () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
      ['填写说明'],
      ['请不要修改模板结构'],
    ]), '说明');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
      ['客户送货清单'],
      ['物料编号', '品名', '来货数量（件）', '净重KG', '热处理方式'],
      ['P-001', '齿轮轴', '12件', '8.5kg', '调质'],
    ]), '业务数据');
    const bytes = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;

    const analysis = await analyzeInboundImportFile(mockFile('客户非标准清单.xlsx', bytes), products, 'TENANT-A');

    expect(analysis).toMatchObject({ fileName: '客户非标准清单.xlsx', sheetName: '业务数据' });
    expect(analysis.rows[0]).toMatchObject({
      matchedProductId: 'product-a', quantity: 12, weight: 8.5, process: '调质', issues: [],
    });
  });

  it('parses txt lists with semicolon delimiters through the same preview validation', async () => {
    const analysis = await analyzeInboundImportFile(mockFile(
      '现场清单.txt',
      '产品名称;数量;重量;单位\n新现场产品;3;1.25;kg',
    ), products, 'TENANT-A');

    expect(analysis.rows[0]).toMatchObject({
      productName: '新现场产品', quantity: 3, weight: 1.25, unit: 'kg', issues: [],
    });
  });

  it('rejects oversized matrices before rendering thousands of editable rows', () => {
    const matrix = [
      ['产品名称', '数量'],
      ...Array.from({ length: 5_000 }, (_, index) => [`产品${index}`, 1]),
    ];
    expect(() => analyzeInboundMatrix(matrix, products, 'TENANT-A')).toThrow('清单超过5000行');
  });

  it('detects a non-first header row, aliases and formatted numbers', () => {
    const analysis = analyzeInboundMatrix([
      ['客户送货清单（2026年8月）'],
      [],
      ['物料编号', '品名', '来货数量（件）', '净重KG', '材料牌号', '热处理工艺'],
      ['P-001', '齿轮轴', '1,200件', '85.50 kg', '40Cr', '调质'],
    ], products, 'TENANT-A');

    expect(analysis.headerRowNumber).toBe(3);
    expect(analysis.rows).toHaveLength(1);
    expect(analysis.rows[0]).toMatchObject({
      matchedProductId: 'product-a',
      quantity: 1200,
      weight: 85.5,
      unit: '件',
      process: '调质',
      issues: [],
    });
  });

  it('recognizes processing-method aliases and converts tons to kilograms', () => {
    const analysis = analyzeInboundMatrix([
      ['货品名称', '来货数', '净重', '处理方式'],
      ['新工件', 2, '0.5吨', '正火'],
    ], products, 'TENANT-A');

    expect(analysis.mappings.process).toBe('处理方式');
    expect(analysis.rows[0]).toMatchObject({
      productName: '新工件',
      quantity: 2,
      weight: 500,
      unit: '件',
      process: '正火',
      issues: [],
    });
  });

  it('inherits the matched product pricing unit and validates required weight', () => {
    const analysis = analyzeInboundMatrix([
      ['工件号', '数量'],
      ['BR-01', 10],
    ], products, 'TENANT-A');

    expect(analysis.rows[0].matchedProductId).toBe('product-kg');
    expect(analysis.rows[0].unit).toBe('kg');
    expect(analysis.rows[0].issues).toContain('按重量计价时必须填写重量');
  });

  it('never matches a same-name product owned by another customer', () => {
    const analysis = analyzeInboundMatrix([
      ['产品名称', '入库数量'],
      ['齿轮轴', 5],
    ], products, 'TENANT-C');

    expect(analysis.rows[0].matchedProductId).toBeUndefined();
    expect(analysis.rows[0].matchReason).toBe('未找到相似产品');
    expect(analysis.rows[0].issues).toEqual([]);
  });

  it('blocks ambiguous automatic matches until the user confirms one', () => {
    const similar = {
      ...products[0],
      id: 'product-a-similar',
      code: 'P-001-B',
      workpieceNo: 'M3-Z20-B',
    };
    const analysis = analyzeInboundMatrix([
      ['产品名称', '数量'],
      ['齿轮轴', 5],
    ], [...products, similar], 'TENANT-A');

    expect(analysis.rows[0].matchedProductId).toBeDefined();
    expect(analysis.rows[0].issues).toContain('产品匹配不够确定，请手动确认');
    expect(revalidateInboundImportRow({ ...analysis.rows[0], matchConfidence: 1, matchReason: '已手动确认' }, true).issues).toEqual([]);
  });

  it('keeps invalid rows visible and makes them non-importable', () => {
    const analysis = analyzeInboundMatrix([
      ['产品名称', '数量', '重量'],
      ['新产品', '不是数字', -3],
    ], products, 'TENANT-A');
    const row = revalidateInboundImportRow(analysis.rows[0], true);

    expect(row.issues).toEqual(expect.arrayContaining([
      '入库数量必须大于0',
      '入库重量不能为负数',
    ]));
    expect(analysis.rows[0].issues).toContain('无法识别数量格式');
    expect(analysis.rows[0].selected).toBe(false);
  });

  it('supports a simple three-column list without headers', () => {
    const analysis = analyzeInboundMatrix([
      ['P-001', 9, 2.5],
    ], products, 'TENANT-A');

    expect(analysis.rows[0]).toMatchObject({ matchedProductId: 'product-a', quantity: 9, weight: 2.5 });
  });
});
