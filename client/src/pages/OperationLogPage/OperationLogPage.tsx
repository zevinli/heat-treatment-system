import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  History,
  FilterIcon,
  Calendar,
  User,
  Package,
  FileText,
  Database,
  ArrowRightLeft,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  Archive,
  X,
  RotateCcw,
  Inbox,
  Send,
  ArrowUpFromLine,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Table } from '@lark-apaas/client-toolkit/antd-table';
import { useData, type IOperationLog } from '@/data/DataContext';
import {
  Filter,
  FilterContent,
  FilterTextContent,
  FilterTrigger,
  FilterGroup,
  FilterSelectContent,
} from '@/components/ui/filter';

// 操作类型图标映射
const operationIcons: Record<string, React.ReactNode> = {
  create: <Plus className="w-4 h-4" />,
  update: <Edit className="w-4 h-4" />,
  delete: <Trash2 className="w-4 h-4" />,
  promote: <CheckCircle2 className="w-4 h-4" />,
  cancel: <X className="w-4 h-4" />,
  archive: <Archive className="w-4 h-4" />,
  inbound: <Inbox className="w-4 h-4" />,
  outbound: <Send className="w-4 h-4" />,
};

// 操作类型中文映射
const operationLabels: Record<string, string> = {
  create: '创建',
  update: '更新',
  delete: '删除',
  promote: '转正',
  cancel: '撤销',
  archive: '归档',
  inbound: '入库',
  outbound: '出库',
};

// 实体类型中文映射
const entityTypeLabels: Record<string, string> = {
  product: '产品',
  inventory_record: '库存记录',
  outbound_order: '出库单',
  inbound_order: '入库单',
  customer: '客户',
};

// 来源类型中文映射
const sourceLabels: Record<string, string> = {
  manual: '手工录入',
  scan: '扫码',
  voice: '语音',
  ai: 'AI识别',
  excel: 'Excel导入',
  api: 'API接口',
};

