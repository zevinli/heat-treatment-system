

---

## 第58章 权限管理页面完整规格

### 58.1 模块概述

权限管理页面提供 RBAC 角色权限的可视化管理界面，超级管理员可以查看、创建、修改角色和权限配置。

#### 功能清单

| 功能 | 路由 | 说明 |
|------|------|------|
| 角色列表 | `/settings/permissions` | 查看所有角色 |
| 创建角色 | 弹窗 | 新建自定义角色 |
| 编辑角色 | 弹窗 | 修改角色名称和描述 |
| 权限分配 | 编辑器内 | 为角色分配权限点 |
| 成员管理 | 编辑器内 | 查看/添加/移除角色成员 |
| 模拟角色 | 列表操作 | 以指定角色身份预览系统 |

### 58.2 角色列表页

```tsx
function PermissionPage() {
  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rbacApi.getRoles(),
  });
  const [editingRole, setEditingRole] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">权限管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            管理角色权限和成员分配
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-1" /> 创建角色
        </Button>
      </div>

      {/* 角色列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles?.map(role => (
          <RoleCard
            key={role.id}
            role={role}
            onEdit={() => setEditingRole(role)}
            onMock={() => handleMockRole(role)}
          />
        ))}
      </div>

      {/* 创建角色弹窗 */}
      {showCreate && (
        <RoleFormDialog
          open={showCreate}
          onClose={() => setShowCreate(false)}
        />
      )}

      {/* 编辑角色弹窗 */}
      {editingRole && (
        <RoleEditDialog
          role={editingRole}
          open={!!editingRole}
          onClose={() => setEditingRole(null)}
        />
      )}
    </div>
  );
}
```

### 58.3 角色卡片

