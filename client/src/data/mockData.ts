// 热处理收发货管理系统 - 共享数据
// 此文件包含所有页面共享的客户和产品数据

// ========== 客户数据 ==========
export interface ICustomer {
  id: string;              // 客户ID
  code: string;            // 客户编号
  name: string;            // 客户名称
  contact: string;         // 联系人
  phone: string;           // 联系电话
  address: string;         // 地址
  transport: string;       // 运输方式
  paymentTerm: string;     // 付款期
  deliveryDirection: string; // 送货方向
  settlement: string;      // 结算方式
  category: string;        // 客户分类（单产/量产）
  inboundCount: number;    // 入库频次
  status: 'active' | 'inactive'; // 状态
  remark?: string;         // 备注
}

// 统一的客户数据 - 所有页面使用此数据
export let mockCustomers: ICustomer[] = [
  { id: '1', code: '0945', name: '恩伟', contact: '张经理', phone: '13800138001', address: '北京市朝阳区', transport: '', paymentTerm: '', deliveryDirection: '', settlement: '', category: '', inboundCount: 129, status: 'active' },
  { id: '2', code: '0957', name: '0703客户测试', contact: '李主任', phone: '13900139002', address: '上海市浦东新区', transport: '', paymentTerm: '', deliveryDirection: '', settlement: '', category: '', inboundCount: 106, status: 'active' },
  { id: '3', code: '0879', name: '刘二', contact: '王工', phone: '13700137003', address: '深圳市宝安区', transport: '', paymentTerm: '5', deliveryDirection: '', settlement: '', category: '', inboundCount: 83, status: 'active' },
  { id: '4', code: '0950', name: '伟力', contact: '陈厂长', phone: '13600136004', address: '广州市番禺区', transport: '空运', paymentTerm: '', deliveryDirection: '', settlement: '', category: '单产', inboundCount: 34, status: 'active' },
  { id: '5', code: '0963', name: '智-续结存', contact: '赵经理', phone: '13500135005', address: '杭州市余杭区', transport: '', paymentTerm: '', deliveryDirection: '', settlement: '', category: '', inboundCount: 25, status: 'active' },
  { id: '6', code: '0962', name: '版本', contact: '林经理', phone: '13400134006', address: '宁波市北仑区', transport: '', paymentTerm: '', deliveryDirection: '', settlement: '', category: '', inboundCount: 20, status: 'active' },
  { id: '7', code: '0954', name: '选', contact: '孙主任', phone: '13300133007', address: '苏州市工业园区', transport: '', paymentTerm: '', deliveryDirection: '', settlement: '', category: '', inboundCount: 18, status: 'active' },
  { id: '8', code: '0952', name: '3242微', contact: '周经理', phone: '13200132008', address: '成都市高新区', transport: '', paymentTerm: '', deliveryDirection: '', settlement: '', category: '', inboundCount: 15, status: 'active' },
  { id: '9', code: '0946', name: '诚钢', contact: '吴厂长', phone: '13100131009', address: '武汉市江汉区', transport: '', paymentTerm: '', deliveryDirection: '', settlement: '', category: '', inboundCount: 12, status: 'active' },
  { id: '10', code: '0934', name: 'ynvx', contact: '郑经理', phone: '13000130010', address: '南京市鼓楼区', transport: '', paymentTerm: '', deliveryDirection: '', settlement: '', category: '', inboundCount: 10, status: 'inactive' },
];

// 更新客户数据的函数
export const updateCustomers = (newCustomers: ICustomer[]) => {
  mockCustomers = newCustomers;
};

// 添加客户
export const addCustomer = (customer: ICustomer) => {
  mockCustomers.push(customer);
};

// 更新客户
export const updateCustomer = (id: string, customer: Partial<ICustomer>) => {
  const index = mockCustomers.findIndex(c => c.id === id);
  if (index !== -1) {
    mockCustomers[index] = { ...mockCustomers[index], ...customer };
  }
};

// 删除客户
export const deleteCustomer = (id: string) => {
  mockCustomers = mockCustomers.filter(c => c.id !== id);
};

// ========== 产品数据 ==========
// 产品状态类型 - 表示产品信息完整度
export type ProductStatus = 'complete' | 'incomplete';

