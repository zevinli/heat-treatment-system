

---

## 第44章 工作台 Dashboard 完整规格

### 44.1 页面概述

工作台是系统的首页，展示核心业务概览、待办事项、风险预警和快捷入口。

#### 页面目标

- 一目了然地展示当前业务状态
- 快速进入核心操作（来货登记、快速发货）
- 及时发现风险（超期未回款、库存积压）
- 查看最近操作记录

### 44.2 页面布局

```
工作台页面
├── 页面标题区域
│   ├── 欢迎语 + 当前日期
│   └── 快捷操作按钮（来货登记、快速发货）
├── KPI 指标卡区域（Grid 6列）
│   ├── 今日待收货
│   ├── 今日待发货
│   ├── 待对账笔数
│   ├── 本月入库金额
│   ├── 本月出库金额
│   └── 回款率
├── 中间区域（2列布局）
│   ├── 左侧：待办事项列表
│   │   ├── 待收货任务
│   │   ├── 待发货任务
│   │   └── 待对账任务
│   └── 右侧：风险预警
│       ├── 超期未回款
│       └── 库存积压预警
├── 快捷入口区域（Grid 3-4列）
│   ├── 来货登记（大按钮，琥珀色）
│   ├── 快速发货（大按钮，琥珀色）
│   ├── 库存查询
│   └── 数据统计
└── 实时动态区域
    └── 最近操作记录流水（时间轴）
```

### 44.3 KPI 指标卡

#### 数据定义

| 指标 | 数据来源 | 计算方式 | 展示形式 |
|------|---------|---------|---------|
| 今日待收货 | inbound_record | COUNT(WHERE inbound_date = TODAY AND status = 'pending') | 数字+链接 |
| 今日待发货 | outbound_record | COUNT(WHERE outbound_date = TODAY AND status = 'pending') | 数字+链接 |
| 待对账笔数 | reconciliation | COUNT(WHERE status = 'unmatched') | 数字+链接 |
| 本月入库金额 | inbound_item | SUM(amount WHERE created_at >= MONTH_START) | 金额 |
| 本月出库金额 | outbound_item | SUM(amount WHERE created_at >= MONTH_START) | 金额 |
| 回款率 | reconciliation | SUM(paid) / SUM(outbound) × 100% | 百分比 |

#### 卡片组件

```tsx
function DashboardKPI() {
  const { data: overview } = useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: () => statisticsApi.getOverview({ period: 'today' }),
    refetchInterval: 60000,  // 每分钟刷新
  });

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <KPICard
        title="今日待收货"
        value={overview?.pendingInbound || 0}
        unit="笔"
        icon={<Inbox className="w-6 h-6" />}
        onClick={() => navigate('/inbound')}
      />
      <KPICard
        title="今日待发货"
        value={overview?.pendingOutbound || 0}
        unit="笔"
        icon={<Outbox className="w-6 h-6" />}
        onClick={() => navigate('/outbound')}
      />
      <KPICard
        title="待对账"
        value={overview?.pendingReconciliation || 0}
        unit="笔"
        icon={<FileText className="w-6 h-6" />}
        onClick={() => navigate('/reconciliation')}
      />
      <KPICard
        title="本月入库"
        value={overview?.inboundAmount || 0}
        unit="元"
        format="currency"
        icon={<TrendingUp className="w-6 h-6" />}
      />
      <KPICard
        title="本月出库"
        value={overview?.outboundAmount || 0}
        unit="元"
        format="currency"
        icon={<TrendingDown className="w-6 h-6" />}
      />
      <KPICard
        title="回款率"
        value={overview?.paymentRate || 0}
        unit="%"
        format="percent"
        trend={overview?.paymentRateTrend}
        trendValue={overview?.paymentRateChange}
      />
    </div>
  );
}
```

### 44.4 待办事项