const OperationLogPage: React.FC = () => {
  const navigate = useNavigate();
  const { operationLogs } = useData();
  
  // 筛选状态
  const [searchText, setSearchText] = useState<string | undefined>();
  const [entityTypeFilter, setEntityTypeFilter] = useState<string | undefined>();
  const [operationFilter, setOperationFilter] = useState<string | undefined>();
  const [sourceFilter, setSourceFilter] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<string | undefined>();
  
  // 获取操作者列表（去重）
  const operators = useMemo(() => {
    const uniqueOperators = [...new Set(operationLogs.map(log => log.operator))];
    return uniqueOperators.sort();
  }, [operationLogs]);
  
  // 筛选后的日志
  const filteredLogs = useMemo(() => {
    return operationLogs.filter((log) => {
      // 搜索文本匹配
      const matchesSearch = !searchText || 
        log.entityId.toLowerCase().includes(searchText.toLowerCase()) ||
        log.operator.toLowerCase().includes(searchText.toLowerCase());
      
      // 实体类型筛选
      const matchesEntityType = !entityTypeFilter || log.entityType === entityTypeFilter;
      
      // 操作类型筛选
      const matchesOperation = !operationFilter || log.operation === operationFilter;
      
      // 来源筛选
      const matchesSource = !sourceFilter || log.source === sourceFilter;
      
      // 日期范围筛选
      let matchesDate = true;
      if (dateRange) {
        const logDate = new Date(log.createdAt);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch (dateRange) {
          case 'today':
            matchesDate = logDate >= today;
            break;
          case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            matchesDate = logDate >= weekAgo;
            break;
          case 'month':
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            matchesDate = logDate >= monthAgo;
            break;
        }
      }
      
      return matchesSearch && matchesEntityType && matchesOperation && matchesSource && matchesDate;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [operationLogs, searchText, entityTypeFilter, operationFilter, sourceFilter, dateRange]);
  
  // 获取操作类型颜色
  const getOperationColor = (operation: string) => {
    switch (operation) {
      case 'create':
      case 'promote':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'update':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'delete':
      case 'cancel':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'archive':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'inbound':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'outbound':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };
  
  // 表格列定义
  const columns = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (value: string) => (
        <span className="text-sm font-mono">
          {new Date(value).toLocaleString('zh-CN')}
        </span>
      ),
    },
    {
      title: '操作者',
      dataIndex: 'operator',
      key: 'operator',
      width: 120,
      render: (value: string) => (
        <div className="flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-sm">{value}</span>
        </div>
      ),
    },
    {
      title: '实体类型',
      dataIndex: 'entityType',
      key: 'entityType',
      width: 120,
      render: (value: string) => (
        <div className="flex items-center gap-1.5">
          {value === 'product' && <Package className="w-3.5 h-3.5 text-muted-foreground" />}
          {value === 'customer' && <User className="w-3.5 h-3.5 text-muted-foreground" />}
          {value === 'inbound_order' && <Inbox className="w-3.5 h-3.5 text-muted-foreground" />}
          {value === 'outbound_order' && <Send className="w-3.5 h-3.5 text-muted-foreground" />}
          {value === 'inventory_record' && <Database className="w-3.5 h-3.5 text-muted-foreground" />}
          <span className="text-sm">{entityTypeLabels[value] || value}</span>
        </div>
      ),
    },
    {
      title: '实体ID',
      dataIndex: 'entityId',
      key: 'entityId',
      width: 220,
      render: (value: string, record: IOperationLog) => (
        <div className="flex items-center gap-2">
          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{value.slice(0, 8)}...</code>
          {record.entityType === 'product' && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2 text-xs"
              onClick={() => navigate(`/products/${value}`)}
            >
              查看
            </Button>
          )}
          {record.entityType === 'customer' && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2 text-xs"
              onClick={() => navigate(`/customers/${value}`)}
            >
              查看
            </Button>
          )}
        </div>
      ),
    },
    {
      title: '操作',
      dataIndex: 'operation',
      key: 'operation',
      width: 100,
      render: (value: string) => (
        <Badge 
          variant="outline" 
          className={`flex items-center gap-1 w-fit ${getOperationColor(value)}`}
        >
          {operationIcons[value] || <RotateCcw className="w-3 h-3" />}
          {operationLabels[value] || value}
        </Badge>
      ),
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 100,
      render: (value: string) => (
        <span className="text-sm text-muted-foreground">
          {sourceLabels[value] || value}
        </span>
      ),
    },
    {
      title: 'IP地址',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 120,
      render: (value?: string) => (
        <span className="text-xs text-muted-foreground font-mono">
          {value || '-'}
        </span>
      ),
    },
  ];
  
  return (
    <div className="space-y-4">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-primary" />
            操作日志
          </h1>
          <p className="text-muted-foreground mt-1">
            查看系统所有操作记录，支持按时间、类型、操作者等维度筛选
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="w-4 h-4" />
          共 {filteredLogs.length} 条记录
        </div>
      </div>
      
      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">今日操作</p>
                <p className="text-2xl font-bold">
                  {operationLogs.filter(log => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return new Date(log.createdAt) >= today;
                  }).length}
                </p>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">入库操作</p>
                <p className="text-2xl font-bold">
                  {operationLogs.filter(log => log.operation === 'inbound').length}
                </p>
              </div>
              <div className="p-2 bg-amber-100 rounded-lg">
                <Inbox className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">出库操作</p>
                <p className="text-2xl font-bold">
                  {operationLogs.filter(log => log.operation === 'outbound').length}
                </p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Send className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">异常操作</p>
                <p className="text-2xl font-bold">
                  {operationLogs.filter(log => log.operation === 'cancel' || log.operation === 'delete').length}
                </p>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <RotateCcw className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* 筛选栏 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FilterIcon className="w-4 h-4" />
            筛选条件
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FilterGroup gap="sm">
            <Filter value={searchText} onValueChange={setSearchText}>
              <FilterTrigger label="关键词" closable />
              <FilterContent>
                <FilterTextContent placeholder="搜索操作者或实体ID" />
              </FilterContent>
            </Filter>
            <Filter value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
              <FilterTrigger label="实体类型" closable />
              <FilterContent>
                <FilterSelectContent
                  options={[
                    { label: '产品', value: 'product' },
                    { label: '客户', value: 'customer' },
                    { label: '入库单', value: 'inbound_order' },
                    { label: '出库单', value: 'outbound_order' },
                    { label: '库存记录', value: 'inventory_record' },
                  ]}
                />
              </FilterContent>
            </Filter>
            <Filter value={operationFilter} onValueChange={setOperationFilter}>
              <FilterTrigger label="操作类型" closable />
              <FilterContent>
                <FilterSelectContent
                  options={[
                    { label: '创建', value: 'create' },
                    { label: '更新', value: 'update' },
                    { label: '删除', value: 'delete' },
                    { label: '入库', value: 'inbound' },
                    { label: '出库', value: 'outbound' },
                    { label: '转正', value: 'promote' },
                    { label: '撤销', value: 'cancel' },
                    { label: '归档', value: 'archive' },
                  ]}
                />
              </FilterContent>
            </Filter>
            <Filter value={sourceFilter} onValueChange={setSourceFilter}>
              <FilterTrigger label="操作来源" closable />
              <FilterContent>
                <FilterSelectContent
                  options={[
                    { label: '手工录入', value: 'manual' },
                    { label: '扫码', value: 'scan' },
                    { label: '语音', value: 'voice' },
                    { label: 'AI识别', value: 'ai' },
                    { label: 'Excel导入', value: 'excel' },
                  ]}
                />
              </FilterContent>
            </Filter>
            <Filter value={dateRange} onValueChange={setDateRange}>
              <FilterTrigger label="时间范围" closable />
              <FilterContent>
                <FilterSelectContent
                  options={[
                    { label: '今天', value: 'today' },
                    { label: '近7天', value: 'week' },
                    { label: '近30天', value: 'month' },
                  ]}
                />
              </FilterContent>
            </Filter>
            {(searchText || entityTypeFilter || operationFilter || sourceFilter || dateRange) && (
              <Button variant="ghost" size="sm" onClick={() => { setSearchText(undefined); setEntityTypeFilter(undefined); setOperationFilter(undefined); setSourceFilter(undefined); setDateRange(undefined); }}>
                <X className="w-4 h-4 mr-1" />
                重置
              </Button>
            )}
          </FilterGroup>
        </CardContent>
      </Card>
      
      {/* 日志表格 */}
      <Card>
        <CardContent className="p-0">
          <Table
            columns={columns}
            dataSource={filteredLogs}
            rowKey="id"
            pagination={{
              pageSize: 15,
              showSizeChanger: true,
              showTotal: (total: number) => `共 ${total} 条`,
            }}
            scroll={{ x: 1200 }}
            size="middle"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default OperationLogPage;
