import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Plus, Search, Edit, Key, Eye, Shield, User, FileText, Lock, Settings, Database, Trash, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table } from '@lark-apaas/client-toolkit/antd-table';
import type { TableProps } from '@lark-apaas/client-toolkit/antd-table';
import { toast } from 'sonner';
import { logger } from '@lark-apaas/client-toolkit/logger';
import * as api from '@/api';
import {
  Filter,
  FilterContent,
  FilterTextContent,
  FilterTrigger,
  FilterGroup,
  FilterSelectContent,
} from '@/components/ui/filter';
import { checkPermission, getCurrentUser } from '@/lib/auth-session';

// 权限定义
const PERMISSIONS = {
  // 菜单权限
  menu: [
    { key: 'dashboard', label: '工作台', icon: 'LayoutDashboard' },
    { key: 'inbound', label: '来货登记', icon: 'Inbox' },
    { key: 'outbound', label: '快速发货', icon: 'Send' },
    { key: 'inventory', label: '库存管理', icon: 'Package' },
    { key: 'reconciliation', label: '智能对账', icon: 'FileText' },
    { key: 'statistics', label: '数据统计', icon: 'BarChart3' },
    { key: 'customers', label: '客户管理', icon: 'Database' },
    { key: 'products', label: '产品管理', icon: 'Package' },
    { key: 'orders', label: '单据查询', icon: 'FileText' },
    { key: 'templates', label: '打印模板', icon: 'FileSpreadsheet' },
    { key: 'permissions', label: '权限管理', icon: 'Shield' },
    { key: 'display', label: '显示设置', icon: 'Settings' },
    { key: 'manual', label: '用户手册', icon: 'FileText' },
    { key: 'profile', label: '个人资料', icon: 'User' },
    { key: 'logs', label: '操作日志', icon: 'FileText' },
    { key: 'featureFlags', label: '实验功能', icon: 'Settings' },
    { key: 'admin', label: '管理后台', icon: 'Shield' },
  ],
  // 操作权限
  action: [
    { key: 'view', label: '查看', description: '浏览数据' },
    { key: 'create', label: '新增', description: '创建新记录' },
    { key: 'edit', label: '编辑', description: '修改现有记录' },
    { key: 'delete', label: '删除', description: '删除记录' },
    { key: 'export', label: '导出', description: '导出Excel/CSV' },
    { key: 'print', label: '打印', description: '打印单据' },
    { key: 'approve', label: '审批', description: '审核对账单' },
  ],
};

// 角色数据类型
interface IRole {
  id: string;
  name: string;
  description: string;
  menus: string[];
  actions: string[];
  userCount: number;
  createdAt: string;
}

// 用户数据类型
interface IUser {
  id: string;
  username: string;
  name: string;
  roleId: string;
  roleName: string;
  department: string;
  status: 'active' | 'inactive';
  lastLogin: string;
  deviceLimit: number;
  password?: string;
  accountRoleId?: string;
  accountRoleName?: string;
}

const roleIdToServerRole = (roleId?: string) => roleId === '1'
  ? 'admin'
  : roleId === '4'
    ? 'finance'
    : roleId === '5'
      ? 'viewer'
      : 'operator';
const serverRoleToRole = (role: string) => role === 'admin'
  ? { id: '1', name: '系统管理员' }
  : role === 'finance' ? { id: '4', name: '财务人员' }
    : role === 'viewer' ? { id: '5', name: '只读用户' } : { id: '2', name: '操作员' };

// 日志数据类型
interface ILog {
  id: string;
  time: string;
  user: string;
  action: string;
  target: string;
  ip: string;
  details: string;
}