export interface IProduct {
  id: string;              // 产品ID
  code: string;            // 产品编号/工件编号
  name: string;            // 产品名称
  material: string;        // 材质
  process: string;         // 工艺
  techRequirement: string; // 技术要求
  workpieceNo: string;     // 工件编号
  unit: string;            // 单位（件/kg）
  unitPrice: number;       // 单价
  customerCode: string;    // 所属客户编码
  customerName: string;    // 所属客户名称
  stock: number;           // 库存数量（件）
  stockWeight?: number;    // 库存重量（kg）
  inboundQuantity: number; // 入库数量（件，用于出库）
  inboundWeight: number;   // 入库重量（kg，用于出库）
  inboundDate: string;     // 入库日期
  batchNo: string;         // 入库批次号
  status: ProductStatus;   // 产品状态（complete-信息完整 / incomplete-信息待完善）
  remark?: string;         // 备注
  warningThreshold?: number; // 库存预警阈值
  attachments?: string[];   // 产品图片附件URL数组
  createdAt?: string;      // 创建时间
  updatedAt?: string;      // 更新时间
}

// 操作日志类型
export interface IOperationLog {
  id: string;
  entityType: 'product' | 'inventory_record' | 'outbound_order' | 'inbound_order' | 'customer';
  entityId: string;
  operation: 'create' | 'update' | 'delete' | 'promote' | 'cancel' | 'archive' | 'inbound' | 'outbound';
  operator: string;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  source: 'manual' | 'scan' | 'voice' | 'ai' | 'excel' | 'api';
  ipAddress?: string;
  createdAt: string;
}

// 统一的产品数据 - 所有页面使用此数据
export let mockProducts: IProduct[] = [
  // 恩伟客户的产品
  { id: '1', code: 'C1345', name: '零件', material: '40Cr', process: '回火', techRequirement: '要求硬度60-62,心部硬度40-42', workpieceNo: 'C1345', unit: '件', unitPrice: 4, customerCode: '0945', customerName: '恩伟', stock: 222, inboundQuantity: 222, inboundWeight: 0, inboundDate: '2024-01-15', batchNo: 'sn231122008-2', status: 'complete' },
  { id: '2', code: 'T1344', name: '轴承', material: '40Cr', process: '淬火', techRequirement: '', workpieceNo: 'T1344', unit: 'kg', unitPrice: 10, customerCode: '0945', customerName: '恩伟', stock: 777, inboundQuantity: 777, inboundWeight: 889, inboundDate: '2024-01-20', batchNo: 'sn231122009-1', status: 'complete' },
  { id: '3', code: 'D1211', name: '齿轮', material: '40Cr', process: '', techRequirement: '', workpieceNo: 'D1211', unit: '件', unitPrice: 5, customerCode: '0945', customerName: '恩伟', stock: 776, inboundQuantity: 776, inboundWeight: 0, inboundDate: '2024-02-01', batchNo: '', status: 'complete' },
  { id: '4', code: 'P001', name: '传动轴', material: '45#钢', process: '调质+高频淬火', techRequirement: '', workpieceNo: 'Φ50×200', unit: '件', unitPrice: 12.5, customerCode: '0945', customerName: '恩伟', stock: 150, inboundQuantity: 150, inboundWeight: 0, inboundDate: '2024-02-10', batchNo: 'sn231122010-1', status: 'complete' },
  { id: '5', code: 'P002', name: '齿轮轴', material: '40Cr', process: '渗碳淬火', techRequirement: '', workpieceNo: 'M3×Z20', unit: '件', unitPrice: 15, customerCode: '0945', customerName: '恩伟', stock: 280, inboundQuantity: 280, inboundWeight: 0, inboundDate: '2024-02-15', batchNo: 'sn231122011-1', status: 'complete' },
  { id: '6', code: 'P003', name: '轴承座', material: 'HT200', process: '氮化处理', techRequirement: '', workpieceNo: 'UCF208', unit: '件', unitPrice: 35, customerCode: '0945', customerName: '恩伟', stock: 95, inboundQuantity: 95, inboundWeight: 0, inboundDate: '2024-03-01', batchNo: 'sn231122012-1', status: 'complete' },
  { id: '7', code: 'P004', name: '连杆', material: '42CrMo', process: '调质', techRequirement: '', workpieceNo: 'L350', unit: '件', unitPrice: 25, customerCode: '0945', customerName: '恩伟', stock: 60, inboundQuantity: 60, inboundWeight: 0, inboundDate: '2024-03-05', batchNo: 'sn231122013-1', status: 'complete' },
  { id: '8', code: 'P005', name: '凸轮轴', material: '20CrMnTi', process: '渗碳+淬火', techRequirement: '', workpieceNo: 'Φ40×450', unit: '件', unitPrice: 22, customerCode: '0945', customerName: '恩伟', stock: 120, inboundQuantity: 120, inboundWeight: 0, inboundDate: '2024-03-10', batchNo: 'sn231122014-1', status: 'complete' },
  { id: '9', code: 'P006', name: '活塞销', material: '20Cr', process: '渗碳淬火', techRequirement: '', workpieceNo: 'Φ25×80', unit: '件', unitPrice: 8, customerCode: '0945', customerName: '恩伟', stock: 500, inboundQuantity: 500, inboundWeight: 0, inboundDate: '2024-03-15', batchNo: 'sn231122015-1', status: 'complete' },
  
  // 0703客户测试的产品
  { id: '10', code: 'P007', name: '螺栓', material: '40Cr', process: '调质', techRequirement: '', workpieceNo: 'M16×80', unit: '件', unitPrice: 3, customerCode: '0957', customerName: '0703客户测试', stock: 1000, inboundQuantity: 1000, inboundWeight: 0, inboundDate: '2024-04-01', batchNo: '', status: 'complete' },
  { id: '11', code: 'P008', name: '螺母', material: '35#钢', process: '淬火', techRequirement: '', workpieceNo: 'M16', unit: '件', unitPrice: 2, customerCode: '0957', customerName: '0703客户测试', stock: 2000, inboundQuantity: 2000, inboundWeight: 0, inboundDate: '2024-04-05', batchNo: '', status: 'complete' },
  
  // 其他客户的产品
  { id: '12', code: 'P009', name: '法兰盘', material: '45#钢', process: '正火', techRequirement: '', workpieceNo: 'DN100', unit: '件', unitPrice: 45, customerCode: '0879', customerName: '刘二', stock: 80, inboundQuantity: 80, inboundWeight: 0, inboundDate: '2024-04-10', batchNo: '', status: 'complete' },
  { id: '13', code: 'P010', name: '联轴器', material: '40Cr', process: '调质', techRequirement: '', workpieceNo: 'ML8', unit: '件', unitPrice: 120, customerCode: '0950', customerName: '伟力', stock: 50, inboundQuantity: 50, inboundWeight: 0, inboundDate: '2024-04-15', batchNo: '', status: 'complete' },
];

