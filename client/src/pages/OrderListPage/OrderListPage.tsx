import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Table } from '@lark-apaas/client-toolkit/antd-table';
import type { ColumnType } from '@lark-apaas/client-toolkit/antd-table';
import {
  RotateCcw,
  Eye,
  FileText,
  Package,
  Calendar,
  AlertCircle,
  Loader2,
  X,
  CheckCircle,
} from 'lucide-react';
import { useData, type IInboundOrder, type IOutboundOrder } from '@/data/DataContext';
import * as api from '@/api';
import dayjs from 'dayjs';
import {
  Filter,
  FilterContent,
  FilterTextContent,
  FilterTrigger,
  FilterGroup,
  FilterSelectContent,
} from '@/components/ui/filter';
import { StatusFilter } from '@/components/StatusFilter/StatusFilter';
import type { OrderStatusFilter } from '@shared/api.interface';
import { UNDO_WINDOW } from '@/utils/constants';
import { usePermissions } from '@/hooks/usePermission';

// 单据状态类型
interface OrderWithDetails extends IInboundOrder {
  canUndo?: boolean;
  undoReason?: string;
}

interface OutboundWithDetails extends IOutboundOrder {
  canUndo?: boolean;
  undoReason?: string;
}

const OrderListPage: React.FC = () => {
  const { hasPermission } = usePermissions();
  const canApproveUndo = hasPermission('system:permission' as any);
  const {
    inboundOrders: rawInboundOrders,
    outboundOrders: rawOutboundOrders,
    refreshInboundOrders,
    refreshOutboundOrders,
    cancelInboundOrder,
    cancelOutboundOrder,
  } = useData();

  // 防御性处理：确保数据是数组
  const inboundOrders = Array.isArray(rawInboundOrders) ? rawInboundOrders : [];
  const outboundOrders = Array.isArray(rawOutboundOrders) ? rawOutboundOrders : [];

  const [activeTab, setActiveTab] = useState('inbound');

  // 搜索和筛选 - 默认显示全部单据（包括已撤销）
  const [inboundSearch, setInboundSearch] = useState<string | undefined>();
  const [outboundSearch, setOutboundSearch] = useState<string | undefined>();
  const [inboundStatus, setInboundStatus] = useState<OrderStatusFilter>('all');
  const [outboundStatus, setOutboundStatus] = useState<OrderStatusFilter>('all');

  // 撤销相关
  const [undoDialogOpen, setUndoDialogOpen] = useState(false);
  const [undoOrder, setUndoOrder] = useState<OrderWithDetails | OutboundWithDetails | null>(null);
  const [undoReason, setUndoReason] = useState('');
  const [undoLoading, setUndoLoading] = useState(false);
  const [undoChecking, setUndoChecking] = useState(false);
  const [undoRequiresApproval, setUndoRequiresApproval] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState<api.UndoApprovalRecord[]>([]);

  // 详情弹窗
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | OutboundWithDetails | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // 初始化加载数据
  useEffect(() => {
    refreshInboundOrders();
    refreshOutboundOrders();
  }, []);

  const refreshUndoApprovals = useCallback(async () => {
    if (!canApproveUndo) return;
    try {
      setPendingApprovals(await api.getUndoApprovals());
    } catch {
      setPendingApprovals([]);
    }
  }, [canApproveUndo]);

  useEffect(() => {
    refreshUndoApprovals();
  }, [refreshUndoApprovals]);

  // 筛选入库单
  const filteredInboundOrders = React.useMemo(() => {
    return inboundOrders.filter((order) => {
      // 搜索关键词匹配
      const searchMatch =
        !inboundSearch ||
        order.inboundNo?.toLowerCase().includes(inboundSearch.toLowerCase()) ||
        order.customerName?.toLowerCase().includes(inboundSearch.toLowerCase()) ||
        order.customerCode?.toLowerCase().includes(inboundSearch.toLowerCase());

      // 状态筛选 - active 表示非撤销状态
      let statusMatch = true;
      if (inboundStatus === 'active') {
        statusMatch = order.status !== 'cancelled';
      } else if (inboundStatus === 'cancelled') {
        statusMatch = order.status === 'cancelled';
      }

      return searchMatch && statusMatch;
    });
  }, [inboundOrders, inboundSearch, inboundStatus]);

  // 清空入库单筛选
  const handleClearInboundFilters = () => {
    setInboundSearch(undefined);
    setInboundStatus('all');
  };

  // 筛选出库单
  const filteredOutboundOrders = React.useMemo(() => {
    return outboundOrders.filter((order) => {
      // 搜索关键词匹配
      const searchMatch =
        !outboundSearch ||
        order.outboundNo?.toLowerCase().includes(outboundSearch.toLowerCase()) ||
        order.customerName?.toLowerCase().includes(outboundSearch.toLowerCase()) ||
        order.customerCode?.toLowerCase().includes(outboundSearch.toLowerCase());

      // 状态筛选 - all 表示不过滤，active 表示只查正常，cancelled 表示只查已撤销
      let statusMatch = true;
      if (outboundStatus === 'active') {
        statusMatch = order.status !== 'cancelled';
      } else if (outboundStatus === 'cancelled') {
        statusMatch = order.status === 'cancelled';
      }

      return searchMatch && statusMatch;
    });
  }, [outboundOrders, outboundSearch, outboundStatus]);

  // 清空出库单筛选
  const handleClearOutboundFilters = () => {
    setOutboundSearch(undefined);
    setOutboundStatus('all');
  };

  // 仅用于控制按钮初始可见性；点击时仍由后端执行完整库存、对账和时限校验。
  const canUndoOrder = useCallback((createdAt: string, status: string): boolean => {
    return status !== 'cancelled' && Number.isFinite(new Date(createdAt).getTime());
  }, []);

  const isUndoExpired = (createdAt: string) => Date.now() - new Date(createdAt).getTime() >= UNDO_WINDOW.INBOUND;

  // 获取行样式 - 已撤销的行置灰显示
  const getInboundRowClassName = (record: IInboundOrder) => {
    return record.status === 'cancelled' ? 'bg-gray-50 opacity-60' : '';
  };

  const getOutboundRowClassName = (record: IOutboundOrder) => {
    return record.status === 'cancelled' ? 'bg-gray-50 opacity-60' : '';
  };

  // 打开撤销弹窗
  const handleUndoClick = async (order: OrderWithDetails | OutboundWithDetails, type: 'inbound' | 'outbound') => {
    setUndoChecking(true);
    try {
      // 先检查是否可以撤销
      const isInbound = type === 'inbound';
      const checkResult = isInbound
        ? await api.canUndoInbound(order.id)
        : await api.canUndoOutbound(order.id);

      if (!checkResult.canUndo) {
        if (!checkResult.reason?.includes('撤销时限')) {
          toast.error(checkResult.reason || '该单据无法撤销');
          return;
        }
        setUndoRequiresApproval(true);
      } else {
        setUndoRequiresApproval(false);
      }

      setUndoOrder({ ...order, type } as any);
      setUndoReason('');
      setUndoDialogOpen(true);
    } catch (error) {
      // 错误已在API层处理
    } finally {
      setUndoChecking(false);
    }
  };

  // 执行撤销
  const handleConfirmUndo = async () => {
    if (!undoOrder || undoReason.trim().length < 5) {
      toast.error('撤销原因至少需要5个字符');
      return;
    }

    setUndoLoading(true);
    try {
      const isInbound = 'inboundNo' in undoOrder;
      if (undoRequiresApproval) {
        await api.requestUndoApproval(isInbound ? 'inbound' : 'outbound', undoOrder.id, undoReason.trim());
        toast.success('撤销申请已提交，等待组织管理员审批');
        await refreshUndoApprovals();
      } else if (isInbound) {
        const success = await cancelInboundOrder(undoOrder.id, undoReason);
        if (!success) return;
      } else {
        await cancelOutboundOrder(undoOrder.id, undoReason);
      }
      setUndoDialogOpen(false);
      setUndoOrder(null);
      setUndoReason('');
      setUndoRequiresApproval(false);
    } catch (error) {
      // 错误已在API层处理
    } finally {
      setUndoLoading(false);
    }
  };

  const decideApproval = async (approval: api.UndoApprovalRecord, approved: boolean) => {
    const rejectReason = approved ? undefined : window.prompt('请输入拒绝原因（至少2个字符）')?.trim();
    if (!approved && (!rejectReason || rejectReason.length < 2)) return;
    if (approved && !window.confirm('批准后将立即撤销单据并回滚库存，确定继续吗？')) return;
    try {
      await api.decideUndoApproval(approval.id, approved, rejectReason);
      toast.success(approved ? '已批准并完成撤销' : '已拒绝申请');
      await Promise.all([refreshInboundOrders(), refreshOutboundOrders(), refreshUndoApprovals()]);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || '处理审批失败');
    }
  };

  // 查看详情
  const handleViewDetail = async (order: OrderWithDetails | OutboundWithDetails, type: 'inbound' | 'outbound') => {
    setDetailLoading(true);
    setDetailDialogOpen(true);
    try {
      if (type === 'inbound') {
        const detail = await api.getInboundOrderById(order.id);
        setSelectedOrder({ ...order, ...detail });
      } else {
        const detail = await api.getOutboundOrderById(order.id);
        setSelectedOrder({ ...order, ...detail });
      }
    } catch (error) {
      toast.error('获取单据详情失败');
      setSelectedOrder(order);
    } finally {
      setDetailLoading(false);
    }
  };

  // 入库单表格列
  const inboundColumns: ColumnType<IInboundOrder>[] = [
    {
      title: '入库单号',
      dataIndex: 'inboundNo',
      key: 'inboundNo',
      width: 140,
      render: (text: string) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <span className="font-medium">{text}</span>
        </div>
      ),
    },
    {
      title: '客户',
      dataIndex: 'customerName',
      key: 'customerName',
      render: (text: string, record: IInboundOrder) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-muted-foreground">{record.customerCode}</div>
        </div>
      ),
    },
    {
      title: '入库日期',
      dataIndex: 'inboundDate',
      key: 'inboundDate',
      width: 120,
      render: (date: string) => (
        <div className="flex items-center gap-1 text-sm">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          {date ? dayjs(date).format('YYYY-MM-DD') : '-'}
        </div>
      ),
    },
    {
      title: '数量/重量',
      key: 'quantity',
      width: 120,
      render: (_: any, record: IInboundOrder) => (
        <div className="text-sm">
          <div>{record.totalQuantity} 件</div>
          <div className="text-muted-foreground">{record.totalWeight} kg</div>
        </div>
      ),
    },
    {
      title: '金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 100,
      render: (amount: number) => (
        <span className="font-medium">¥{amount?.toFixed(2) || '0.00'}</span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string, record: IInboundOrder) => {
        if (status === 'cancelled') {
          return <Badge variant="destructive">已撤销</Badge>;
        }
        const undoable = canUndoOrder(record.createdAt, status);
        return undoable ? (
          <Badge variant="default" className="bg-green-500">正常</Badge>
        ) : (
          <Badge variant="secondary">已锁定</Badge>
        );
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_: any, record: IInboundOrder) => {
        const undoable = canUndoOrder(record.createdAt, record.status);
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewDetail(record as OrderWithDetails, 'inbound')}
            >
              <Eye className="h-4 w-4 mr-1" />
              查看
            </Button>
            {undoable && record.status !== 'cancelled' && (
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-600"
                onClick={() => handleUndoClick(record as OrderWithDetails, 'inbound')}
                disabled={undoChecking}
              >
                <RotateCcw className={`h-4 w-4 mr-1 ${undoChecking ? 'animate-spin' : ''}`} />
                {isUndoExpired(record.createdAt) ? '申请撤销' : '撤销'}
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  // 出库单表格列
  const outboundColumns: ColumnType<IOutboundOrder>[] = [
    {
      title: '出库单号',
      dataIndex: 'outboundNo',
      key: 'outboundNo',
      width: 140,
      render: (text: string) => (
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-amber-500" />
          <span className="font-medium">{text}</span>
        </div>
      ),
    },
    {
      title: '客户',
      dataIndex: 'customerName',
      key: 'customerName',
      render: (text: string, record: IOutboundOrder) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-muted-foreground">{record.customerCode}</div>
        </div>
      ),
    },
    {
      title: '出库日期',
      dataIndex: 'outboundDate',
      key: 'outboundDate',
      width: 120,
      render: (date: string) => (
        <div className="flex items-center gap-1 text-sm">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          {date ? dayjs(date).format('YYYY-MM-DD') : '-'}
        </div>
      ),
    },
    {
      title: '数量/重量',
      key: 'quantity',
      width: 120,
      render: (_: any, record: IOutboundOrder) => (
        <div className="text-sm">
          <div>{record.totalQuantity} 件</div>
          <div className="text-muted-foreground">{record.totalWeight} kg</div>
        </div>
      ),
    },
    {
      title: '金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 100,
      render: (amount: number) => (
        <span className="font-medium">¥{amount?.toFixed(2) || '0.00'}</span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
          pending_reconciliation: { label: '待对账', variant: 'default' },
          reconciled: { label: '已对账', variant: 'secondary' },
          invoiced: { label: '已开票', variant: 'outline' },
          partial_paid: { label: '部分回款', variant: 'outline' },
          paid: { label: '已回款', variant: 'secondary' },
          cancelled: { label: '已撤销', variant: 'destructive' },
        };
        const config = statusMap[status] || { label: status, variant: 'default' };
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_: any, record: IOutboundOrder) => {
        const undoable = canUndoOrder(record.createdAt, record.status) && record.status === 'pending_reconciliation';
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewDetail(record as OutboundWithDetails, 'outbound')}
            >
              <Eye className="h-4 w-4 mr-1" />
              查看
            </Button>
            {undoable && (
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-600"
                onClick={() => handleUndoClick(record as OutboundWithDetails, 'outbound')}
                disabled={undoChecking}
              >
                <RotateCcw className={`h-4 w-4 mr-1 ${undoChecking ? 'animate-spin' : ''}`} />
                {isUndoExpired(record.createdAt) ? '申请撤销' : '撤销'}
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">单据管理</h1>
          <p className="text-muted-foreground mt-1">查看和管理所有入库单、出库单，支持撤销操作</p>
        </div>
      </div>

      {canApproveUndo && pendingApprovals.length > 0 && (
        <Card className="border-warning/40">
          <CardHeader><CardTitle className="text-lg">待审批撤销申请（{pendingApprovals.length}）</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {pendingApprovals.map(approval => (
              <div key={approval.id} className="flex flex-col md:flex-row md:items-center gap-3 rounded-lg border p-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{approval.type === 'inbound_undo' ? '入库单' : '出库单'}撤销</div>
                  <div className="text-sm text-muted-foreground break-all">单据ID：{approval.entityId} · 原因：{approval.reason} · {dayjs(approval.requestedAt).format('YYYY-MM-DD HH:mm')}</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => decideApproval(approval, true)}><CheckCircle className="h-4 w-4 mr-1" />批准并撤销</Button>
                  <Button size="sm" variant="outline" onClick={() => decideApproval(approval, false)}><X className="h-4 w-4 mr-1" />拒绝</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="inbound">
            <FileText className="h-4 w-4 mr-2" />
            入库单 ({filteredInboundOrders.length})
          </TabsTrigger>
          <TabsTrigger value="outbound">
            <Package className="h-4 w-4 mr-2" />
            出库单 ({filteredOutboundOrders.length})
          </TabsTrigger>
        </TabsList>

        {/* 入库单列表 */}
        <TabsContent value="inbound" className="space-y-4">
          {/* 统计信息 */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-blue-50/50">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">全部</div>
                <div className="text-2xl font-bold">{filteredInboundOrders.length}</div>
              </CardContent>
            </Card>
            <Card className="bg-green-50/50">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">正常</div>
                <div className="text-2xl font-bold text-green-600">
                  {filteredInboundOrders.filter(o => o.status !== 'cancelled').length}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-red-50/50">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">已撤销</div>
                <div className="text-2xl font-bold text-red-600">
                  {filteredInboundOrders.filter(o => o.status === 'cancelled').length}
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  入库单列表
                </CardTitle>
                <div className="flex items-center gap-2">
                  <FilterGroup gap="sm">
                    <Filter value={inboundSearch} onValueChange={setInboundSearch}>
                      <FilterTrigger label="关键词" closable />
                      <FilterContent>
                        <FilterTextContent placeholder="搜索单号、客户..." />
                      </FilterContent>
                    </Filter>
                    <Filter value={inboundStatus} onValueChange={(v) => setInboundStatus(v as OrderStatusFilter)}>
                      <FilterTrigger label="状态" closable />
                      <FilterContent>
                        <FilterSelectContent
                          options={[
                            { label: '全部', value: 'all' },
                            { label: '正常', value: 'active' },
                            { label: '已撤销', value: 'cancelled' },
                          ]}
                        />
                      </FilterContent>
                    </Filter>
                    {(inboundSearch || (inboundStatus && inboundStatus !== 'all')) && (
                      <Button variant="ghost" size="sm" onClick={handleClearInboundFilters}>
                        <X className="w-4 h-4 mr-1" />
                        重置
                      </Button>
                    )}
                  </FilterGroup>
                  <Button variant="outline" size="sm" onClick={refreshInboundOrders}>
                    刷新
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table
                columns={inboundColumns}
                dataSource={filteredInboundOrders}
                rowKey="id"
                scroll={{ x: 1100 }}
                rowClassName={getInboundRowClassName}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => `共 ${total} 条`,
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* 出库单列表 */}
        <TabsContent value="outbound" className="space-y-4">
          {/* 统计信息 */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-blue-50/50">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">全部</div>
                <div className="text-2xl font-bold">{filteredOutboundOrders.length}</div>
              </CardContent>
            </Card>
            <Card className="bg-green-50/50">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">正常</div>
                <div className="text-2xl font-bold text-green-600">
                  {filteredOutboundOrders.filter(o => o.status !== 'cancelled').length}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-red-50/50">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">已撤销</div>
                <div className="text-2xl font-bold text-red-600">
                  {filteredOutboundOrders.filter(o => o.status === 'cancelled').length}
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5 text-amber-500" />
                  出库单列表
                </CardTitle>
                <div className="flex items-center gap-2">
                  <FilterGroup gap="sm">
                    <Filter value={outboundSearch} onValueChange={setOutboundSearch}>
                      <FilterTrigger label="关键词" closable />
                      <FilterContent>
                        <FilterTextContent placeholder="搜索单号、客户..." />
                      </FilterContent>
                    </Filter>
                    <Filter value={outboundStatus} onValueChange={(v) => setOutboundStatus(v as OrderStatusFilter)}>
                      <FilterTrigger label="状态" closable />
                      <FilterContent>
                        <FilterSelectContent
                          options={[
                            { label: '全部', value: 'all' },
                            { label: '正常', value: 'active' },
                            { label: '已撤销', value: 'cancelled' },
                          ]}
                        />
                      </FilterContent>
                    </Filter>
                    {(outboundSearch || (outboundStatus && outboundStatus !== 'all')) && (
                      <Button variant="ghost" size="sm" onClick={handleClearOutboundFilters}>
                        <X className="w-4 h-4 mr-1" />
                        重置
                      </Button>
                    )}
                  </FilterGroup>
                  <Button variant="outline" size="sm" onClick={refreshOutboundOrders}>
                    刷新
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table
                columns={outboundColumns}
                dataSource={filteredOutboundOrders}
                rowKey="id"
                scroll={{ x: 1100 }}
                rowClassName={getOutboundRowClassName}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => `共 ${total} 条`,
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 撤销确认弹窗 */}
      <Dialog open={undoDialogOpen} onOpenChange={setUndoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              {undoRequiresApproval ? '提交撤销审批' : '确认撤销单据'}
            </DialogTitle>
            <DialogDescription>
              {undoRequiresApproval
                ? '该单据已超过30分钟，需由组织管理员批准后才会撤销并回滚库存。'
                : '此操作将撤销该单据并回滚库存，创建后30分钟内可直接撤销。'}
              {'inboundNo' in (undoOrder || {}) ? '入库单' : '出库单'}号：
              <span className="font-medium">
                {(undoOrder as any)?.inboundNo || (undoOrder as any)?.outboundNo}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">撤销原因 *</label>
              <Input
                placeholder="请输入撤销原因（至少5个字符）"
                value={undoReason}
                onChange={(e) => setUndoReason(e.target.value)}
              />
            </div>
            <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 text-sm text-foreground">
              <p className="font-medium mb-1">{undoRequiresApproval ? '审批通过后影响：' : '撤销后影响：'}</p>
              <ul className="list-disc list-inside space-y-1">
                <li>单据状态将变为&quot;已撤销&quot;</li>
                <li>{'inboundNo' in (undoOrder || {}) ? '入库产品将从库存中扣除' : '出库产品将恢复至库存'}</li>
                <li>关联的对账数据将同步更新</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUndoDialogOpen(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmUndo}
              disabled={undoReason.trim().length < 5 || undoLoading}
            >
              {undoLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {undoRequiresApproval ? '提交审批' : '确认撤销'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 详情弹窗 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              {'inboundNo' in (selectedOrder || {}) ? '入库单详情' : '出库单详情'}
            </DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">加载中...</span>
            </div>
          ) : selectedOrder && (
            <div className="space-y-4">
              {/* 基本信息 */}
              <div className="grid grid-cols-2 gap-4 bg-muted/50 p-4 rounded-lg">
                <div>
                  <div className="text-sm text-muted-foreground">单号</div>
                  <div className="font-medium">
                    {(selectedOrder as any).inboundNo || (selectedOrder as any).outboundNo}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">客户</div>
                  <div className="font-medium">{selectedOrder.customerName}</div>
                  <div className="text-xs text-muted-foreground">{selectedOrder.customerCode}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">
                    {'inboundNo' in selectedOrder ? '入库日期' : '出库日期'}
                  </div>
                  <div className="font-medium">
                    {dayjs((selectedOrder as any).inboundDate || (selectedOrder as any).outboundDate).format('YYYY-MM-DD')}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">创建人</div>
                  <div className="font-medium">{selectedOrder.creator}</div>
                </div>
              </div>

              {/* 明细列表 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">产品明细</h4>
                  <Badge variant="secondary">
                    共 {selectedOrder.details?.length || 0} 个产品
                  </Badge>
                </div>
                {selectedOrder.details && selectedOrder.details.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="p-3 text-left font-medium">序号</th>
                          <th className="p-3 text-left font-medium">产品名称</th>
                          <th className="p-3 text-left font-medium">型号/规格</th>
                          <th className="p-3 text-left font-medium">材质</th>
                          <th className="p-3 text-left font-medium">工艺</th>
                          <th className="p-3 text-right font-medium">数量</th>
                          <th className="p-3 text-right font-medium">重量(kg)</th>
                          <th className="p-3 text-right font-medium">单价</th>
                          <th className="p-3 text-right font-medium">金额</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.details.map((detail: any, index: number) => (
                          <tr key={index} className="border-t hover:bg-muted/30">
                            <td className="p-3 text-muted-foreground">{index + 1}</td>
                            <td className="p-3 font-medium">{detail.productName}</td>
                            <td className="p-3 text-muted-foreground">
                              {detail.productModel || detail.productSpec || detail.workpieceNo || '-'}
                            </td>
                            <td className="p-3 text-muted-foreground">{detail.material || '-'}</td>
                            <td className="p-3 text-muted-foreground">{detail.process || '-'}</td>
                            <td className="p-3 text-right">{detail.quantity} {detail.unit || '件'}</td>
                            <td className="p-3 text-right">{detail.weight?.toFixed(2)}</td>
                            <td className="p-3 text-right">¥{detail.unitPrice?.toFixed(2) || '0.00'}</td>
                            <td className="p-3 text-right font-medium">¥{detail.amount?.toFixed(2) || '0.00'}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-muted/50 font-medium border-t-2">
                        <tr>
                          <td className="p-3" colSpan={5}>合计</td>
                          <td className="p-3 text-right">{selectedOrder.totalQuantity} 件</td>
                          <td className="p-3 text-right">{selectedOrder.totalWeight?.toFixed(2)} kg</td>
                          <td className="p-3"></td>
                          <td className="p-3 text-right text-primary">¥{selectedOrder.totalAmount?.toFixed(2)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
                    暂无明细数据
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderListPage;