// 初始化角色数据
const initialRoles: IRole[] = [
  {
    id: '1',
    name: '系统管理员',
    description: '拥有系统所有权限',
    menus: PERMISSIONS.menu.map(m => m.key),
    actions: PERMISSIONS.action.map(a => a.key),
    userCount: 1,
    createdAt: '2024-01-01',
  },
  {
    id: '2',
    name: '操作员',
    description: '业务操作与查看，不含权限管理和系统设置',
    menus: ['dashboard', 'inbound', 'outbound', 'orders', 'inventory', 'reconciliation', 'statistics', 'customers', 'products', 'display', 'manual', 'profile'],
    actions: ['view', 'create', 'edit', 'delete', 'export', 'print'],
    userCount: 0,
    createdAt: '2024-01-01',
  },
  {
    id: '4',
    name: '财务人员',
    description: '负责对账和统计',
    menus: ['dashboard', 'orders', 'reconciliation', 'statistics', 'customers', 'display', 'manual', 'profile'],
    actions: ['view', 'create', 'edit', 'export', 'print', 'approve'],
    userCount: 1,
    createdAt: '2024-01-01',
  },
  {
    id: '5',
    name: '只读用户',
    description: '仅可使用各业务模块的查看权限',
    menus: ['dashboard', 'orders', 'inventory', 'reconciliation', 'statistics', 'customers', 'products', 'display', 'manual', 'profile'],
    actions: ['view'],
    userCount: 0,
    createdAt: '2024-01-01',
  },
];

// 本地存储键名
const STORAGE_KEYS = {
  roles: 'heat_treatment_roles',
  users: 'heat_treatment_users',
  logs: 'heat_treatment_logs',
  currentUser: 'heat_treatment_current_user',
};

const PermissionPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('roles');

  const [roles] = useState<IRole[]>(initialRoles);

  const [users, setUsers] = useState<IUser[]>([]);

  const [logs, setLogs] = useState<ILog[]>([]);

  useEffect(() => {
    api.getAuthUsers().then(records => setUsers(records.map(record => {
      const mapped = serverRoleToRole(record.role);
      return {
        id: record.id,
        username: record.username,
        name: record.name,
        roleId: mapped.id,
        roleName: mapped.name,
        department: record.department || '',
        status: record.status || 'active',
        lastLogin: record.lastLogin ? new Date(record.lastLogin).toLocaleString('zh-CN') : '-',
        deviceLimit: record.deviceLimit,
      };
    }))).catch(error => {
      logger.error('加载用户失败', error);
      toast.error('加载用户列表失败');
    });
  }, []);

  useEffect(() => {
    api.getSystemOperationLogs().then(records => setLogs(records.map((record: any) => ({
      id: record.id,
      time: new Date(record.createdAt).toLocaleString('zh-CN'),
      user: record.operator || '-',
      action: record.operation || '-',
      target: `${record.entityType || '记录'} ${record.entityId || ''}`,
      ip: record.ipAddress || '-',
      details: typeof record.afterState === 'string' ? record.afterState : JSON.stringify(record.afterState || record.beforeState || {}),
    })))).catch(error => {
      logger.error('加载操作日志失败', error);
      toast.error('加载操作日志失败');
    });
  }, []);

  // 角色管理状态
  const [roleSearch, setRoleSearch] = useState<string | undefined>();

  // 用户管理状态
  const [userSearch, setUserSearch] = useState<string | undefined>();
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<IUser | null>(null);
  const [userForm, setUserForm] = useState<Partial<IUser>>({
    username: '',
    name: '',
    roleId: '',
    department: '',
    deviceLimit: 1,
    status: 'active',
    password: '',
  });
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // 日志管理状态
  const [logSearch, setLogSearch] = useState('');
  const [logActionFilter, setLogActionFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState<ILog | null>(null);
  const [isLogDetailDialogOpen, setIsLogDetailDialogOpen] = useState(false);

  // 权限测试状态
  const [testRoleId, setTestRoleId] = useState<string>('');
  const [testPermission, setTestPermission] = useState<string>('');
  const [testResult, setTestResult] = useState<boolean | null>(null);

  // 系统设置状态
  const [isResetDbDialogOpen, setIsResetDbDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // 角色表格列定义
  const roleColumns: TableProps<IRole>['columns'] = [
    {
      title: '角色名称',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <span className="font-medium text-primary">{text}</span>,
    },
    {
      title: '菜单权限',
      dataIndex: 'menus',
      key: 'menus',
      render: (menus: string[]) => (
        <div className="flex flex-wrap gap-1">
          {menus.slice(0, 3).map((menu) => {
            const menuItem = PERMISSIONS.menu.find((m) => m.key === menu);
            return (
              <Badge key={menu} variant="secondary" className="text-xs">
                {menuItem?.label || menu}
              </Badge>
            );
          })}
          {menus.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{menus.length - 3}
            </Badge>
          )}
        </div>
      ),
    },
    {
      title: '操作权限',
      dataIndex: 'actions',
      key: 'actions',
      render: (actions: string[]) => (
        <div className="flex flex-wrap gap-1">
          {actions.slice(0, 3).map((action) => {
            const actionItem = PERMISSIONS.action.find((a) => a.key === action);
            return (
              <Badge key={action} variant="outline" className="text-xs">
                {actionItem?.label || action}
              </Badge>
            );
          })}
          {actions.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{actions.length - 3}
            </Badge>
          )}
        </div>
      ),
    },
    { title: '用户数', dataIndex: 'userCount', key: 'userCount', width: 80 },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: '类型',
      key: 'type',
      width: 110,
      render: () => <Badge variant="outline">系统固定</Badge>,
    },
  ];

  // 用户表格列定义
  const userColumns: TableProps<IUser>['columns'] = [
    { title: '用户名', dataIndex: 'username', key: 'username' },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: '角色',
      dataIndex: 'roleName',
      key: 'roleName',
      render: (text) => (
        <Badge variant="secondary" className="font-normal">
          {text}
        </Badge>
      ),
    },
    { title: '部门', dataIndex: 'department', key: 'department' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Badge variant={status === 'active' ? 'default' : 'secondary'}>
          {status === 'active' ? '启用' : '禁用'}
        </Badge>
      ),
    },
    { title: '最近登录', dataIndex: 'lastLogin', key: 'lastLogin', width: 150 },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleEditUser(record)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleResetPasswordClick(record.id)}>
            <Key className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleUserStatus(record.id)}
            className={record.status === 'active' ? 'text-warning' : 'text-success'}
          >
            {record.status === 'active' ? '禁用' : '启用'}
          </Button>
        </div>
      ),
    },
  ];

  // 日志表格列定义
  const logColumns: TableProps<ILog>['columns'] = [
    { title: '时间', dataIndex: 'time', key: 'time', width: 180 },
    { title: '用户', dataIndex: 'user', key: 'user', width: 100 },
    { title: '操作类型', dataIndex: 'action', key: 'action', width: 120 },
    { title: '操作对象', dataIndex: 'target', key: 'target', ellipsis: true },
    { title: 'IP地址', dataIndex: 'ip', key: 'ip', width: 130 },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Button variant="ghost" size="sm" onClick={() => handleViewLogDetail(record)}>
          <Eye className="w-4 h-4" />
        </Button>
      ),
    },
  ];

  // 用户操作处理
  const handleAddUser = () => {
    setEditingUser(null);
    setUserForm({
      username: '',
      name: '',
      roleId: '',
      department: '',
      deviceLimit: 1,
      status: 'active',
      password: '',
    });
    setIsUserDialogOpen(true);
  };

  const handleEditUser = (user: IUser) => {
    setEditingUser(user);
    setUserForm({
      username: user.username,
      name: user.name,
      roleId: user.roleId,
      department: user.department,
      deviceLimit: user.deviceLimit,
      status: user.status,
    });
    setIsUserDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!userForm.username || !userForm.name || !userForm.roleId) {
      toast.error('请填写完整信息');
      return;
    }

    const role = roles.find((r) => r.id === userForm.roleId);

    try {
      const serverRole = roleIdToServerRole(userForm.roleId);
      const saved = editingUser
        ? await api.updateAuthUser(editingUser.id, {
          name: userForm.name,
          role: serverRole,
          department: userForm.department,
          deviceLimit: userForm.deviceLimit,
          status: userForm.status,
        })
        : await api.createAuthUser({
          username: userForm.username,
          password: userForm.password || '',
          name: userForm.name,
          role: serverRole,
          department: userForm.department,
          deviceLimit: userForm.deviceLimit,
        });
      const mapped = serverRoleToRole(saved.role);
      const normalized: IUser = {
        id: saved.id, username: saved.username, name: saved.name,
        roleId: mapped.id, roleName: mapped.name, department: saved.department || '',
        status: saved.status || 'active', lastLogin: saved.lastLogin ? new Date(saved.lastLogin).toLocaleString('zh-CN') : '-',
        deviceLimit: saved.deviceLimit,
      };
      setUsers(current => editingUser ? current.map(user => user.id === saved.id ? normalized : user) : [...current, normalized]);
      toast.success(editingUser ? '用户更新成功' : '用户创建成功');
      setIsUserDialogOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || '用户保存失败');
    }
  };

  const handleResetPasswordClick = (id: string) => {
    setResettingUserId(id);
    setIsResetPasswordDialogOpen(true);
    setNewPassword('');
  };

  const handleConfirmResetPassword = async () => {
    if (resettingUserId) {
      if (newPassword.length < 8) return toast.error('新密码至少8位');
      try {
        await api.resetAuthUserPassword(resettingUserId, newPassword);
        toast.success('密码已重置，用户现有登录会话已退出');
        setIsResetPasswordDialogOpen(false);
        setResettingUserId(null);
      } catch (error: any) {
        toast.error(error.response?.data?.message || '密码重置失败');
      }
    }
  };

  const handleToggleUserStatus = async (id: string) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    const status = user.status === 'active' ? 'inactive' : 'active';
    try {
      await api.updateAuthUser(id, { status });
      setUsers(current => current.map(item => item.id === id ? { ...item, status } : item));
      toast.success(`用户 ${user.name} 已${status === 'inactive' ? '禁用' : '启用'}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || '状态更新失败');
    }
  };

  // 日志操作处理
  const handleViewLogDetail = (log: ILog) => {
    setSelectedLog(log);
    setIsLogDetailDialogOpen(true);
  };

  // 权限测试
  const handleTestPermission = () => {
    if (!testRoleId || !testPermission) {
      toast.error('请选择角色和权限');
      return;
    }
    const hasPermission = checkPermission(testRoleId, 'menu', testPermission);
    setTestResult(hasPermission);
  };

  // 清空数据库
  const handleResetDatabase = async () => {
    setIsResetting(true);
    try {
      await api.resetDatabase();
      
      // 服务端只清空业务数据并保留账号与固定 RBAC；同步移除旧版前端缓存。
      localStorage.removeItem(STORAGE_KEYS.roles);
      localStorage.removeItem(STORAGE_KEYS.users);
      localStorage.removeItem(STORAGE_KEYS.logs);
      setLogs([]);
      
      toast.success('业务数据已清空，账号与角色权限已保留');
      setIsResetDbDialogOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || '清空数据库失败');
    } finally {
      setIsResetting(false);
    }
  };

  // 筛选数据
  const filteredRoles = roles
    .map(role => ({
      ...role,
      userCount: users.filter(user => user.roleId === role.id).length,
    }))
    .filter((r) => !roleSearch || r.name.includes(roleSearch) || r.description.includes(roleSearch));
  const filteredUsers = users.filter(
    (u) => !userSearch || u.name.includes(userSearch) || u.username.includes(userSearch)
  );
  const filteredLogs = logs.filter((l) => {
    const matchSearch = !logSearch || l.user.includes(logSearch) || l.target.includes(logSearch);
    const matchAction = !logActionFilter || logActionFilter === 'all' || l.action === logActionFilter;
    return matchSearch && matchAction;
  });

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="w-full">
        <h1 className="text-2xl font-bold mb-2">权限管理</h1>
        <p className="text-muted-foreground">分级权限控制，保障数据安全</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:w-[620px]">
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            角色管理
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            用户管理
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            操作日志
          </TabsTrigger>
          <TabsTrigger value="test" className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            权限测试
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            系统设置
          </TabsTrigger>
        </TabsList>

        {/* 角色管理 */}
        <TabsContent value="roles" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>角色列表</CardTitle>
              <Badge variant="outline">4 个固定角色</Badge>
            </CardHeader>
            <CardContent>
              <FilterGroup gap="sm" className="mb-4">
                <Filter value={roleSearch} onValueChange={setRoleSearch}>
                  <FilterTrigger label="关键词" closable />
                  <FilterContent>
                    <FilterTextContent placeholder="搜索角色名称或描述" />
                  </FilterContent>
                </Filter>
                {roleSearch && (
                  <Button variant="ghost" size="sm" onClick={() => setRoleSearch(undefined)}>
                    <X className="w-4 h-4 mr-1" />
                    重置
                  </Button>
                )}
              </FilterGroup>
              <Table columns={roleColumns} dataSource={filteredRoles} rowKey="id" pagination={{ pageSize: 10 }} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* 用户管理 */}
        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>用户列表</CardTitle>
              <Button onClick={handleAddUser} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                新增用户
              </Button>
            </CardHeader>
            <CardContent>
              <FilterGroup gap="sm" className="mb-4">
                <Filter value={userSearch} onValueChange={setUserSearch}>
                  <FilterTrigger label="关键词" closable />
                  <FilterContent>
                    <FilterTextContent placeholder="搜索用户名或姓名" />
                  </FilterContent>
                </Filter>
                {userSearch && (
                  <Button variant="ghost" size="sm" onClick={() => setUserSearch(undefined)}>
                    <X className="w-4 h-4 mr-1" />
                    重置
                  </Button>
                )}
              </FilterGroup>
              <Table columns={userColumns} dataSource={filteredUsers} rowKey="id" pagination={{ pageSize: 10 }} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* 操作日志 */}
        <TabsContent value="logs" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>操作日志</CardTitle>
            </CardHeader>
            <CardContent>
              <FilterGroup gap="sm" className="mb-4">
                <Filter value={logSearch} onValueChange={(value) => setLogSearch(value || '')}>
                  <FilterTrigger label="关键词" closable />
                  <FilterContent>
                    <FilterTextContent placeholder="搜索用户或操作对象" />
                  </FilterContent>
                </Filter>
                <Filter value={logActionFilter} onValueChange={(value) => setLogActionFilter(value || '')}>
                  <FilterTrigger label="操作类型" closable />
                  <FilterContent>
                    <FilterSelectContent
                      options={[
                        { label: '来货登记', value: '来货登记' },
                        { label: '快速发货', value: '快速发货' },
                        { label: '生成对账单', value: '生成对账单' },
                        { label: '修改用户', value: '修改用户' },
                        { label: '打印流程卡', value: '打印流程卡' },
                        { label: '打印送货单', value: '打印送货单' },
                        { label: '确认回款', value: '确认回款' },
                        { label: '登录系统', value: '登录系统' },
                      ]}
                    />
                  </FilterContent>
                </Filter>
                {(logSearch || logActionFilter) && (
                  <Button variant="ghost" size="sm" onClick={() => { setLogSearch(''); setLogActionFilter(''); }}>
                    <X className="w-4 h-4 mr-1" />
                    重置
                  </Button>
                )}
              </FilterGroup>
              <Table columns={logColumns} dataSource={filteredLogs} rowKey="id" pagination={{ pageSize: 10 }} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* 权限测试 */}
        <TabsContent value="test" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>权限测试</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>选择角色</Label>
                  <Select value={testRoleId} onValueChange={setTestRoleId}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择要测试的角色" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>选择权限</Label>
                  <Select value={testPermission} onValueChange={setTestPermission}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择要测试权限" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_group_menu" disabled>
                        ─ 菜单权限 ─
                      </SelectItem>
                      {PERMISSIONS.menu.map((menu) => (
                        <SelectItem key={menu.key} value={menu.key}>
                          {menu.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleTestPermission} className="w-full">
                测试权限
              </Button>
              {testResult !== null && (
                <Alert variant={testResult ? 'default' : 'destructive'}>
                  <AlertDescription className="flex items-center gap-2">
                    {testResult ? (
                      <>
                        <Badge variant="default">通过</Badge>
                        该角色拥有此权限
                      </>
                    ) : (
                      <>
                        <Badge variant="destructive">拒绝</Badge>
                        该角色无此权限
                      </>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 系统设置 */}
        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                数据初始化
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert variant="destructive">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>
                  <strong>危险操作警告：</strong>此操作将清空数据库中的所有业务数据，包括客户、产品、入库单、出库单、对账单等。
                  <br />
                  操作后数据将无法恢复，请谨慎使用！
                </AlertDescription>
              </Alert>

              <div className="p-4 bg-muted/50 rounded-lg space-y-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <Trash className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-lg">恢复初始化设置</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      点击以下按钮将清空所有业务数据，系统将恢复到初始状态：
                    </p>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                      <li>所有客户数据</li>
                      <li>所有产品数据</li>
                      <li>所有入库单和入库明细</li>
                      <li>所有出库单和出库明细</li>
                      <li>所有对账单和对账明细</li>
                      <li>所有库存记录和批次信息</li>
                      <li>所有操作日志和统计数据</li>
                    </ul>
                    <p className="text-sm text-muted-foreground mt-2">
                      <strong>保留的数据：</strong>角色权限配置
                    </p>
                  </div>
                </div>

                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setIsResetDbDialogOpen(true)}
                >
                  <Trash className="w-4 h-4 mr-2" />
                  清空数据库
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 用户编辑弹窗 */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingUser ? '编辑用户' : '新增用户'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>
                用户名 <span className="text-destructive">*</span>
              </Label>
              <Input
                value={userForm.username}
                onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                placeholder="请输入用户名"
                disabled={!!editingUser}
              />
            </div>
            <div className="space-y-2">
              <Label>
                姓名 <span className="text-destructive">*</span>
              </Label>
              <Input
                value={userForm.name}
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                placeholder="请输入姓名"
              />
            </div>
            {!editingUser && (
              <div className="space-y-2">
                <Label>
                  初始密码 <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="password"
                  value={userForm.password || ''}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder="至少8位"
                  autoComplete="new-password"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>
                角色 <span className="text-destructive">*</span>
              </Label>
              <Select
                value={userForm.roleId}
                onValueChange={(value) => setUserForm({ ...userForm, roleId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择角色" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>部门</Label>
              <Input
                value={userForm.department}
                onChange={(e) => setUserForm({ ...userForm, department: e.target.value })}
                placeholder="请输入部门"
              />
            </div>
            <div className="space-y-2">
              <Label>设备数量限制</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={userForm.deviceLimit}
                onChange={(e) => setUserForm({ ...userForm, deviceLimit: parseInt(e.target.value) || 1 })}
              />
              <p className="text-sm text-muted-foreground">限制该用户可同时登录的设备数量</p>
            </div>
            <div className="space-y-2">
              <Label>账号状态</Label>
              <Select
                value={userForm.status}
                onValueChange={(value: 'active' | 'inactive') =>
                  setUserForm({ ...userForm, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">启用</SelectItem>
                  <SelectItem value="inactive">禁用</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUserDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveUser} disabled={!userForm.username || !userForm.name || !userForm.roleId || (!editingUser && (userForm.password?.length || 0) < 8)}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 重置密码确认弹窗 */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认重置密码</DialogTitle>
          </DialogHeader>
          <Alert>
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>重置密码会立即退出该用户的全部登录设备。</AlertDescription>
          </Alert>
          <div className="space-y-2 py-2">
            <Label>新密码</Label>
            <Input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="至少8位" autoComplete="new-password" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetPasswordDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleConfirmResetPassword} disabled={newPassword.length < 8}>确认重置</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 日志详情弹窗 */}
      <Dialog open={isLogDetailDialogOpen} onOpenChange={setIsLogDetailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>操作详情</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-3 py-4">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">时间：</span>
                <span className="col-span-2">{selectedLog.time}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">用户：</span>
                <span className="col-span-2">{selectedLog.user}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">操作类型：</span>
                <span className="col-span-2">{selectedLog.action}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">操作对象：</span>
                <span className="col-span-2">{selectedLog.target}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">IP地址：</span>
                <span className="col-span-2">{selectedLog.ip}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">详细内容：</span>
                <span className="col-span-2">{selectedLog.details}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsLogDetailDialogOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 清空数据库确认弹窗 */}
      <Dialog open={isResetDbDialogOpen} onOpenChange={setIsResetDbDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              确认清空数据库
            </DialogTitle>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertDescription>
              <strong>此操作不可撤销！</strong>
              <br />
              清空数据库将删除所有业务数据，包括：
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>客户信息</li>
                <li>产品信息</li>
                <li>入库单和出库单</li>
                <li>对账单和库存记录</li>
                <li>操作日志和统计数据</li>
              </ul>
              <p className="mt-2">是否确认执行此操作？</p>
            </AlertDescription>
          </Alert>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsResetDbDialogOpen(false)}
              disabled={isResetting}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleResetDatabase}
              disabled={isResetting}
            >
              {isResetting ? '清空中...' : '确认清空'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PermissionPage;