```tsx
function RoleCard({ role, onEdit, onMock }) {
  const isSystem = role.type === 'system';
  const memberCount = role.memberCount || 0;
  const permissionCount = role.permissions?.length || 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {role.name}
              {isSystem && <Badge variant="secondary">系统</Badge>}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{role.description}</p>
          </div>
          <Badge variant={role.enabled ? 'success' : 'secondary'}>
            {role.enabled ? '启用' : '禁用'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" /> {memberCount} 人
          </span>
          <span className="flex items-center gap-1">
            <Shield className="w-4 h-4" /> {permissionCount} 权限
          </span>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onEdit} className="flex-1">
            <Edit className="w-3 h-3 mr-1" /> 编辑
          </Button>
          <Button size="sm" variant="ghost" onClick={onMock}>
            <Eye className="w-3 h-3 mr-1" /> 模拟
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 58.4 角色编辑器

```tsx
function RoleEditDialog({ role, open, onClose }) {
  const [activeTab, setActiveTab] = useState('permissions');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>编辑角色 — {role.name}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="permissions">权限分配</TabsTrigger>
            <TabsTrigger value="members">成员管理</TabsTrigger>
            <TabsTrigger value="info">基本信息</TabsTrigger>
          </TabsList>

          <TabsContent value="permissions">
            <PermissionEditor role={role} />
          </TabsContent>
          <TabsContent value="members">
            <MemberManager role={role} />
          </TabsContent>
          <TabsContent value="info">
            <RoleInfoEditor role={role} />
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>关闭</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### 58.5 权限分配编辑器

```tsx
function PermissionEditor({ role }) {
  const { data: permissionTree } = useQuery({
    queryKey: ['permissions', 'tree'],
    queryFn: () => rbacApi.getPermissionTree(),
  });

  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set(role.permissions?.map(p => p.id) || [])
  );

  const togglePermission = (permId: string) => {
    const next = new Set(selectedPermissions);
    if (next.has(permId)) {
      next.delete(permId);
    } else {
      next.add(permId);
    }
    setSelectedPermissions(next);
  };

  const toggleGroup = (group) => {
    const allSelected = group.permissions.every(p => selectedPermissions.has(p.id));
    const next = new Set(selectedPermissions);
    group.permissions.forEach(p => {
      if (allSelected) next.delete(p.id);
      else next.add(p.id);
    });
    setSelectedPermissions(next);
  };

  const saveMutation = useMutation({
    mutationFn: () => rbacApi.updateRolePermissions(role.id, Array.from(selectedPermissions)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('权限更新成功');
    },
  });

  return (
    <div className="space-y-3 max-h-[60vh] overflow-y-auto py-2">
      {permissionTree?.map(group => {
        const allSelected = group.permissions.every(p => selectedPermissions.has(p.id));
        const someSelected = group.permissions.some(p => selectedPermissions.has(p.id));

        return (
          <div key={group.id} className="border border-border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Checkbox
                checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                onCheckedChange={() => toggleGroup(group)}
              />
              <span className="font-medium">{group.name}</span>
              <span className="text-xs text-muted-foreground">
                ({group.permissions.filter(p => selectedPermissions.has(p.id)).length}/{group.permissions.length})
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 ml-6">
              {group.permissions.map(perm => (
                <label key={perm.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={selectedPermissions.has(perm.id)}
                    onCheckedChange={() => togglePermission(perm.id)}
                  />
                  <span>{perm.name}</span>
                </label>
              ))}
            </div>
          </div>
        );
      })}

      <div className="sticky bottom-0 bg-background pt-3 border-t">
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          保存权限配置
        </Button>
      </div>
    </div>
  );
}
```

### 58.6 权限点定义

```typescript
const PERMISSION_TREE = [
  {
    id: 'inbound',
    name: '来货登记',
    permissions: [
      { id: 'inbound:view', name: '查看入库列表' },
      { id: 'inbound:create', name: '创建入库记录' },
      { id: 'inbound:edit', name: '编辑入库记录' },
      { id: 'inbound:delete', name: '删除入库记录' },
      { id: 'inbound:print', name: '打印标识卡' },
      { id: 'inbound:import', name: 'Excel导入' },
    ],
  },
  {
    id: 'outbound',
    name: '快速发货',
    permissions: [
      { id: 'outbound:view', name: '查看发货列表' },
      { id: 'outbound:create', name: '创建发货记录' },
      { id: 'outbound:edit', name: '编辑发货记录' },
      { id: 'outbound:delete', name: '删除发货记录' },
      { id: 'outbound:print', name: '打印送货单' },
      { id: 'outbound:complete', name: '确认完成' },
    ],
  },
  {
    id: 'inventory',
    name: '库存管理',
    permissions: [
      { id: 'inventory:view', name: '查看库存' },
      { id: 'inventory:adjust', name: '库存调整' },
      { id: 'inventory:export', name: '导出库存' },
    ],
  },
  {
    id: 'reconciliation',
    name: '智能对账',
    permissions: [
      { id: 'recon:view', name: '查看对账记录' },
      { id: 'recon:create', name: '创建对账单' },
      { id: 'recon:approve', name: '审批对账单' },
      { id: 'recon:reject', name: '驳回对账单' },
      { id: 'recon:print', name: '打印对账单' },
    ],
  },
  {
    id: 'statistics',
    name: '数据统计',
    permissions: [
      { id: 'stats:view', name: '查看统计数据' },
      { id: 'stats:export', name: '导出报表' },
    ],
  },
  {
    id: 'customer',
    name: '客户管理',
    permissions: [
      { id: 'customer:view', name: '查看客户列表' },
      { id: 'customer:create', name: '创建客户' },
      { id: 'customer:edit', name: '编辑客户' },
      { id: 'customer:delete', name: '删除客户' },
    ],
  },
  {
    id: 'product',
    name: '产品管理',
    permissions: [
      { id: 'product:view', name: '查看产品列表' },
      { id: 'product:create', name: '创建产品' },
      { id: 'product:edit', name: '编辑产品' },
      { id: 'product:delete', name: '删除产品' },
    ],
  },
  {
    id: 'system',
    name: '系统设置',
    permissions: [
      { id: 'system:templates', name: '打印模板配置' },
      { id: 'system:permissions', name: '权限管理' },
      { id: 'system:organizations', name: '组织管理' },
    ],
  },
];
```

### 58.7 成员管理

```tsx
function MemberManager({ role }) {
  const { data: members } = useQuery({
    queryKey: ['role', role.id, 'members'],
    queryFn: () => rbacApi.getRoleMembers(role.id),
  });

  const [showAdd, setShowAdd] = useState(false);

  const removeMutation = useMutation({
    mutationFn: (userId: string) => rbacApi.removeMember(role.id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role', role.id, 'members'] });
      toast.success('已移除成员');
    },
  });

  return (
    <div className="space-y-3 py-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          共 {members?.length || 0} 位成员
        </span>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <UserPlus className="w-3 h-3 mr-1" /> 添加成员
        </Button>
      </div>

      <div className="space-y-2 max-h-[50vh] overflow-y-auto">
        {members?.map(member => (
          <div key={member.userId} className="flex items-center gap-3 p-3 rounded-lg border border-border">
            <UserDisplay userId={member.userId} />
            <div className="flex-1">
              <p className="text-sm font-medium">{member.userName}</p>
              <p className="text-xs text-muted-foreground">加入时间: {formatDate(member.joinedAt)}</p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => removeMutation.mutate(member.userId)}
            >
              <UserMinus className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>

      {showAdd && (
        <AddMemberDialog
          roleId={role.id}
          open={showAdd}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  );
}
```

### 58.8 模拟角色

```typescript
async function handleMockRole(role) {
  try {
    await rbacApi.mockRole(role.bizId);
    toast.success(`已切换为 ${role.name} 视角`);
    window.location.reload();
  } catch (err) {
    toast.error('模拟角色失败');
  }
}
```

### 58.9 API 接口

```typescript
// 角色列表
GET /api/rbac/roles
Response: Role[]

// 创建角色
POST /api/rbac/roles
Body: { bizId, name, description }
Response: Role

// 更新角色
PUT /api/rbac/roles/:id
Body: { name, description }
Response: Role

// 删除角色
DELETE /api/rbac/roles/:id
Response: { id: string }

// 权限树
GET /api/rbac/permissions/tree
Response: PermissionGroup[]

// 更新角色权限
PUT /api/rbac/roles/:id/permissions
Body: { permissionIds: string[] }
Response: Role

// 角色成员列表
GET /api/rbac/roles/:id/members
Response: { userId, userName, joinedAt }[]

// 添加成员
POST /api/rbac/roles/:id/members
Body: { userId }
Response: { success: true }

// 移除成员
DELETE /api/rbac/roles/:id/members/:userId
Response: { success: true }

// 模拟角色
POST /api/rbac/mock
Body: { bizId }
Response: { success: true }
```
