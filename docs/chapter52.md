

---

## 第52章 组织管理模块完整规格

### 52.1 模块概述

组织管理模块处理多租户架构下的组织选择与切换，用户登录后需选择或创建组织才能进入业务系统。

#### 功能清单

| 功能 | 路由 | 说明 |
|------|------|------|
| 组织选择/创建 | `/organizations` | 登录后的落地页 |
| 组织信息展示 | Layout 顶栏 | 当前组织名称与编码 |
| 组织切换 | 弹窗 | 切换到其他组织 |
| 组织创建 | 弹窗 | 创建新组织 |

### 52.2 组织选择页

```tsx
function OrganizationPage() {
  const { user } = useAuth();
  const { data: orgs, isLoading } = useQuery({
    queryKey: ['my-organizations'],
    queryFn: () => organizationApi.getMyOrganizations(),
  });
  const [showCreate, setShowCreate] = useState(false);

  if (isLoading) return <FullPageLoader />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-6">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <Package className="w-16 h-16 mx-auto text-primary mb-4" />
          <h1 className="text-2xl font-bold text-foreground">热处理收发货管理系统</h1>
          <p className="text-muted-foreground mt-2">选择您的组织以继续</p>
        </div>

        {orgs && orgs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orgs.map(org => (
              <OrganizationCard key={org.id} org={org} />
            ))}
            <button
              onClick={() => setShowCreate(true)}
              className="flex flex-col items-center justify-center gap-3 p-6 rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors min-h-[120px]"
            >
              <Plus className="w-8 h-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">创建新组织</span>
            </button>
          </div>
        ) : (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-4">您还没有加入任何组织</p>
            <Button onClick={() => setShowCreate(true)} className="bg-primary">
              <Plus className="w-4 h-4 mr-1" /> 创建第一个组织
            </Button>
          </div>
        )}

        {showCreate && <CreateOrgDialog open={showCreate} onClose={() => setShowCreate(false)} />}
      </div>
    </div>
  );
}
```

### 52.3 组织卡片

```tsx
function OrganizationCard({ org }: { org: Organization }) {
  const navigate = useNavigate();
  const selectMutation = useMutation({
    mutationFn: () => organizationApi.select(org.code),
    onSuccess: () => {
      localStorage.setItem(STORAGE_KEYS.ORG_CODE, org.code);
      navigate('/');
    },
  });

  return (
    <button
      onClick={() => selectMutation.mutate()}
      disabled={selectMutation.isPending}
      className="flex items-start gap-4 p-5 rounded-lg border border-border bg-card hover:border-primary hover:shadow-md transition-all text-left"
    >
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Building2 className="w-6 h-6 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground truncate">{org.name}</h3>
        <p className="text-sm text-muted-foreground mt-1">编码: {org.code}</p>
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" /> {org.memberCount} 人
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" /> {formatDate(org.createdAt)}
          </span>
        </div>
      </div>
      {selectMutation.isPending ? (
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      ) : (
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      )}
    </button>
  );
}
```

### 52.4 创建组织弹窗

```tsx
function CreateOrgDialog({ open, onClose }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const createMutation = useMutation({
    mutationFn: () => organizationApi.create({ name, code }),
    onSuccess: (org) => {
      localStorage.setItem(STORAGE_KEYS.ORG_CODE, org.code);
      toast.success('组织创建成功');
      onClose();
      navigate('/');
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const generateCode = () => {
    setCode('ORG' + Date.now().toString().slice(-6));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>创建新组织</DialogTitle>
          <DialogDescription>
            创建组织后将自动获得超级管理员权限
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>组织名称 <span className="text-error">*</span></Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如：XX热处理有限公司"
              className="mt-1"
            />
          </div>

          <div>
            <Label>组织编码 <span className="text-error">*</span></Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="如：ORG001"
              />
              <Button variant="outline" onClick={generateCode} type="button">
                自动生成
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              编码用于URL前缀，创建后不可修改
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-md bg-error/10 text-sm text-error">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending || !name || !code}
          >
            {createMutation.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
            创建组织
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### 52.5 组织切换

```tsx
function OrgSwitcher() {
  const { currentOrg } = useTenant();
  const [open, setOpen] = useState(false);
  const { data: orgs } = useQuery({
    queryKey: ['my-organizations'],
    queryFn: () => organizationApi.getMyOrganizations(),
  });

  const switchMutation = useMutation({
    mutationFn: (code: string) => organizationApi.select(code),
    onSuccess: (_, code) => {
      localStorage.setItem(STORAGE_KEYS.ORG_CODE, code);
      window.location.reload();
    },
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="gap-2">
          <Building2 className="w-4 h-4" />
          <span className="max-w-[120px] truncate">{currentOrg?.name || '选择组织'}</span>
          <ChevronDown className="w-3 h-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="start">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground px-2 py-1">切换组织</p>
          {orgs?.map(org => (
            <button
              key={org.id}
              onClick={() => {
                switchMutation.mutate(org.code);
                setOpen(false);
              }}
              className={cn(
                'w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent/10 text-left',
                org.code === currentOrg?.code && 'bg-accent/10'
              )}
            >
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{org.name}</p>
                <p className="text-xs text-muted-foreground">{org.code}</p>
              </div>
              {org.code === currentOrg?.code && (
                <Check className="w-4 h-4 text-primary" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

### 52.6 租户上下文

```typescript
// useTenant hook
function useTenant() {
  const [orgCode, setOrgCode] = useState<string | null>(
    localStorage.getItem(STORAGE_KEYS.ORG_CODE)
  );
  const { data: currentOrg } = useQuery({
    queryKey: ['current-org', orgCode],
    queryFn: () => organizationApi.getCurrent(),
    enabled: !!orgCode,
  });

  const clearTenant = () => {
    localStorage.removeItem(STORAGE_KEYS.ORG_CODE);
    setOrgCode(null);
  };

  return { orgCode, currentOrg, clearTenant };
}
```

### 52.7 API 接口

```typescript
// 我的组织列表
GET /api/organizations/my
Response: Organization[]

// 当前组织信息
GET /api/organizations/current
Response: Organization & { role: string, permissions: string[] }

// 选择组织（设置租户上下文）
POST /api/organizations/:code/select
Response: { success: true }

// 创建组织
POST /api/organizations
Body: { name, code }
Response: Organization

// 组织成员列表
GET /api/organizations/:id/members
Response: { userId, userName, role, joinedAt }[]

// 邀请成员
POST /api/organizations/:id/members/invite
Body: { userId, role }
Response: { success: true }

// 移除成员
DELETE /api/organizations/:id/members/:userId
Response: { success: true }
```

### 52.8 数据隔离机制

```typescript
// 中间件：租户上下文注入
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const orgCode = req.headers['x-org-code'] as string;
    if (!orgCode) {
      throw new UnauthorizedException('缺少组织编码');
    }

    const org = await this.orgService.findByCode(orgCode);
    if (!org) {
      throw new NotFoundException('组织不存在');
    }

    req.orgContext = {
      orgId: org.id,
      orgCode: org.code,
      orgName: org.name,
    };

    next();
  }
}

// Service 层自动过滤
async findAll(orgId: string) {
  return this.db.select().from(inboundRecords)
    .where(eq(inboundRecords.orgId, orgId));
}
```