// 更新产品数据的函数
export const updateProducts = (newProducts: IProduct[]) => {
  mockProducts = newProducts;
};

// 添加产品
export const addProduct = (product: IProduct) => {
  mockProducts.push(product);
};

// 更新产品
export const updateProduct = (id: string, product: Partial<IProduct>) => {
  const index = mockProducts.findIndex(p => p.id === id);
  if (index !== -1) {
    mockProducts[index] = { ...mockProducts[index], ...product };
  }
};

// 删除产品
export const deleteProduct = (id: string) => {
  mockProducts = mockProducts.filter(p => p.id !== id);
};

// ========== 功能配置 ==========
export interface IFeatureConfig {
  id: string;
  name: string;
  code: string;
  enabled: boolean;
  description?: string;
}

// 功能开关配置
export let mockFeatureConfigs: IFeatureConfig[] = [
  { id: '1', name: '语音录入', code: 'voice_input', enabled: false, description: '支持语音方式录入入库信息' },
  { id: '2', name: '撤销功能', code: 'undo_function', enabled: true, description: '支持入库单撤销（30分钟内）' },
  { id: '3', name: '质检流程', code: 'quality_check', enabled: false, description: '入库时触发质检流程' },
  { id: '4', name: '打印模板', code: 'print_template', enabled: true, description: '支持自定义打印模板' },
];

// 更新功能配置
export const updateFeatureConfigs = (configs: IFeatureConfig[]) => {
  mockFeatureConfigs = configs;
};

// 操作日志数据
export let mockOperationLogs: IOperationLog[] = [
  {
    id: '1',
    entityType: 'product',
    entityId: '1',
    operation: 'create',
    operator: '张三',
    source: 'manual',
    createdAt: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    entityType: 'inventory_record',
    entityId: '1',
    operation: 'inbound',
    operator: '李四',
    source: 'scan',
    createdAt: '2024-01-15T14:20:00Z',
  },
];

// 添加操作日志
export const addOperationLog = (log: IOperationLog) => {
  mockOperationLogs.push(log);
};

// 清空操作日志
export const clearOperationLogs = () => {
  mockOperationLogs = [];
};