```tsx
function TodoList() {
  const { data: todos } = useQuery({
    queryKey: ['dashboard', 'todos'],
    queryFn: () => dashboardApi.getTodos(),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>待办事项</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {todos?.map((todo) => (
          <div key={todo.id} className="flex items-center gap-3 p-3 rounded-md hover:bg-muted transition-colors cursor-pointer"
            onClick={() => navigate(todo.link)}>
            <div className={cn('w-2 h-2 rounded-full',
              todo.priority === 'high' ? 'bg-error' :
              todo.priority === 'medium' ? 'bg-warning' : 'bg-info')} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{todo.title}</p>
              <p className="text-xs text-muted-foreground">{todo.description}</p>
            </div>
            <Badge variant={todo.status === 'urgent' ? 'error' : 'secondary'}>
              {todo.badge}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

### 44.5 风险预警

```tsx
function RiskAlerts() {
  const { data: alerts } = useQuery({
    queryKey: ['dashboard', 'alerts'],
    queryFn: () => dashboardApi.getRiskAlerts(),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-warning" />
          风险预警
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts?.map((alert) => (
          <div key={alert.id}
            className={cn('border-l-4 p-3 rounded-r-md',
              alert.level === 'error' ? 'border-error bg-error/5' : 'border-warning bg-warning/5')}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium">{alert.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{alert.detail}</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{alert.days}天</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

#### 预警类型

| 预警类型 | 触发条件 | 级别 | 颜色 |
|---------|---------|------|------|
| 超期未回款 | 出库后30天未回款 | error | 红色 |
| 库存积压 | 库存超过90天未变动 | warning | 琥珀色 |
| 库存不足 | 库存低于安全线 | warning | 琥珀色 |
| 待收货超期 | 预计收货日期已过 | error | 红色 |
| 对账差异 | 对账差异金额 > 0 | warning | 琥珀色 |

### 44.6 快捷入口

```tsx
function QuickActions() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <QuickActionCard
        title="来货登记"
        description="扫码/手动录入收货信息"
        icon={<Inbox className="w-8 h-8" />}
        to="/inbound"
        variant="accent"
      />
      <QuickActionCard
        title="快速发货"
        description="智能分批发货打印"
        icon={<Outbox className="w-8 h-8" />}
        to="/outbound"
        variant="accent"
      />
      <QuickActionCard
        title="库存查询"
        description="实时库存状态查看"
        icon={<Package className="w-8 h-8" />}
        to="/inventory"
        variant="default"
      />
      <QuickActionCard
        title="数据统计"
        description="业务数据分析报表"
        icon={<BarChart className="w-8 h-8" />}
        to="/statistics"
        variant="default"
      />
    </div>
  );
}

function QuickActionCard({ title, description, icon, to, variant }) {
  return (
    <Link to={to}>
      <Card className={cn('cursor-pointer transition-all hover:shadow-md hover:-translate-y-1',
        variant === 'accent' && 'border-accent/30 bg-accent/5')}>
        <CardContent className="p-6 flex flex-col items-center text-center gap-3">
          <div className={cn('p-3 rounded-full',
            variant === 'accent' ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary')}>
            {icon}
          </div>
          <div>
            <p className="font-semibold">{title}</p>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
```

### 44.7 实时动态

```tsx
function RecentActivity() {
  const { data: activities } = useQuery({
    queryKey: ['dashboard', 'activities'],
    queryFn: () => dashboardApi.getRecentActivities({ limit: 20 }),
    refetchInterval: 30000,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>最近动态</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities?.map((activity, index) => (
            <div key={activity.id} className="flex gap-3">
              {/* 时间轴线 */}
              <div className="flex flex-col items-center">
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center',
                  getActivityColor(activity.type))}>
                  {getActivityIcon(activity.type)}
                </div>
                {index < activities.length - 1 && (
                  <div className="w-0.5 flex-1 bg-border mt-2" />
                )}
              </div>
              {/* 内容 */}
              <div className="flex-1 pb-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(activity.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{activity.description}</p>
                {activity.operator && (
                  <p className="text-xs text-muted-foreground mt-1">操作人: {activity.operator}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

#### 活动类型

| 类型 | 图标 | 颜色 | 描述 |
|------|------|------|------|
| inbound | Inbox | primary | 入库操作 |
| outbound | Outbox | success | 出库操作 |
| reconciliation | FileText | info | 对账操作 |
| inventory | Package | warning | 库存调整 |
| customer | Users | primary | 客户操作 |
| system | Settings | muted | 系统操作 |

### 44.8 API 接口

```typescript
// 获取工作台概览数据
GET /api/dashboard/overview
Response: {
  pendingInbound: number;
  pendingOutbound: number;
  pendingReconciliation: number;
  inboundAmount: number;
  outboundAmount: number;
  paymentRate: number;
  paymentRateTrend: 'up' | 'down';
  paymentRateChange: number;
}

// 获取待办事项
GET /api/dashboard/todos
Response: Todo[]

// 获取风险预警
GET /api/dashboard/alerts
Response: Alert[]

// 获取最近动态
GET /api/dashboard/activities?limit=20
Response: Activity[]
```

### 44.9 数据刷新策略

| 数据 | 刷新间隔 | 刷新方式 |
|------|---------|---------|
| KPI 指标 | 60秒 | 定时轮询 |
| 待办事项 | 30秒 | 定时轮询 |
| 风险预警 | 60秒 | 定时轮询 |
| 最近动态 | 30秒 | 定时轮询 |
| 页面可见时 | 立即 | visibilitychange 事件 |

```typescript
useEffect(() => {
  const handler = () => {
    if (document.visibilityState === 'visible') {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  };
  document.addEventListener('visibilitychange', handler);
  return () => document.removeEventListener('visibilitychange', handler);
}, [queryClient]);
```
