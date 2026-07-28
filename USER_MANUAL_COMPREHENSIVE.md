ch恶心 热处理收发货管理系统 - 全面版用户使用手册

**版本**: v3.0  
**适用对象**: 收货员、发货员、财务人员、企业管理员  
**更新时间**: 2026-02-05  
**文档性质**: 基于源代码实现编写，覆盖100%功能细节

---

# 目录

1. [系统概览](#一系统概览)
2. [登录与基础操作](#二登录与基础操作)
3. [工作台 - 深度解析](#三工作台---深度解析)
4. [来货登记 - 完整操作指南](#四来货登记---完整操作指南)
5. [快速发货 - 完整操作指南](#五快速发货---完整操作指南)
6. [库存管理 - 功能详解](#六库存管理---功能详解)
7. [智能对账 - 全流程指南](#七智能对账---全流程指南)
8. [数据统计 - 报表解读](#八数据统计---报表解读)
9. [客户管理 - 操作手册](#九客户管理---操作手册)
10. [产品管理 - 操作手册](#十产品管理---操作手册)
11. [打印模板配置 - 详细说明](#十一打印模板配置---详细说明)
12. [权限管理 - 配置指南](#十二权限管理---配置指南)
13. [系统消息与反馈](#十三系统消息与反馈)
14. [故障排查完全指南](#十四故障排查完全指南)

---

# 一、系统概览

## 1.1 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                        热处理收发货管理系统                     │
├─────────────────────────────────────────────────────────────┤
│  工作台 │ 产品信息 │ 来货登记 │ 快速发货 │ 库存管理 │ 智能对账 │
├─────────────────────────────────────────────────────────────┤
│  数据统计 │ 客户管理 │ 系统设置(打印模板/页面显示/权限/手册)   │
└─────────────────────────────────────────────────────────────┘
```

## 1.2 技术架构说明

- **前端框架**: React 19 + TypeScript
- **UI组件库**: shadcn/ui + Tailwind CSS
- **状态管理**: React Context (DataContext)
- **数据存储**: 内存存储 + 本地状态管理
- **路由**: React Router DOM v6
- **表格组件**: @lark-apaas/client-toolkit/antd-table
- **消息提示**: sonner (toast)

## 1.3 核心数据模型

### 1.3.1 客户 (Customer)
| 字段 | 类型 | 必填 | 说明 |
|-----|-----|-----|-----|
| id | string | 系统自动生成 | 唯一标识 |
| code | string | 是 | 客户编号 |
| name | string | 是 | 客户名称 |
| contact | string | 否 | 联系人 |
| phone | string | 否 | 联系电话 |
| address | string | 否 | 地址 |
| transport | string | 否 | 运输方式(自提/快递/物流/空运/水运) |
| paymentTerm | string | 否 | 付款期限 |
| deliveryDirection | string | 否 | 送货方向 |
| settlement | string | 否 | 结算方式(月结/季结/年结/货到付款/预付款) |
| category | string | 否 | 客户分类(单产/量产/零售/批发) |
| status | enum | 是 | 状态(active/inactive) |
| inboundCount | number | 系统自动 | 入库次数 |
| remark | string | 否 | 备注 |

### 1.3.2 产品 (Product)
| 字段 | 类型 | 必填 | 说明 |
|-----|-----|-----|-----|
| id | string | 系统自动生成 | 唯一标识 |
| code | string | 是 | 产品编号 |
| name | string | 是 | 产品名称 |
| material | string | 否 | 材质(40Cr/45#钢/42CrMo/20CrMnTi/20Cr/35#钢/HT200) |
| process | string | 否 | 加工工艺 |
| techRequirement | string | 否 | 技术要求(富文本) |
| workpieceNo | string | 否 | 工件编号 |
| unit | string | 是 | 计价单位(件/kg/吨/套) |
| unitPrice | number | 否 | 单价(元) |
| customerCode | string | 是 | 所属客户编码 |
| customerName | string | 是 | 所属客户名称 |
| stock | number | 系统自动 | 当前库存 |
| inboundQuantity | number | 系统自动 | 累计入库数量 |
| inboundWeight | number | 系统自动 | 累计入库重量 |
| inboundDate | date | 系统自动 | 最近入库日期 |
| batchNo | string | 系统自动 | 批次号 |
| status | enum | 是 | 状态(active/inactive) |
| warningThreshold | number | 默认50 | 预警阈值 |

### 1.3.3 入库单 (Inbound Order)
| 字段 | 类型 | 说明 |
|-----|-----|-----|
| inboundNo | string | 入库单号，格式: RK + YYMMDD + 3位随机数 |
| customerId | string | 客户ID |
| customerName | string | 客户名称 |
| customerCode | string | 客户编码 |
| inboundDate | date | 入库日期 |
| inboundTime | time | 入库时间 |
| creator | string | 制单人 |
| receiver | string | 接收人 |
| transporter | string | 运输商 |
| plateNumber | string | 车牌号 |
| driver | string | 司机 |
| internalCode | string | 内部编号 |
| selfCode | string | 自编号 |
| handler | string | 经手人 |
| handleTime | datetime | 经办时间 |
| details | array | 入库明细列表 |

### 1.3.4 入库明细 (Inbound Detail)
| 字段 | 类型 | 说明 |
|-----|-----|-----|
| id | string | 明细ID |
| productId | string | 产品ID |
| productName | string | 产品名称 |
| productModel | string | 型号(工件号) |
| productSpec | string | 规格 |
| unit | string | 单位 |
| unitPrice | number | 单价 |
| quantity | number | 数量 |
| weight | number | 重量 |
| amount | number | 金额(自动计算) |
| inboundType | string | 入库类型(正常/返工/退货/其他) |
| process | string | 工艺 |
| material | string | 材质 |
| techRequirement | string | 技术要求 |
| urgent | boolean | 是否加急 |

### 1.3.5 出库单 (Outbound Order)
| 字段 | 类型 | 说明 |
|-----|-----|-----|
| outboundNo | string | 出库单号，格式: CK + YYMMDD + 3位随机数 |
| customerId | string | 客户ID |
| customerName | string | 客户名称 |
| customerCode | string | 客户编码 |
| outboundDate | date | 出库日期 |
| creator | string | 制单人 |
| receiver | string | 收货人 |
| transporter | string | 运输方(默认"自提") |
| plateNumber | string | 车牌号 |
| driver | string | 司机 |
| totalAmount | number | 总金额 |
| totalQuantity | number | 总数量 |
| totalWeight | number | 总重量 |
| status | enum | 状态(pending_reconciliation/已生成对账单) |
| details | array | 出库明细列表 |

### 1.3.6 出库明细 (Outbound Detail)
| 字段 | 类型 | 说明 |
|-----|-----|-----|
| id | string | 明细ID |
| productId | string | 产品ID |
| productName | string | 产品名称 |
| workpieceNo | string | 工件号 |
| material | string | 材质 |
| process | string | 工艺 |
| unit | string | 单位 |
| unitPrice | number | 单价 |
| quantity | number | 出库数量 |
| weight | number | 出库重量 |
| amount | number | 出库金额 |
| batchNo | string | 批次号 |
| inboundDate | date | 入库日期 |
| closeOrder | enum | 关单状态(0/关单/不关单) |

### 1.3.7 库存变动记录 (Inventory Record)
| 字段 | 类型 | 说明 |
|-----|-----|-----|
| id | string | 记录ID |
| productId | string | 产品ID |
| productName | string | 产品名称 |
| material | string | 材质 |
| process | string | 工艺 |
| workpieceNo | string | 工件号 |
| unit | string | 单位 |
| changeType | enum | 变动类型(inbound/outbound/manual_increase/manual_decrease) |
| quantityChange | number | 数量变化(正增负减) |
| weightChange | number | 重量变化 |
| beforeStock | number | 变动前库存 |
| afterStock | number | 变动后库存 |
| referenceNo | string | 关联单号 |
| customerCode | string | 客户编码 |
| customerName | string | 客户名称 |
| operator | string | 操作人 |
| remark | string | 备注 |
| createdAt | datetime | 创建时间 |

### 1.3.8 对账单 (Reconciliation)
| 字段 | 类型 | 说明 |
|-----|-----|-----|
| id | string | 对账单ID |
| reconciliationNo | string | 对账单号，格式: DZ + YYMMDD + 3位随机数 |
| customerId | string | 客户ID |
| customerName | string | 客户名称 |
| customerCode | string | 客户编码 |
| month | string | 对账月份(YYYY-MM) |
| status | enum | 状态(draft/confirmed/audited/invoiced/paid) |
| totalAmount | number | 总金额(选中出库单金额总和) |
| deductionAmount | number | 扣款金额 |
| otherAmount | number | 其他金额 |
| compensationAmount | number | 赔偿金额 |
| finalAmount | number | 最终金额(计算: 总额-扣款+其他-赔偿) |
| invoiceAmount | number | 已开票金额 |
| uninvoiceAmount | number | 未开票金额(finalAmount - invoiceAmount) |
| receiptAmount | number | 已回款金额 |
| unreceivedAmount | number | 未回款金额(finalAmount - receiptAmount) |
| outboundIds | array | 关联出库单ID列表 |
| outboundDetails | array | 出库明细列表 |
| auditInfo | object | 审核信息(审核人、审核时间) |
| invoices | array | 开票记录列表 |
| receipts | array | 回款记录列表 |

---

# 二、登录与基础操作

## 2.1 登录页面

### 2.1.1 访问地址
- 系统入口: 应用部署地址
- 无需记住密码，使用平台统一认证

### 2.1.2 登录流程
1. 打开系统首页
2. 系统自动检测登录状态
3. 未登录时跳转到登录页
4. 输入用户名和密码
5. 点击【登录】按钮

### 2.1.3 登录验证规则
- **错误提示1**: "请输入用户名和密码"（任一为空时）
- **错误提示2**: "用户名或密码错误"（验证失败时）
- **成功提示**: "欢迎回来，{用户名}！"

### 2.1.4 登录后跳转
- 成功登录后自动跳转到【工作台】
- 侧边栏显示当前用户信息

## 2.2 基础界面操作

### 2.2.1 侧边栏导航
- 左侧固定侧边栏，宽度自适应
- 鼠标悬停可展开/收起
- 当前页面高亮显示
- 底部显示用户信息和退出按钮

### 2.2.2 退出登录
1. 点击侧边栏底部用户区域
2. 点击【退出登录】
3. 系统清除会话
4. 页面刷新，返回登录页

### 2.2.3 面包屑导航
- 页面顶部显示当前位置
- 格式: 首页 > 当前页面
- 点击可返回上级

### 2.2.4 表格通用操作
所有表格页面支持：
- **搜索**: 顶部搜索框实时过滤
- **分页**: 底部分页控件
- **列排序**: 点击表头排序
- **滚动**: 列过多时横向滚动
- **导出**: 导出Excel按钮

---

# 三、工作台 - 深度解析

## 3.1 页面结构

```
┌─────────────────────────────────────────────────────┐
│  工作台 - 今日日期 (2026年2月5日 星期四)               │
├─────────────────────────────────────────────────────┤
│  [待对账] [本月收发货] [库存预警] [本月回款] [客户总数] [未回款] │
├─────────────────────────────────────────────────────┤
│  [快捷入口] 来货登记 | 快速发货 | 库存查询            │
├─────────────────────────────────────────────────────┤
│  [风险预警]                    [最近活动]             │
│  ⚠️ 超期未回款                  📦 齿轮轴 - 来货登记  │
│  📦 缺货预警                    ⚙️ 传动轴 - 快速发货  │
└─────────────────────────────────────────────────────┘
```

## 3.2 KPI统计卡片详解（6个）

### 3.2.1 待对账出库单
- **图标**: FileText (紫色)
- **数据来源**: `outboundOrders.filter(o => o.status === 'pending_reconciliation').length`
- **计算逻辑**: 统计状态为"pending_reconciliation"的出库单数量
- **点击行为**: 跳转到 /reconciliation
- **刷新频率**: 实时

### 3.2.2 本月收发货
- **图标**: Package (绿色)
- **数据来源**: `inventoryRecords.filter(r => r.createdAt.startsWith(当前年月)).length`
- **计算逻辑**: 本月(changeType为inbound或outbound)的库存变动记录总数
- **点击行为**: 无跳转
- **显示格式**: 纯数字

### 3.2.3 库存预警
- **图标**: AlertTriangle (红色)
- **数据来源**: `products.filter(p => p.stock === 0 || p.stock < p.warningThreshold).length`
- **计算逻辑**: 库存为0或低于预警阈值(默认50)的产品数量
- **点击行为**: 跳转到 /inventory
- **颜色标识**: 红色表示紧急

### 3.2.4 本月回款
- **图标**: Wallet (青色)
- **数据来源**: `reconciliations.filter(r => r.month === 当前月 && r.status === 'paid').reduce((sum, r) => sum + r.receiptAmount, 0)`
- **计算逻辑**: 本月状态为paid的对账单，回款金额总和
- **点击行为**: 跳转到 /reconciliation
- **显示格式**: ¥X.X万

### 3.2.5 客户总数
- **图标**: User (蓝色)
- **数据来源**: `customers.length`
- **计算逻辑**: 客户总数
- **点击行为**: 跳转到 /customers
- **显示格式**: 纯数字

### 3.2.6 未回款金额
- **图标**: TrendingUp (琥珀色)
- **数据来源**: `reconciliations.reduce((sum, r) => sum + r.unreceivedAmount, 0)`
- **计算逻辑**: 所有对账单的未回款金额总和
- **点击行为**: 跳转到 /reconciliation
- **显示格式**: ¥X.X万

## 3.3 快捷入口按钮

### 3.3.1 来货登记
- **样式**: 琥珀色背景大按钮
- **图标**: Inbox
- **点击**: 跳转到 /inbound
- **用途**: 快速进入来货登记流程

### 3.3.2 快速发货
- **样式**: 琥珀色背景大按钮
- **图标**: Send
- **点击**: 跳转到 /outbound
- **用途**: 快速进入发货流程

### 3.3.3 库存查询
- **样式**: 白色边框按钮
- **图标**: Package
- **点击**: 跳转到 /inventory
- **用途**: 查看实时库存

## 3.4 风险预警区域

### 3.4.1 预警类型详解

**类型1: 超期未回款 (type: overdue)**
- **触发条件**: `r.unreceivedAmount > 0 && r.status !== 'draft'`
- **严重程度判断**:
  - high: unreceivedAmount > 10000
  - medium: unreceivedAmount ≤ 10000
- **显示内容**:
  - 标题: "{客户名称} 有待回款"
  - 描述: "未回款金额 ¥{金额}"
  - 时间: "刚刚"

**类型2: 库存缺货 (type: inventory)**
- **触发条件**: `products.filter(p => p.stock === 0).length > 0`
- **严重程度**: high
- **显示内容**:
  - 标题: "{数量} 个产品缺货"
  - 描述: 前3个产品名称 + "等"
  - 示例: "齿轮轴、传动轴、轴承套等"

**类型3: 待对账提醒 (type: reconciliation)**
- **触发条件**: `pendingReconciliationCount > 0`
- **严重程度**: medium
- **显示内容**:
  - 标题: "{数量} 个出库单待对账"
  - 描述: "请及时生成对账单"

### 3.4.2 预警交互
- 点击预警项跳转到对应页面
- 预警按严重程度排序(高→中→低)
- 最多显示3条预警

## 3.5 最近活动列表

### 3.5.1 数据来源
```javascript
inventoryRecords.slice(0, 8).map(record => ({
  action: 根据changeType映射,
  product: productName,
  material,
  process,
  quantity: Math.abs(quantityChange),
  weight: weightChange ? Math.abs(weightChange) : null,
  customer: customerName,
  workpieceNo,
  time: formatTimeAgo(createdAt),
  type: 分类(inbound/outbound/adjust)
}))
```

### 3.5.2 操作类型映射
| changeType | 显示文本 | 颜色 |
|-----------|---------|-----|
| inbound | 来货登记 | 蓝色 |
| outbound | 快速发货 | 橙色 |
| manual_increase | 库存调整+ | 绿色 |
| manual_decrease | 库存调整- | 红色 |

### 3.5.3 时间格式化
- 使用 `formatTimeAgo()` 函数
- 显示相对时间: "刚刚", "2分钟前", "1小时前", "昨天"等

### 3.5.4 交互
- 点击活动项跳转到对应产品详情
- 悬停显示完整信息

---

# 四、来货登记 - 完整操作指南

## 4.1 页面流程图

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│  步骤1      │ --> │  步骤2      │ --> │  步骤3          │
│  选择客户   │     │  选择产品   │     │  填写入库单     │
└─────────────┘     └─────────────┘     └─────────────────┘
      │                    │                   │
      ▼                    ▼                   ▼
  搜索客户            搜索产品            填写信息
  点击【入库】        点击【添加】        点击【保存】
  进入步骤2           添加到明细          生成入库单
```

## 4.2 步骤指示器

页面顶部显示两步进度指示：
```
[✓ 选择客户] --> [2 填写入库信息]
```

- **步骤1完成**: 显示绿色勾选图标
- **步骤2当前**: 显示数字2，蓝色高亮，脉冲动画
- **未完成**: 灰色显示

## 4.3 步骤1：选择客户

### 4.3.1 界面布局

```
┌────────────────────────────────────────────────────────────┐
│  选择客户                                          [图标]   │
├────────────────────────────────────────────────────────────┤
│  🔍 搜索客户名称/编号/助记码                                  │
├────────────────────────────────────────────────────────────┤
│  ┌────┬────────┬───────────┬──────┬────────┬────────┐      │
│  │序号│  操作  │ 客户名称  │编号  │付款期  │运输方式│      │
│  ├────┼────────┼───────────┼──────┼────────┼────────┤      │
│  │ 1  │[入库]  │大连文火   │C0001 │30天    │物流    │      │
│  └────┴────────┴───────────┴──────┴────────┴────────┘      │
│                                    [分页控件]              │
└────────────────────────────────────────────────────────────┘
```

### 4.3.2 客户表格列详解

| 列名 | 字段 | 宽度 | 说明 |
|-----|-----|-----|-----|
| 序号 | - | 60px | 自动生成，从1开始 |
| 操作 | - | 80px | 【入库】按钮 |
| 客户名称 | name | auto | 客户全称 |
| 客户编号 | code | 100px | 客户唯一编码 |
| 付款期 | paymentTerm | 80px | 付款期限(如30天) |
| 运输方式 | transport | 100px | 运输方式 |
| 入库频次 | inboundCount | 100px | 历史入库次数 |
| 送货方向 | deliveryDirection | 100px | 送货方向 |
| 结算方式 | settlement | 100px | 结算方式 |
| 客户分类 | category | 100px | 分类(单产/量产等) |

**表格特性**:
- 横向滚动 (scroll={{ x: 1200 }})
- 分页: 默认10条/页
- 支持页码切换和页大小调整

### 4.3.3 客户搜索

**搜索框特性**:
- 占位文本: "搜索客户名称/编号/助记码"
- 左侧Search图标
- 宽度: 320px
- 实时过滤 (onChange事件)

**搜索逻辑**:
```javascript
customers.filter(c => 
  c.name.includes(搜索词) || 
  c.code.includes(搜索词)
)
```

### 4.3.4 选择客户操作

1. 在搜索框输入客户名称或编号
2. 表格实时过滤显示匹配客户
3. 点击目标行【入库】按钮
4. 系统执行:
   - 设置 `selectedCustomer = customer`
   - 设置 `currentStep = 2`
   - 显示toast: "已选择客户：{客户名称}"
5. 界面自动切换到步骤2

## 4.4 步骤2：填写入库信息

### 4.4.1 界面布局

```
┌────────────────────────────────────────────────────────────┐
│  入库单信息                                        [按钮组] │
├────────────────────────────────────────────────────────────┤
│  已选客户: 大连文火热处理有限公司 (C0001)                   │
├────────────────────────────────────────────────────────────┤
│  【添加产品】按钮                                          │
├────────────────────────────────────────────────────────────┤
│  产品明细表格:                                              │
│  ┌────┬──────────┬──────┬────┬────┬──────┬────────┐        │
│  │序号│产品名称  │单位  │单价│数量│重量  │金额    │        │
│  ├────┼──────────┼──────┼────┼────┼──────┼────────┤        │
│  │ 1  │齿轮轴    │件    │50  │100 │     │5000    │        │
│  └────┴──────────┴──────┴────┴────┴──────┴────────┘        │
├────────────────────────────────────────────────────────────┤
│  入库单信息:                                                │
│  入库日期: [日期选择器]  入库时间: [时间选择器]             │
│  制单人:   [输入框]       内部编号: [输入框]                │
│  接收人:   [输入框]       运输商:   [输入框]                │
│  车牌号:   [输入框]       司机:     [输入框]                │
│  自编号:   [输入框]       经手人:   [输入框]                │
│  经办时间: [只读显示]                                      │
├────────────────────────────────────────────────────────────┤
│  [上一步]          [打印预览]          [确认入库]          │
└────────────────────────────────────────────────────────────┘
```

### 4.4.2 已选客户信息

显示格式:
```
已选客户: {客户名称} ({客户编号})
```

**操作按钮**:
- 【上一步】: 返回步骤1，清空已选客户和产品明细
- 【添加产品】: 打开产品选择弹窗

### 4.4.3 添加产品弹窗

**弹窗结构**:
```
┌─────────────────────────────────────────────────────────┐
│  选择产品                                    [关闭] X    │
├─────────────────────────────────────────────────────────┤
│  🔍 搜索产品名称/客户名称/加工工艺                        │
├─────────────────────────────────────────────────────────┤
│  ┌────┬──────────┬────────┬────────┬──────┬───────┐     │
│  │序号│产品名称  │客户编码│客户名称│工艺  │操作   │     │
│  ├────┼──────────┼────────┼────────┼──────┼───────┤     │
│  │ 1  │齿轮轴    │C0001   │大连文火│渗碳  │[添加] │     │
│  └────┴──────────┴────────┴────────┴──────┴───────┘     │
└─────────────────────────────────────────────────────────┘
```

**产品表格列**:
| 列名 | 字段 | 宽度 | 说明 |
|-----|-----|-----|-----|
| 序号 | - | 60px | 序号 |
| 产品名称 | name | 140px | 产品名称(ellipsis) |
| 客户编码 | customerCode | 100px | 客户编码 |
| 客户名称 | customerName | 120px | 客户名称 |
| 加工工艺 | process | 120px | 工艺 |
| 材质 | material | 100px | 材质 |
| 技术要求 | techRequirement | 200px | 技术要求 |
| 工件编号 | workpieceNo | 100px | 工件号 |
| 计价单位 | unit | 90px | 单位(高亮显示) |
| 单价 | unitPrice | 80px | 单价(¥XX.XX) |
| 操作 | - | 80px | 【添加】按钮(fixed right) |

**添加产品逻辑**:
1. 点击【添加】按钮
2. 检查是否已存在: `inboundDetails.find(d => d.productId === product.id)`
3. 如存在: toast.error('该产品已添加')
4. 如不存在:
   ```javascript
   const newDetail = {
     id: Date.now().toString(),
     productId: product.id,
     productName: product.name,
     productModel: product.workpieceNo || '',
     productSpec: '',
     unit: product.unit || '件',
     unitPrice: product.unitPrice,
     quantity: 0,
     weight: 0,
     amount: 0,
     inboundType: '正常',
     process: product.process,
     material: product.material,
     techRequirement: product.techRequirement,
     urgent: false,
   }
   ```
5. 添加到明细列表
6. toast.success('产品已添加')
7. 关闭弹窗

### 4.4.4 产品明细表格详解

**表格字段**:
| 字段 | 可编辑 | 计算逻辑 |
|-----|-------|---------|
| 序号 | 否 | 自动生成 |
| 产品名称 | 否 | 从选择带入 |
| 型号 | 否 | workpieceNo |
| 规格 | 否 | productSpec |
| 单位 | 否 | unit |
| 单价 | 否 | unitPrice |
| 数量 | 是 | 输入框，默认0 |
| 重量 | 是 | 输入框，默认0 |
| 金额 | 否 | 自动计算 |
| 入库类型 | 是 | 下拉选择 |
| 加急 | 是 | 复选框 |
| 操作 | - | 【删除】按钮 |

**金额计算规则**:
```javascript
if (unit === '件') {
  amount = quantity * unitPrice;
} else {
  // kg或吨按重量计算
  amount = weight * unitPrice;
}
```

**实时计算**: 修改数量/重量/单价时自动重新计算金额

**入库类型选项**:
- 正常
- 返工
- 退货
- 其他

**加急标记**:
- 勾选后整行高亮显示
- 用于标识优先处理

**删除操作**:
- 点击【删除】图标
- 从明细列表移除
- 无需确认

### 4.4.5 入库单基本信息

**字段列表**:

| 字段名 | 类型 | 默认值 | 必填 | 说明 |
|-------|-----|-------|-----|-----|
| 入库单号 | 只读 | 自动生成 | - | RK+日期+3位随机数 |
| 入库日期 | 日期选择器 | 今天 | 是 | YYYY-MM-DD格式 |
| 入库时间 | 时间选择器 | 当前时间 | 否 | HH:MM格式 |
| 制单人 | 输入框 | "收发" | 是 | 制单人员 |
| 内部编号 | 输入框 | 空 | 否 | 内部编号 |
| 接收人 | 输入框 | 空 | 否 | 接收人 |
| 运输商 | 输入框 | 空 | 否 | 运输商名称 |
| 车牌号 | 输入框 | 空 | 否 | 运输车辆车牌 |
| 司机 | 输入框 | 空 | 否 | 司机姓名 |
| 自编号 | 输入框 | 空 | 否 | 自编号 |
| 经手人 | 输入框 | 空 | 否 | 经手人 |
| 经办时间 | 只读 | 当前时间 | - | 自动生成，不可修改 |

**表单布局**:
- 采用2列网格布局
- 标签左对齐，输入框右对齐
- 必填项无特殊标记，通过验证控制

### 4.4.6 底部操作按钮

| 按钮 | 功能 | 验证 |
|-----|-----|-----|
| 上一步 | 返回步骤1 | 无 |
| 打印预览 | 打开打印弹窗 | 无 |
| 确认入库 | 保存入库单 | 验证必填项 |

## 4.5 确认入库操作

### 4.5.1 验证逻辑

**验证1: 至少一个产品**
```javascript
if (inboundDetails.length === 0) {
  toast.error('请至少添加一个产品');
  return;
}
```

**验证2: 单位为"件"时必须填写数量**
```javascript
for (const detail of inboundDetails) {
  if (detail.unit === '件' && detail.quantity <= 0) {
    toast.error(`${detail.productName}：计价单位为"件"，必须填写入库数量`);
    return;
  }
}
```

**验证3: 单位为"kg"时必须填写重量**
```javascript
if (detail.unit === 'kg' && detail.weight <= 0) {
  toast.error(`${detail.productName}：计价单位为"kg"，必须填写入库重量`);
  return;
}
```

### 4.5.2 保存流程

1. **生成入库单号**:
   ```javascript
   const date = new Date();
   const dateStr = date.toISOString().slice(2, 10).replace(/-/g, '');
   const randomStr = Math.floor(Math.random() * 900 + 100).toString();
   const inboundNo = `RK${dateStr}${randomStr}`;
   // 示例: RK260205123
   ```

2. **更新库存**:
   ```javascript
   inboundDetails.forEach(detail => {
     increaseStock({
       productId: detail.productId,
       quantity: detail.quantity,
       weight: detail.weight,
       changeType: 'inbound',
       referenceNo: inboundNo,
       operator: creator,
       remark: `客户：${selectedCustomer?.name}，入库单：${inboundNo}`,
     });
   });
   ```

3. **库存更新逻辑**:
   - 增加产品库存: `product.stock += quantity`
   - 增加累计入库数量: `product.inboundQuantity += quantity`
   - 增加累计入库重量: `product.inboundWeight += weight`
   - 更新最近入库日期: `product.inboundDate = 当前日期`
   - 增加客户入库次数: `customer.inboundCount += 1`
   - 创建库存变动记录

4. **显示成功消息**:
   ```
   toast.success(`入库单 ${inboundNo} 保存成功，已更新库存`);
   ```

5. **打开打印弹窗**:
   - 显示打印预览
   - 用户可选择打印或关闭

### 4.5.3 打印后操作

打印弹窗提供两个选项:
- 【打印】: 调用浏览器打印API
- 【继续登记】: 关闭弹窗，toast.success('可以继续下一单入库')

## 4.6 打印功能详解

### 4.6.1 打印预览弹窗

**弹窗结构**:
```
┌────────────────────────────────────────────────────────────┐
│  打印预览                                            [关闭] │
├────────────────────────────────────────────────────────────┤
│  打印字段设置:                                              │
│  ☑️ 显示公司名称: [大连文火热处理]                          │
│  ☑️ 显示制单人:   [________]                               │
│  ☑️ 显示客户确认: [________]                               │
├────────────────────────────────────────────────────────────┤
│  预览区域:                                                  │
│  ┌────────────────────────────────────────────────────┐   │
│  │           大连文火热处理                            │   │
│  │           产品标识卡                                │   │
│  │  客户名称: 大连文火热处理有限公司                    │   │
│  │  入库日期: 2026-02-05    入库时间: 14:30            │   │
│  │  ┌────┬────────┬────┬────┬────┬────────┐           │   │
│  │  │序号│产品名称│数量│重量│单位│工艺    │           │   │
│  │  └────┴────────┴────┴────┴────┴────────┘           │   │
│  │  制单人: ______    客户确认: ______                 │   │
│  └────────────────────────────────────────────────────┘   │
├────────────────────────────────────────────────────────────┤
│              [打印]          [Excel导出]                   │
└────────────────────────────────────────────────────────────┘
```

### 4.6.2 打印预览样式

**样式规格**:
- 字体: SimSun, Songti SC, serif (宋体)
- 标题: 18px, bold, 居中
- 副标题: 16px, bold, 居中, 带下边框
- 表格: 11px, 边框1px solid #666
- 表头背景: #f0f0f0
- 签名区域: 12px, flex布局

**打印内容**:
1. 公司名称(如勾选)
2. "产品标识卡"标题
3. 客户名称
4. 入库日期/时间
5. 产品明细表格(最多8行)
6. 技术要求(如有)
7. 签名区域

### 4.6.3 打印操作

点击【打印】按钮后:
1. 获取print-preview-content元素
2. 调用window.print()
3. 浏览器弹出打印对话框
4. 用户选择打印机并确认

### 4.6.4 Excel导出

**导出按钮**: 位于打印预览弹窗底部

**导出内容**:
- 入库单基本信息
- 产品明细(全部行)
- 格式: .xlsx

**成功提示**: "Excel导出成功"

---

# 五、快速发货 - 完整操作指南

## 5.1 页面流程图

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│  步骤1      │ --> │  步骤2      │ --> │  完成           │
│  选择客户   │     │  填写出库单 │     │  打印/继续      │
└─────────────┘     └─────────────┘     └─────────────────┘
      │                    │
      ▼                    ▼
  搜索客户            选择产品(多选)
  点击【出库】        填写出库信息
  进入步骤2           确认出库
```

## 5.2 步骤指示器

```
[✓ 选择客户] --> [2 填写出库信息]
```

与来货登记相同的两步指示器。

## 5.3 步骤1：选择客户

### 5.3.1 客户列表

**表格列**:
| 列名 | 字段 | 说明 |
|-----|-----|-----|
| 序号 | - | 序号 |
| 操作 | - | 【出库】按钮 |
| 客户名称 | name | 客户名称 |
| 客户编号 | code | 客户编码 |
| 运输方式 | transport | 运输方式 |
| 付款期 | paymentTerm | 付款期 |
| 送货方向 | deliveryDirection | 送货方向 |
| 结算方式 | settlement | 结算方式 |
| 客户分类 | category | 分类 |
| 出库方式 | outboundType | 出库方式 |

### 5.3.2 选择客户

点击【出库】按钮后:
1. 设置 `selectedCustomer = customer`
2. 设置 `currentStep = 2`
3. toast.success(`已选择客户：${customer.name}`)

## 5.4 步骤2：填写出库信息

### 5.4.1 可选产品规则

系统只显示满足以下条件的产品:
```javascript
products.filter(p => 
  p.customerCode === selectedCustomer.code && 
  p.stock > 0
)
```

**即**: 该客户的产品 且 有库存

### 5.4.2 产品选择弹窗

**多选模式**:
```
┌─────────────────────────────────────────────────────────┐
│  选择产品 (多选)                               [关闭] X  │
├─────────────────────────────────────────────────────────┤
│  ☑️ 齿轮轴          库存: 100件    [选择]               │
│  ☑️ 传动轴          库存: 50件     [选择]               │
│  ☐  轴承套          库存: 80件     [选择]               │
├─────────────────────────────────────────────────────────┤
│                          [取消]      [确认添加]         │
└─────────────────────────────────────────────────────────┘
```

**每行显示**:
- 复选框 (Checkbox)
- 产品名称
- 实时库存数量
- 【选择】按钮

### 5.4.3 确认添加产品

点击【确认添加】后:

1. **生成出库明细**:
   ```javascript
   const newDetails = selectedProducts.map(product => {
     const outboundQuantity = product.stock; // 默认全部出库
     const outboundWeight = product.inboundWeight;
     const outboundAmount = product.unit === '件' 
       ? product.unitPrice * outboundQuantity 
       : product.unitPrice * outboundWeight;
     return {
       id: Date.now().toString() + product.id,
       productId: product.id,
       productName: product.name,
       workpieceNo: product.workpieceNo,
       unit: product.unit,
       unitPrice: product.unitPrice,
       outboundQuantity,
       outboundWeight,
       outboundAmount,
       batchNo: product.batchNo,
       process: product.process,
       material: product.material,
       inboundDate: product.inboundDate,
       closeOrder: '0', // 默认不关单
     };
   });
   ```

2. **添加到明细列表**:
   ```javascript
   setOutboundDetails(prev => [...prev, ...newDetails]);
   ```

3. **清空选择**:
   ```javascript
   setSelectedProducts([]);
   ```

4. **关闭弹窗**:
   ```javascript
   setProductDialogOpen(false);
   ```

5. **显示成功消息**:
   ```
   toast.success(`已添加 ${newDetails.length} 个产品`);
   ```

### 5.4.4 出库明细表格

**表格字段**:
| 字段 | 说明 |
|-----|-----|
| 序号 | 自动生成 |
| 产品名称 | productName |
| 工件号 | workpieceNo |
| 单位 | unit |
| 单价 | unitPrice |
| 出库数量 | 可编辑，默认=库存 |
| 出库重量 | 可编辑，默认=入库重量 |
| 出库金额 | 自动计算 |
| 批次号 | batchNo |
| 入库日期 | inboundDate |
| 关单 | 下拉选择 |
| 操作 | 【删除】按钮 |

**金额计算**:
```javascript
if (unit === '件') {
  outboundAmount = outboundQuantity * unitPrice;
} else {
  outboundAmount = outboundWeight * unitPrice;
}
```

### 5.4.5 关单功能详解

**关单选项**:
| 选项 | 值 | 说明 |
|-----|---|-----|
| 0 | '0' | 默认，不关单，按实际出库计算 |
| 关单 | '关单' | 标记为关单，结存清零 |
| 不关单 | '不关单' | 明确不关单，保留结存 |

**关单影响**:
- 关单后，产品库存将清零
- 适用于该批次产品全部出库完毕的场景
- 库存查询中不再显示(或显示为0)

### 5.4.6 出库单基本信息

**字段列表**:

| 字段名 | 类型 | 默认值 | 说明 |
|-------|-----|-------|-----|
| 出库单号 | 只读 | 自动生成 | CK+日期+3位随机数 |
| 出库日期 | 日期选择器 | 今天 | YYYY-MM-DD |
| 出库时间 | 时间选择器 | 当前时间 | HH:MM |
| 制单人 | 输入框 | "收发" | 制单人员 |
| 收货单位 | 输入框 | 客户名称 | 默认带出客户名 |
| 运输方 | 输入框 | "自提" | 运输方式 |
| 车牌号 | 输入框 | 空 | 车牌号 |
| 司机 | 输入框 | 空 | 司机姓名 |
| 自编号 | 输入框 | 空 | 自编号 |
| 经手人 | 输入框 | 空 | 经手人 |
| 经办时间 | 只读 | 当前时间 | 自动生成 |

### 5.4.7 底部操作按钮

| 按钮 | 功能 |
|-----|-----|
| 上一步 | 返回步骤1 |
| 添加产品 | 打开产品选择弹窗 |
| 打印预览 | 打开打印弹窗 |
| 确认出库 | 保存出库单 |

## 5.5 确认出库操作

### 5.5.1 验证逻辑

**验证1: 至少一个产品**
```javascript
if (outboundDetails.length === 0) {
  toast.error('请至少添加一个产品');
  return;
}
```

**验证2: 出库数量必须大于0**
```javascript
if (outboundDetails.some(d => d.outboundQuantity <= 0)) {
  toast.error('请填写出库数量');
  return;
}
```

**验证3: 库存充足性检查**
```javascript
const insufficientStock = outboundDetails.filter(detail => {
  const product = products.find(p => p.id === detail.productId);
  return product && detail.outboundQuantity > product.stock;
});

if (insufficientStock.length > 0) {
  const productNames = insufficientStock.map(d => {
    const product = products.find(p => p.id === d.productId);
    return `${d.productName}(库存${product?.stock || 0}，需${d.outboundQuantity})`;
  }).join('、');
  toast.error(`库存不足：${productNames}`);
  return;
}
```

### 5.5.2 保存流程

1. **生成出库单号**:
   ```javascript
   const outboundNo = `CK${dateStr}${randomStr}`;
   // 示例: CK260205456
   ```

2. **计算汇总**:
   ```javascript
   const totalAmount = outboundDetails.reduce((sum, d) => sum + d.outboundAmount, 0);
   const totalQuantity = outboundDetails.reduce((sum, d) => sum + d.outboundQuantity, 0);
   const totalWeight = outboundDetails.reduce((sum, d) => sum + d.outboundWeight, 0);
   ```

3. **构建出库单对象**:
   ```javascript
   const order = {
     outboundNo,
     customerId: selectedCustomer.id,
     customerName: selectedCustomer.name,
     customerCode: selectedCustomer.code,
     outboundDate,
     creator,
     receiver: receiver || selectedCustomer.name,
     transporter: transporter || '自提',
     plateNumber,
     driver,
     totalAmount,
     totalQuantity,
     totalWeight,
     status: 'pending_reconciliation', // 待对账状态
     details: orderDetails,
   };
   ```

4. **创建出库单**:
   ```javascript
   await addOutboundOrder(order);
   ```

5. **库存扣减逻辑**:
   - 减少产品库存: `product.stock -= quantity`
   - 如关单，库存清零
   - 创建库存变动记录(changeType: 'outbound')

6. **显示成功消息**:
   ```
   toast.success(`出库单 ${outboundNo} 保存成功，已更新库存，可前往对账页面进行对账`);
   ```

7. **打开打印弹窗**

### 5.5.3 打印预览

**打印内容差异** (vs 入库单):
- 标题: "送货单" (vs "产品标识卡")
- 显示: 出库单号、收货单位、运输方、车牌号、司机
- 表格: 增加入库批次、单价、金额列
- 合计行: 显示总数量、总重量、总金额

**样式规格**:
- 字体: 10-12px
- 表格: 10px，紧凑布局
- 支持最多8行产品

---

# 六、库存管理 - 功能详解

## 6.1 页面结构

```
┌────────────────────────────────────────────────────────────┐
│  库存管理                                          [导出]  │
├────────────────────────────────────────────────────────────┤
│  [库存品种: X] [库存数量: X] [正常: X] [预警/缺货: X]       │
├────────────────────────────────────────────────────────────┤
│  🔍 搜索: [________]  材质: [全部▼]  状态: [全部▼]          │
├────────────────────────────────────────────────────────────┤
│  ┌────┬────────┬────────┬──────┬──────┬──────┬─────┐       │
│  │编号│产品名称│工件号  │材质  │库存  │预警值│状态 │       │
│  ├────┼────────┼────────┼──────┼──────┼──────┼─────┤       │
│  │P001│齿轮轴  │GZ-001  │40Cr  │ 100  │  50  │正常 │       │
│  └────┴────────┴────────┴──────┴──────┴──────┴─────┘       │
│                                     [分页]                 │
└────────────────────────────────────────────────────────────┘
```

## 6.2 库存统计卡片详解

### 6.2.1 库存品种
- **计算**: `inventorySummary.length`
- **说明**: 产品总品种数

### 6.2.2 库存数量
- **计算**: `inventorySummary.reduce((sum, item) => sum + item.currentStock, 0)`
- **说明**: 所有产品库存数量总和

### 6.2.3 正常库存
- **计算**: `inventorySummary.filter(i => i.currentStock >= i.warningThreshold).length`
- **说明**: 库存≥预警阈值的产品数
- **颜色**: 绿色

### 6.2.4 预警/缺货
- **计算**: 
  ```javascript
  inventorySummary.filter(i => 
    i.currentStock > 0 && i.currentStock < i.warningThreshold
  ).length + 
  inventorySummary.filter(i => i.currentStock <= 0).length
  ```
- **说明**: 低于阈值或缺货的产品数
- **颜色**: 红色

## 6.3 搜索筛选功能

### 6.3.1 关键词搜索
- **搜索范围**: productName, workpieceNo
- **匹配方式**: 模糊匹配，不区分大小写

### 6.3.2 材质筛选
- **选项**: 全部, 40Cr, 45#钢, 42CrMo, 20CrMnTi, 20Cr, 35#钢, HT200
- **匹配**: 精确匹配

### 6.3.3 状态筛选
- **全部状态**: 不过滤
- **正常**: `stock >= warningThreshold`
- **预警**: `0 < stock < warningThreshold`
- **缺货**: `stock <= 0`

## 6.4 库存表格详解

### 6.4.1 表格列

| 列名 | 字段 | 说明 |
|-----|-----|-----|
| 产品编号 | productCode | 产品唯一编号 |
| 产品名称 | productName | 产品名称 |
| 工件号 | workpieceNo | 工件编号 |
| 材质 | material | 材质 |
| 工艺 | process | 加工工艺 |
| 所属客户 | customerName | 所属客户 |
| 当前库存 | currentStock | 实时库存 |
| 预警阈值 | warningThreshold | 预警阈值 |
| 状态 | - | 状态标签 |
| 操作 | - | 操作按钮组 |

### 6.4.2 状态标签样式

| 状态 | 条件 | 样式 |
|-----|-----|-----|
| 正常 | stock ≥ threshold | 绿色背景 + 勾选图标 |
| 预警 | 0 < stock < threshold | 橙色背景 + 时钟图标 |
| 缺货 | stock ≤ 0 | 红色背景 + 警告图标 |

### 6.4.3 行样式

| 状态 | 背景色 |
|-----|-------|
| 正常 | 默认(白色) |
| 预警 | bg-warning/5 (淡橙色) |
| 缺货 | bg-destructive/5 (淡红色) |

## 6.5 库存操作按钮

每行产品有三个操作按钮:

### 6.5.1 查看历史
- **图标**: HistoryIcon
- **功能**: 打开库存变动记录弹窗
- **显示**: 该产品所有变动记录

### 6.5.2 增加库存 (+)
- **图标**: PlusIcon
- **功能**: 打开增加库存弹窗

### 6.5.3 减少库存 (-)
- **图标**: MinusIcon
- **功能**: 打开减少库存弹窗

## 6.6 库存调整功能

### 6.6.1 增加库存弹窗

```
┌─────────────────────────────────────────────────────────┐
│  增加库存 - 齿轮轴                               [关闭] │
├─────────────────────────────────────────────────────────┤
│  当前库存: 100 件                                       │
│  调整数量: [________] 件                                │
│  备注:     [________________]                           │
├─────────────────────────────────────────────────────────┤
│                    [取消]    [确认增加]                 │
└─────────────────────────────────────────────────────────┘
```

**验证**:
```javascript
if (!adjustQuantity || parseInt(adjustQuantity) <= 0) {
  toast.error('请输入有效的数量');
  return;
}
```

**操作**:
```javascript
increaseStock({
  productId: selectedProduct.productId,
  quantity,
  changeType: 'manual_increase',
  operator: currentUser,
  remark: adjustRemark || '手动增加库存',
});

toast.success(`已成功增加 ${selectedProduct.productName} 库存 ${quantity} ${selectedProduct.unit}`);
```

### 6.6.2 减少库存弹窗

**额外验证**:
```javascript
if (quantity > selectedProduct.currentStock) {
  toast.error('减少数量不能大于当前库存');
  return;
}
```

**操作**:
```javascript
decreaseStock({
  productId: selectedProduct.productId,
  quantity,
  changeType: 'manual_decrease',
  operator: currentUser,
  remark: adjustRemark || '手动减少库存',
});

toast.success(`已成功减少 ${selectedProduct.productName} 库存 ${quantity} ${selectedProduct.unit}`);
```

## 6.7 库存变动记录

### 6.7.1 记录弹窗

显示该产品所有变动记录，按时间倒序。

### 6.7.2 变动类型标签

| 类型 | 显示文本 | 样式 |
|-----|---------|-----|
| inbound | 入库 | 蓝色 |
| outbound | 出库 | 橙色 |
| manual_increase | 手动增加 | 绿色 |
| manual_decrease | 手动减少 | 红色 |

### 6.7.3 记录字段

| 字段 | 说明 |
|-----|-----|
| 时间 | createdAt |
| 类型 | 变动类型 |
| 数量变化 | quantityChange |
| 变动后库存 | afterStock |
| 操作人 | operator |
| 备注 | remark |

---

# 七、智能对账 - 全流程指南

## 7.1 页面结构

```
┌────────────────────────────────────────────────────────────┐
│  智能对账                                          [Tab切换]│
├────────────────────────────────────────────────────────────┤
│  Tab1: 对账单管理  |  Tab2: 待对账出库单                    │
├────────────────────────────────────────────────────────────┤
│  [本月出库总额] [已对账金额] [未对账金额] [本月回款]        │
├────────────────────────────────────────────────────────────┤
│  🔍 搜索: [________]  状态: [全部▼]  月份: [全部▼]         │
├────────────────────────────────────────────────────────────┤
│  [+ 新增对账单]                                          │
├────────────────────────────────────────────────────────────┤
│  对账单列表...                                           │
└────────────────────────────────────────────────────────────┘
```

## 7.2 对账统计卡片

### 7.2.1 本月出库总额
- **计算**: 本月出库单totalAmount总和

### 7.2.2 已对账金额
- **计算**: 状态≠draft的对账单totalAmount总和

### 7.2.3 未对账金额
- **计算**: 待对账出库单金额总和

### 7.2.4 本月回款
- **计算**: 本月状态=paid的对账单receiptAmount总和

## 7.3 Tab切换

### 7.3.1 Tab1: 对账单管理
- 显示已创建的对账单列表
- 支持增删改查、审核、开票、回款

### 7.3.2 Tab2: 待对账出库单
- 显示状态=pending_reconciliation的出库单
- 可选择生成对账单

## 7.4 对账单状态详解

| 状态 | 值 | 颜色 | 可操作 |
|-----|---|-----|-------|
| 草稿 | draft | 灰色 | 编辑、删除、生成 |
| 已确认 | confirmed | 蓝色 | 审核 |
| 已审核 | audited | 绿色 | 反审核、开票 |
| 已开票 | invoiced | 紫色 | 回款 |
| 已回款 | paid | 青绿色 | 查看 |

**状态流转**:
```
draft → confirmed → audited → invoiced → paid
         ↑_________|
```

## 7.5 新增对账单流程

### 7.5.1 步骤1: 选择客户

**界面**:
```
┌─────────────────────────────────────────────────────────┐
│  新增对账单 - 步骤1: 选择客户                    [关闭] │
├─────────────────────────────────────────────────────────┤
│  🔍 搜索客户...                                          │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐   │
│  │ 大连文火热处理有限公司                           │   │
│  │ 编号: C0001  类别: 量产客户                      │   │
│  │                          [选择客户]              │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

**操作**:
1. 搜索客户
2. 点击【选择客户】
3. 进入步骤2

### 7.5.2 步骤2: 选择出库单

**界面**:
```
┌─────────────────────────────────────────────────────────┐
│  新增对账单 - 步骤2: 选择出库单                  [返回] │
├─────────────────────────────────────────────────────────┤
│  客户: 大连文火热处理有限公司                            │
│  对账月份: [2026-02▼]                                    │
├─────────────────────────────────────────────────────────┤
│  出库日期: 从 [____] 到 [____]                          │
│  入库日期: 从 [____] 到 [____]                          │
├─────────────────────────────────────────────────────────┤
│  ☑️ CK260205001  2026-02-05  ¥5,000                     │
│  ☐  CK260205002  2026-02-05  ¥3,000                     │
├─────────────────────────────────────────────────────────┤
│  已选择: 1 单    金额合计: ¥5,000                        │
│  扣款金额: [0]  其他金额: [0]  赔偿金额: [0]             │
│  最终金额: ¥5,000                                        │
├─────────────────────────────────────────────────────────┤
│                    [取消]        [生成对账单]           │
└─────────────────────────────────────────────────────────┘
```

**日期筛选**:
- 出库日期: 筛选outboundDate
- 入库日期: 筛选details中的inboundDate

**金额计算**:
```javascript
const totalAmount = selectedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
const finalAmount = totalAmount - deductionAmount + otherAmount - compensationAmount;
```

**生成对账单**:
1. 生成对账单号: `DZ${dateStr}${randomStr}`
2. 创建对账单对象
3. 关联出库单ID列表
4. 更新出库单状态为"已生成对账单"
5. toast.success('对账单创建成功')

## 7.6 对账单操作

### 7.6.1 编辑对账单

**条件**: 状态为draft

**可编辑字段**:
- 扣款金额
- 其他金额
- 赔偿金额

**保存后**:
- 重新计算finalAmount
- toast.success('对账单更新成功')

### 7.6.2 删除对账单

**条件**: 状态为draft

**操作**:
- 弹出确认对话框
- 确认后删除
- 恢复关联出库单状态为pending_reconciliation
- toast.success('对账单删除成功')

### 7.6.3 审核对账单

**条件**: 状态为confirmed或audited

**操作**:
1. 点击【审核】
2. 输入审核人姓名
3. 验证: 审核人不能为空
4. 更新状态为audited
5. 记录审核信息
6. toast.success('审核成功')

### 7.6.4 反审核对账单

**条件**: 状态为audited

**限制**: 已开票或已回款不能反审核

**验证**:
```javascript
if (selectedReconciliation.status === 'invoiced' || selectedReconciliation.status === 'paid') {
  toast.error('已开票或已回款的对账单不能反审核');
  return;
}
```

**操作**:
- 状态回退到confirmed
- toast.success('反审核成功')

### 7.6.5 开票记录

**条件**: 状态为audited或invoiced

**操作**:
1. 点击【开票】
2. 输入开票金额
3. 验证:
   - 金额必须>0
   - 金额不能超过uninvoiceAmount
4. 添加开票记录
5. 更新invoiceAmount和uninvoiceAmount
6. 状态变为invoiced
7. toast.success('开票记录成功')

### 7.6.6 回款记录

**条件**: 状态为invoiced或paid

**操作**:
1. 点击【回款】
2. 输入回款金额
3. 验证:
   - 金额必须>0
   - 金额不能超过unreceivedAmount
4. 添加回款记录
5. 更新receiptAmount和unreceivedAmount
6. 如receiptAmount ≥ finalAmount，状态变为paid
7. toast.success('回款记录成功')

## 7.7 打印对账单

**打印内容**:
- 公司名称
- 对账单标题
- 客户信息
- 对账期间
- 出库明细表格
- 金额汇总(总额、扣款、其他、赔偿、最终金额)
- 开票记录
- 回款记录
- 签章区域

---

# 八、数据统计 - 报表解读

## 8.1 页面结构

```
┌────────────────────────────────────────────────────────────┐
│  数据统计                                          [导出]  │
├────────────────────────────────────────────────────────────┤
│  时间范围: [本月] [上月] [本季度] [本年] [自定义]          │
├────────────────────────────────────────────────────────────┤
│  [库存概览卡片组]                                        │
├────────────────────────────────────────────────────────────┤
│  [收发货趋势图]                                          │
├────────────────────────────────────────────────────────────┤
│  [客户排行TOP10]    [产品排行TOP10]                      │
├────────────────────────────────────────────────────────────┤
│  [财务统计]                                              │
└────────────────────────────────────────────────────────────┘
```

## 8.2 时间筛选

**选项**:
- 本月(默认): 当前月份
- 上月: 上一个月
- 本季度: 当前季度
- 本年: 当前年份
- 自定义: 选择开始和结束日期

## 8.3 库存概览

### 8.3.1 统计指标

| 指标 | 计算逻辑 |
|-----|---------|
| 总库存品种 | products.length |
| 总库存数量 | sum(stock) |
| 缺货品种数 | filter(stock === 0).length |
| 预警品种数 | filter(0 < stock < threshold).length |
| 正常品种数 | filter(stock >= threshold).length |

### 8.3.2 占比图表

- 饼图显示正常/预警/缺货占比
- 悬停显示具体数量和百分比

## 8.4 收发货趋势

### 8.4.1 折线图

**X轴**: 日期(近30天)
**Y轴**: 数量
**折线**:
- 蓝色: 入库数量
- 橙色: 出库数量

### 8.4.2 统计指标

| 指标 | 计算逻辑 |
|-----|---------|
| 本月入库次数 | filter(changeType === 'inbound').length |
| 本月出库次数 | filter(changeType === 'outbound').length |
| 本月入库金额 | sum(inbound amount) |
| 本月出库金额 | sum(outbound amount) |

## 8.5 客户排行TOP10

### 8.5.1 排序规则

按出库金额降序排列，取前10。

### 8.5.2 显示字段

| 字段 | 说明 |
|-----|-----|
| 排名 | 1-10 |
| 客户名称 | customerName |
| 出库次数 | 该客户出库单数 |
| 出库金额 | totalAmount总和 |
| 占比 | 该客户金额/总金额 |

## 8.6 产品排行TOP10

### 8.6.1 排序规则

按出库数量降序排列，取前10。

### 8.6.2 显示字段

| 字段 | 说明 |
|-----|-----|
| 排名 | 1-10 |
| 产品名称 | productName |
| 出库数量 | quantity总和 |
| 出库金额 | amount总和 |
| 所属客户 | customerName |

## 8.7 财务统计

### 8.7.1 指标卡片

| 指标 | 计算逻辑 |
|-----|---------|
| 本月应收 | sum(finalAmount) |
| 本月已收 | sum(receiptAmount) |
| 累计未收 | sum(unreceivedAmount) |
| 本月开票 | sum(invoiceAmount) |

### 8.7.2 趋势图

柱状图显示:
- 每月应收金额
- 每月已收金额
- 每月未收金额

---

# 九、客户管理 - 操作手册

## 9.1 客户列表

### 9.1.1 表格列

| 列名 | 字段 | 说明 |
|-----|-----|-----|
| 客户编号 | code | 唯一编码 |
| 客户名称 | name | 客户全称 |
| 类别 | category | 单产/量产/零售/批发 |
| 联系人 | contact | 联系人姓名 |
| 电话 | phone | 联系电话 |
| 结算方式 | settlement | 月结/季结/年结/货到付款/预付款 |
| 入库次数 | inboundCount | 历史入库次数 |
| 状态 | status | active/inactive |
| 操作 | - | 查看/编辑/删除 |

### 9.1.2 搜索筛选

**搜索框**:
- 搜索范围: name, code, contact, phone
- 模糊匹配

## 9.2 新增客户

### 9.2.1 表单字段

**必填字段**:
| 字段 | 验证 |
|-----|-----|
| 客户编号 | 不能为空 |
| 客户名称 | 不能为空 |

**可选字段**:
| 字段 | 选项 |
|-----|-----|
| 类别 | 单产/量产/零售/批发 |
| 运输方式 | 自提/快递/物流/空运/水运 |
| 结算方式 | 月结/季结/年结/货到付款/预付款 |
| 联系人 | 文本 |
| 电话 | 文本 |
| 地址 | 文本 |
| 付款期限 | 文本 |
| 送货方向 | 文本 |
| 备注 | 文本 |
| 状态 | active/inactive |

### 9.2.2 保存逻辑

```javascript
const newCustomer = {
  id: Date.now().toString(),
  ...formData,
  inboundCount: 0,
};
addCustomerToData(newCustomer);
toast.success('客户创建成功');
```

## 9.3 编辑客户

**操作**:
1. 点击【编辑】按钮
2. 表单回填客户信息
3. 修改字段
4. 点击【保存】
5. toast.success('客户更新成功')

## 9.4 删除客户

**操作**:
1. 点击【删除】按钮
2. 弹出确认对话框
3. 确认后删除
4. toast.success('客户删除成功')

**注意**: 删除客户不会删除关联的产品和订单数据。

## 9.5 Excel导入

### 9.5.1 导入流程

1. 点击【导入】按钮
2. 选择Excel文件
3. 系统解析数据
4. 预览解析结果
5. 点击【确认导入】
6. 逐条导入客户数据
7. toast.success(`成功导入 ${count} 条客户数据`)

### 9.5.2 Excel格式要求

**必填列**:
- 客户编号
- 客户名称

**可选列**:
- 联系人
- 电话
- 地址
- 运输方式
- 结算方式
- 类别
- 备注

### 9.5.3 错误处理

- Excel文件数据不足: toast.error('Excel文件数据不足')
- 解析失败: toast.error('解析Excel文件失败')
- 无有效数据: toast.error('没有有效的客户数据可导入')

## 9.6 客户详情

### 9.6.1 进入方式

点击客户行或【查看】按钮，跳转到 `/customers/{id}`

### 9.6.2 详情页标签

**标签1: 基本信息**
- 显示所有客户字段
- 支持编辑保存

**标签2: 收发货记录**
- 显示该客户所有出入库记录
- 支持按时间筛选

**标签3: 对账记录**
- 显示该客户所有对账单
- 显示回款情况

---

# 十、产品管理 - 操作手册

## 10.1 产品列表

### 10.1.1 表格列

| 列名 | 字段 | 说明 |
|-----|-----|-----|
| 产品编号 | code | 唯一编码 |
| 产品名称 | name | 产品名称 |
| 材质 | material | 材质 |
| 工艺 | process | 加工工艺 |
| 单位 | unit | 计价单位 |
| 单价 | unitPrice | 单价(元) |
| 所属客户 | customerName | 所属客户 |
| 库存 | stock | 当前库存 |
| 状态 | status | active/inactive |
| 操作 | - | 查看/编辑/删除 |

### 10.1.2 搜索筛选

**搜索框**:
- 搜索范围: name, code, material, process

**客户筛选**:
- 下拉选择客户
- 筛选该客户的产品

**库存筛选**:
- 全部
- 有库存(stock > 0)
- 无库存(stock === 0)

## 10.2 新增产品

### 10.2.1 表单字段

**必填字段**:
| 字段 | 验证 |
|-----|-----|
| 产品编号 | 不能为空 |
| 产品名称 | 不能为空 |
| 所属客户 | 必须选择 |
| 计价单位 | 必须选择 |

**可选字段**:
| 字段 | 选项/类型 |
|-----|----------|
| 材质 | 40Cr/45#钢/42CrMo/20CrMnTi/20Cr/35#钢/HT200 |
| 工艺 | 文本 |
| 技术要求 | 富文本 |
| 工件号 | 文本 |
| 单价 | 数字 |
| 预警阈值 | 数字，默认50 |
| 状态 | active/inactive |

### 10.2.2 保存逻辑

```javascript
const newProduct = {
  id: Date.now().toString(),
  ...formData,
  stock: 0,
  inboundQuantity: 0,
  inboundWeight: 0,
};
addProductToData(newProduct);
toast.success('产品创建成功');
```

## 10.3 Excel导入

与客户的Excel导入类似，支持批量导入产品数据。

**成功提示**: `成功导入 ${count} 条产品数据`

## 10.4 产品详情

### 10.4.1 进入方式

点击产品行或【查看】按钮，跳转到 `/products/{id}`

### 10.4.2 详情页标签

**标签1: 基本信息**
- 显示所有产品字段
- 支持编辑保存

**标签2: 库存记录**
- 该产品所有库存变动记录
- 支持按类型筛选

---

# 十一、打印模板配置 - 详细说明

## 11.1 模板类型

系统支持3种打印模板:

| 模板 | 用途 | 模板ID |
|-----|-----|-------|
| 产品标识卡 | 入库单打印 | process-card |
| 送货单 | 出库单打印 | delivery-note |
| 对账单 | 对账单打印 | reconciliation |

## 11.2 字段配置

### 11.2.1 可用字段列表

**产品标识卡字段**:
- customerName(客户名称)
- inboundDate(入库日期)
- inboundTime(入库时间)
- productName(产品名称)
- quantity(入库数量)
- weight(入库重量)
- unit(计价单位)
- unitPrice(单价)
- amount(入库金额)
- process(加工工艺)
- material(材质)
- techRequirement(技术要求)
- workpieceNo(工件编号)
- batchNo(批次号)
- inboundType(入库类型)

**特殊字段**:
- companyName(公司名称)
- creator(制单人)
- customerConfirm(客户确认)

### 11.2.2 字段属性

每个字段可配置:
| 属性 | 说明 |
|-----|-----|
| 宽度 | 列宽度(px) |
| 对齐 | left/center/right |
| 必填 | 是否必须显示 |

## 11.3 拖拽排序

**操作**:
1. 从可用字段列表拖拽到已选字段列表
2. 在已选列表中拖拽调整顺序
3. 点击【移除】删除字段

## 11.4 纸张设置

| 设置项 | 选项 |
|-------|-----|
| 纸张大小 | A4/A5 |
| 纸张方向 | 纵向/横向 |
| 上边距 | 0-50mm |
| 下边距 | 0-50mm |
| 左边距 | 0-50mm |
| 右边距 | 0-50mm |
| 字体大小 | 10-14px |

## 11.5 实时预览

**预览功能**:
- 调整配置后实时更新预览
- 支持缩放(50%-150%)
- 显示实际打印效果

**预览操作**:
- 放大: ZoomInIcon
- 缩小: ZoomOutIcon
- 重置: RotateCcwIcon

---

# 十二、权限管理 - 配置指南

## 12.1 角色管理

### 12.1.1 预设角色

| 角色 | 说明 |
|-----|-----|
| 管理员 | 拥有所有权限 |
| 操作员 | 收发货操作权限 |
| 财务人员 | 对账和回款权限 |

### 12.1.2 角色操作

**新增角色**:
1. 输入角色名称(必填)
2. 输入角色描述
3. 勾选权限列表
4. 点击【保存】
5. toast.success('角色创建成功')

**编辑角色**:
1. 点击【编辑】
2. 修改名称/描述/权限
3. 点击【保存】
4. toast.success('角色更新成功')

**删除角色**:
1. 点击【删除】
2. 确认删除
3. toast.success('角色删除成功')

## 12.2 权限列表

| 功能模块 | 权限项 |
|---------|-------|
| 工作台 | 查看 |
| 来货登记 | 查看、新增、编辑、删除 |
| 快速发货 | 查看、新增、编辑、删除 |
| 库存管理 | 查看、调整 |
| 智能对账 | 查看、生成、编辑、删除、审核、开票、回款 |
| 数据统计 | 查看 |
| 客户管理 | 查看、新增、编辑、删除、导入 |
| 产品管理 | 查看、新增、编辑、删除、导入 |
| 系统设置 | 查看、修改 |

## 12.3 用户管理

### 12.3.1 用户操作

**新增用户**:
1. 填写用户名(必填)
2. 填写姓名(必填)
3. 选择角色(必填)
4. 选择状态(启用/禁用)
5. 点击【保存】
6. toast.success('用户创建成功')

**编辑用户**:
- 修改用户信息
- toast.success('用户更新成功')

**重置密码**:
- 点击【重置密码】
- 密码重置为: 123456
- toast.success('用户XXX的密码已重置为：123456')

**启用/禁用**:
- 点击状态切换按钮
- toast.success('用户XXX已启用/禁用')

---

# 十三、系统消息与反馈

## 13.1 消息类型

系统使用sonner toast组件显示消息，分为3种类型:

| 类型 | 图标 | 用途 |
|-----|-----|-----|
| success | ✓ | 操作成功 |
| error | ✗ | 操作失败/验证错误 |
| info | ℹ | 提示信息 |

## 13.2 消息显示位置

- 位置: 页面右上角
- 持续时间: 3秒自动消失
- 可手动关闭

## 13.3 完整消息列表

### 来货登记消息
| 消息 | 类型 | 触发条件 |
|-----|-----|---------|
| 已选择客户：{name} | success | 选择客户后 |
| 该产品已添加 | error | 重复添加产品 |
| 产品已添加 | success | 添加产品成功 |
| 请至少添加一个产品 | error | 保存时无产品 |
| {产品名}：计价单位为"件"，必须填写入库数量 | error | 数量为0但单位是件 |
| {产品名}：计价单位为"kg"，必须填写入库重量 | error | 重量为0但单位是kg |
| 入库单 {单号} 保存成功，已更新库存 | success | 保存成功 |
| 可以继续下一单入库 | success | 打印后继续 |
| Excel导出成功 | success | 导出完成 |

### 快速发货消息
| 消息 | 类型 | 触发条件 |
|-----|-----|---------|
| 已选择客户：{name} | success | 选择客户后 |
| 已添加 {n} 个产品 | success | 添加产品后 |
| 请至少添加一个产品 | error | 保存时无产品 |
| 请填写出库数量 | error | 数量为0 |
| 库存不足：{产品名}(库存X，需Y) | error | 库存不足 |
| 出库单 {单号} 保存成功，已更新库存，可前往对账页面进行对账 | success | 保存成功 |
| 可以继续下一单出库 | success | 打印后继续 |
| Excel导出成功 | success | 导出完成 |

### 库存管理消息
| 消息 | 类型 | 触发条件 |
|-----|-----|---------|
| 请输入有效的数量 | error | 调整数量为0或空 |
| 已成功增加 {产品名} 库存 {数量} {单位} | success | 增加成功 |
| 减少数量不能大于当前库存 | error | 减少数量>库存 |
| 已成功减少 {产品名} 库存 {数量} {单位} | success | 减少成功 |

### 对账消息
| 消息 | 类型 | 触发条件 |
|-----|-----|---------|
| 请选择客户 | error | 未选客户 |
| 请至少选择一个出库单 | error | 未选出库单 |
| 对账单创建成功 | success | 创建成功 |
| 对账单更新成功 | success | 更新成功 |
| 对账单删除成功 | success | 删除成功 |
| 请输入审核人姓名 | error | 审核人为空 |
| 审核成功 | success | 审核完成 |
| 已开票或已回款的对账单不能反审核 | error | 状态限制 |
| 反审核成功 | success | 反审核完成 |
| 请输入有效的开票金额 | error | 金额无效 |
| 开票金额不能超过未开票金额 {金额} | error | 超额开票 |
| 开票记录成功 | success | 开票完成 |
| 请输入有效的回款金额 | error | 金额无效 |
| 回款金额不能超过未回款金额 {金额} | error | 超额回款 |
| 回款记录成功 | success | 回款完成 |

### 客户管理消息
| 消息 | 类型 | 触发条件 |
|-----|-----|---------|
| 成功导入 {n} 条客户数据 | success | 导入完成 |
| 客户删除成功 | success | 删除完成 |
| 请输入客户名称 | error | 名称为空 |
| 客户更新成功 | success | 更新完成 |
| 客户创建成功 | success | 创建完成 |
| Excel文件数据不足 | error | 数据不足 |
| 成功解析 {n} 条客户数据 | success | 解析完成 |
| 解析Excel文件失败 | error | 解析失败 |
| 没有有效的客户数据可导入 | error | 无有效数据 |

### 产品管理消息
| 消息 | 类型 | 触发条件 |
|-----|-----|---------|
| 成功导入 {n} 条产品数据 | success | 导入完成 |
| 产品删除成功 | success | 删除完成 |
| 请输入产品名称 | error | 名称为空 |
| 请输入产品编号 | error | 编号为空 |
| 请选择计价单位 | error | 单位未选 |
| 请选择客户 | error | 客户未选 |
| 产品更新成功 | success | 更新完成 |
| 产品创建成功 | success | 创建完成 |

### 权限管理消息
| 消息 | 类型 | 触发条件 |
|-----|-----|---------|
| 请输入角色名称 | error | 名称为空 |
| 角色更新成功 | success | 更新完成 |
| 角色创建成功 | success | 创建完成 |
| 角色删除成功 | success | 删除完成 |
| 请填写完整信息 | error | 信息不完整 |
| 用户更新成功 | success | 更新完成 |
| 用户创建成功 | success | 创建完成 |
| 用户XXX的密码已重置为：123456 | success | 重置密码 |
| 用户XXX已启用/禁用 | success | 状态切换 |

### 登录消息
| 消息 | 类型 | 触发条件 |
|-----|-----|---------|
| 请输入用户名和密码 | error | 登录信息不完整 |
| 欢迎回来，{name}！ | success | 登录成功 |
| 用户名或密码错误 | error | 登录失败 |

---

# 十四、故障排查完全指南

## 14.1 页面加载问题

### 14.1.1 白屏/无法加载

**可能原因**:
1. 网络连接中断
2. 服务器异常
3. 浏览器缓存问题

**排查步骤**:
1. 检查网络连接
2. 刷新页面(F5)
3. 清除浏览器缓存(Ctrl+Shift+R)
4. 检查控制台错误信息

### 14.1.2 数据不显示

**可能原因**:
1. 数据尚未加载
2. 筛选条件过于严格
3. 权限不足

**排查步骤**:
1. 等待数据加载完成
2. 清除筛选条件
3. 检查网络请求

## 14.2 功能操作问题

### 14.2.1 按钮无响应

**排查步骤**:
1. 检查是否满足操作条件
2. 查看toast错误提示
3. 检查控制台错误

### 14.2.2 表单无法提交

**常见原因**:
1. 必填项未填写
2. 数据格式错误
3. 验证未通过

**排查步骤**:
1. 检查所有必填项
2. 检查红色错误提示
3. 根据toast提示修正

## 14.3 数据问题

### 14.3.1 数据不一致

**可能原因**:
1. 并发操作冲突
2. 数据未同步
3. 计算逻辑错误

**解决方法**:
1. 刷新页面重新加载
2. 检查相关数据源头
3. 联系管理员核查

### 14.3.2 库存数量错误

**排查步骤**:
1. 查看库存变动记录
2. 核对出入库单据
3. 使用库存调整功能修正

## 14.4 打印问题

### 14.4.1 打印无反应

**排查步骤**:
1. 检查浏览器弹窗是否被阻止
2. 检查打印机连接状态
3. 尝试使用打印预览

### 14.4.2 打印格式错乱

**可能原因**:
1. 浏览器缩放设置
2. 打印机驱动问题
3. 模板配置错误

**解决方法**:
1. 重置浏览器缩放为100%
2. 更新打印机驱动
3. 检查打印模板配置

## 14.5 Excel导入问题

### 14.5.1 导入失败

**常见错误**:
1. 文件格式不正确
2. 数据列缺失
3. 数据格式错误

**解决方法**:
1. 确保使用.xlsx格式
2. 检查必填列是否存在
3. 检查数据格式是否符合要求

### 14.5.2 部分数据导入失败

**可能原因**:
1. 数据重复
2. 必填项为空
3. 关联数据不存在

**解决方法**:
1. 检查数据唯一性
2. 补充必填项
3. 确保关联数据已存在

## 14.6 性能问题

### 14.6.1 页面卡顿

**可能原因**:
1. 数据量过大
2. 频繁重渲染
3. 内存泄漏

**解决方法**:
1. 减少列表每页显示数量
2. 使用搜索筛选减少数据量
3. 刷新页面释放内存

### 14.6.2 加载速度慢

**优化建议**:
1. 使用分页加载
2. 启用虚拟滚动
3. 优化筛选条件

## 14.7 联系支持

如以上方法无法解决问题，请联系技术支持:
- 提供问题截图
- 描述复现步骤
- 提供浏览器控制台错误信息

---

**文档版本**: v3.0  
**最后更新**: 2026-02-05  
**编写依据**: 系统源代码完全分析  
**适用范围**: 所有系统用户
