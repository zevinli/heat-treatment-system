import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, Plus, Search, Edit, Trash2, Key, Eye, Shield, User, FileText, Lock, Settings, Database, Trash, X } from 'lucide-react';
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
    { key: 'templates', label: '打印模板', icon: 'FileSpreadsheet' },
    { key: 'permissions', label: '权限管理', icon: 'Shield' },
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
}

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
    name: '收货员',
    description: '负责来货登记和库存管理',
    menus: ['dashboard', 'inbound', 'inventory', 'products'],
    actions: ['view', 'create', 'edit', 'print'],
    userCount: 2,
    createdAt: '2024-01-01',
  },
  {
    id: '3',
    name: '发货员',
    description: '负责快速发货和出库',
    menus: ['dashboard', 'outbound', 'inventory'],
    actions: ['view', 'create', 'edit', 'print'],
    userCount: 2,
    createdAt: '2024-01-01',
  },
  {
    id: '4',
    name: '财务人员',
    description: '负责对账和统计',
    menus: ['dashboard', 'reconciliation', 'statistics', 'customers'],
    actions: ['view', 'create', 'edit', 'export', 'print', 'approve'],
    userCount: 1,
    createdAt: '2024-01-01',
  },
  {
    id: '5',
    name: '普通操作员',
    description: '基础操作权限',
    menus: ['dashboard', 'inbound', 'outbound'],
    actions: ['view', 'create'],
    userCount: 3,
    createdAt: '2024-01-01',
  },
];

// 初始化用户数据
const initialUsers: IUser[] = [
  { id: '1', username: 'admin', name: '管理员', roleId: '1', roleName: '系统管理员', department: '技术部', status: 'active', lastLogin: '2026-02-04 09:30', deviceLimit: 3 },
  { id: '2', username: 'zhangsan', name: '张三', roleId: '2', roleName: '收货员', department: '收货部', status: 'active', lastLogin: '2026-02-04 08:15', deviceLimit: 2 },
  { id: '3', username: 'lisi', name: '李四', roleId: '3', roleName: '发货员', department: '发货部', status: 'active', lastLogin: '2026-02-03 17:45', deviceLimit: 2 },
  { id: '4', username: 'wangwu', name: '王五', roleId: '4', roleName: '财务人员', department: '财务部', status: 'active', lastLogin: '2026-02-04 10:00', deviceLimit: 1 },
  { id: '5', username: 'zhaoliu', name: '赵六', roleId: '5', roleName: '普通操作员', department: '生产部', status: 'inactive', lastLogin: '2026-01-28 16:20', deviceLimit: 1 },
];

// 初始化日志数据
const initialLogs: ILog[] = [
  { id: '1', time: '2026-02-04 10:30:15', user: '张三', action: '来货登记', target: '来货单 #20250204001', ip: '192.168.1.100', details: '登记了客户"华兴机械"的来货，产品：齿轮A型，数量：100件' },
  { id: '2', time: '2026-02-04 10:25:42', user: '李四', action: '快速发货', target: '发货单 #20250204005', ip: '192.168.1.101', details: '完成客户"精密制造"的发货，产品：轴承B型，数量：50件' },
  { id: '3', time: '2026-02-04 10:20:08', user: '王五', action: '生成对账单', target: '对账单 #202502-001', ip: '192.168.1.102', details: '为客户"华兴机械"生成2月份对账单' },
  { id: '4', time: '2026-02-04 10:15:33', user: '管理员', action: '修改用户', target: '用户 赵六', ip: '192.168.1.1', details: '禁用用户账号' },
  { id: '5', time: '2026-02-04 10:10:56', user: '张三', action: '打印流程卡', target: '流程卡 #PC2025020403', ip: '192.168.1.100', details: '打印热处理流程卡' },
  { id: '6', time: '2026-02-04 09:55:21', user: '李四', action: '打印送货单', target: '送货单 #SD2025020402', ip: '192.168.1.101', details: '打印客户送货单' },
  { id: '7', time: '2026-02-04 09:45:10', user: '王五', action: '确认回款', target: '回款记录 #HK202502001', ip: '192.168.1.102', details: '确认客户"精密制造"回款 ￥50,000' },
  { id: '8', time: '2026-02-04 09:30:45', user: '管理员', action: '登录系统', target: '系统', ip: '192.168.1.1', details: '成功登录系统' },
];

// 本地存储键名
const STORAGE_KEYS = {
  roles: 'heat_treatment_roles',
  users: 'heat_treatment_users',
  logs: 'heat_treatment_logs',
  currentUser: 'heat_treatment_current_user',
};

// 权限检查工具
export const checkPermission = (userRoleId: string, permissionType: 'menu' | 'action', permissionKey: string): boolean => {
  try {
    // 从 localStorage 读取角色，如果没有则使用默认角色
    const storedRoles = localStorage.getItem(STORAGE_KEYS.roles);
    let roles: IRole[] = initialRoles;
    
    if (storedRoles) {
      try {
        const parsed = JSON.parse(storedRoles);
        // 确保解析结果是数组
        if (Array.isArray(parsed)) {
          roles = parsed;
        }
      } catch (e) {
        // 解析失败时使用默认角色
        logger.warn('Failed to parse roles from localStorage, using defaults');
      }
    }
    
    const role = roles.find((r: IRole) => r.id === userRoleId);

    // 如果找不到角色，拒绝访问
    if (!role) return false;

    // 系统管理员拥有所有权限
    if (role.id === '1') return true;

    if (permissionType === 'menu') {
      return role.menus?.includes(permissionKey) || false;
    }
    return role.actions?.includes(permissionKey) || false;
  } catch (error) {
    logger.error('Permission check error:', error);
    // 出错时默认允许访问，避免页面崩溃
    return true;
  }
};

// 获取当前用户
export const getCurrentUser = (): IUser | null => {
  const userStr = localStorage.getItem(STORAGE_KEYS.currentUser);
  return userStr ? JSON.parse(userStr) : null;
};

// 设置当前用户
export const setCurrentUser = (user: IUser | null): void => {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));
    localStorage.setItem('userId', user.id);
    localStorage.setItem('userName', user.name);
    localStorage.setItem('userRole', String(user.roleId));
  } else {
    localStorage.removeItem(STORAGE_KEYS.currentUser);
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
  }
};

const PermissionPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('roles');

  // 从 localStorage 加载数据
  const [roles, setRoles] = useState<IRole[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.roles);
    if (saved) return JSON.parse(saved);
    localStorage.setItem(STORAGE_KEYS.roles, JSON.stringify(initialRoles));
    return initialRoles;
  });

  const [users, setUsers] = useState<IUser[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.users);
    if (saved) return JSON.parse(saved);
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(initialUsers));
    return initialUsers;
  });

  const [logs, setLogs] = useState<ILog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.logs);
    if (saved) return JSON.parse(saved);
    localStorage.setItem(STORAGE_KEYS.logs, JSON.stringify(initialLogs));
    return initialLogs;
  });

  // 保存数据到 localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.roles, JSON.stringify(roles));
  }, [roles]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.logs, JSON.stringify(logs));
  }, [logs]);

  // 角色管理状态
  const [roleSearch, setRoleSearch] = useState<string | undefined>();
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<IRole | null>(null);
  const [roleForm, setRoleForm] = useState<Partial<IRole>>({
    name: '',
    description: '',
    menus: [],
    actions: [],
  });
  const [isDeleteRoleDialogOpen, setIsDeleteRoleDialogOpen] = useState(false);
  const [deletingRoleId, setDeletingRoleId] = useState<string | null>(null);

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
  });
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);

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
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleEditRole(record)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={() => handleDeleteRoleClick(record.id)}
            disabled={record.userCount > 0}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
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

  // 角色操作处理
  const handleAddRole = () => {
    setEditingRole(null);
    setRoleForm({ name: '', description: '', menus: [], actions: [] });
    setIsRoleDialogOpen(true);
  };

  const handleEditRole = (role: IRole) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      description: role.description,
      menus: [...role.menus],
      actions: [...role.actions],
    });
    setIsRoleDialogOpen(true);
  };

  const handleSaveRole = () => {
    if (!roleForm.name) {
      toast.error('请输入角色名称');
      return;
    }

    if (editingRole) {
      setRoles(
        roles.map((r) =>
          r.id === editingRole.id
            ? {
                ...r,
                name: roleForm.name || r.name,
                description: roleForm.description || '',
                menus: roleForm.menus || [],
                actions: roleForm.actions || [],
              }
            : r
        )
      );
      toast.success('角色更新成功');
    } else {
      const newRole: IRole = {
        id: Date.now().toString(),
        name: roleForm.name,
        description: roleForm.description || '',
        menus: roleForm.menus || [],
        actions: roleForm.actions || [],
        userCount: 0,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setRoles([...roles, newRole]);
      toast.success('角色创建成功');
    }
    setIsRoleDialogOpen(false);
  };

  const handleDeleteRoleClick = (id: string) => {
    setDeletingRoleId(id);
    setIsDeleteRoleDialogOpen(true);
  };

  const handleConfirmDeleteRole = () => {
    if (deletingRoleId) {
      setRoles(roles.filter((r) => r.id !== deletingRoleId));
      setIsDeleteRoleDialogOpen(false);
      setDeletingRoleId(null);
      toast.success('角色删除成功');
    }
  };

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

  const handleSaveUser = () => {
    if (!userForm.username || !userForm.name || !userForm.roleId) {
      toast.error('请填写完整信息');
      return;
    }

    const role = roles.find((r) => r.id === userForm.roleId);

    if (editingUser) {
      setUsers(
        users.map((u) =>
          u.id === editingUser.id
            ? {
                ...u,
                username: userForm.username || u.username,
                name: userForm.name || u.name,
                roleId: userForm.roleId || u.roleId,
                roleName: role?.name || u.roleName,
                department: userForm.department || '',
                deviceLimit: userForm.deviceLimit || 1,
                status: (userForm.status as 'active' | 'inactive') || u.status,
              }
            : u
        )
      );
      toast.success('用户更新成功');
    } else {
      const newUser: IUser = {
        id: Date.now().toString(),
        username: userForm.username,
        name: userForm.name,
        roleId: userForm.roleId,
        roleName: role?.name || '',
        department: userForm.department || '',
        status: (userForm.status as 'active' | 'inactive') || 'active',
        lastLogin: '-',
        deviceLimit: userForm.deviceLimit || 1,
      };
      setUsers([...users, newUser]);

      // 更新角色的用户计数
      if (role) {
        setRoles(
          roles.map((r) => (r.id === role.id ? { ...r, userCount: r.userCount + 1 } : r))
        );
      }
      toast.success('用户创建成功');
    }
    setIsUserDialogOpen(false);
  };

  const handleResetPasswordClick = (id: string) => {
    setResettingUserId(id);
    setIsResetPasswordDialogOpen(true);
  };

  const handleConfirmResetPassword = () => {
    if (resettingUserId) {
      const user = users.find((u) => u.id === resettingUserId);
      toast.success(`用户 ${user?.name} 的密码已重置为：123456`);
      setIsResetPasswordDialogOpen(false);
      setResettingUserId(null);
    }
  };

  const handleToggleUserStatus = (id: string) => {
    setUsers(users.map((u) => (u.id === id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u)));
    const user = users.find((u) => u.id === id);
    toast.success(`用户 ${user?.name} 已${user?.status === 'active' ? '禁用' : '启用'}`);
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
      
      // 清空 localStorage 中的权限相关数据
      localStorage.removeItem(STORAGE_KEYS.roles);
      localStorage.removeItem(STORAGE_KEYS.users);
      localStorage.removeItem(STORAGE_KEYS.logs);
      
      // 恢复初始数据到 localStorage 和状态
      localStorage.setItem(STORAGE_KEYS.roles, JSON.stringify(initialRoles));
      localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(initialUsers));
      localStorage.setItem(STORAGE_KEYS.logs, JSON.stringify(initialLogs));
      
      setRoles(initialRoles);
      setUsers(initialUsers);
      setLogs(initialLogs);
      
      toast.success('数据库已清空，系统已恢复初始化状态');
      setIsResetDbDialogOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || '清空数据库失败');
    } finally {
      setIsResetting(false);
    }
  };

  // 筛选数据
  const filteredRoles = roles.filter(
    (r) => !roleSearch || r.name.includes(roleSearch) || r.description.includes(roleSearch)
  );
  const filteredUsers = users.filter(
    (u) => !userSearch || u.name.includes(userSearch) || u.username.includes(userSearch)
  );
  const filteredLogs = logs.filter((l) => {
    const matchSearch = !logSearch || l.user.includes(logSearch) || l.target.includes(logSearch);
    const matchAction = !logActionFilter || l.action === logActionFilter;
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
              <Button onClick={handleAddRole} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                新增角色
              </Button>
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
                <Filter value={logSearch} onValueChange={setLogSearch}>
                  <FilterTrigger label="关键词" closable />
                  <FilterContent>
                    <FilterTextContent placeholder="搜索用户或操作对象" />
                  </FilterContent>
                </Filter>
                <Filter value={logActionFilter} onValueChange={setLogActionFilter}>
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
                  <Button variant="ghost" size="sm" onClick={() => { setLogSearch(undefined); setLogActionFilter(undefined); }}>
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

      {/* 角色编辑弹窗 */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRole ? '编辑角色' : '新增角色'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>
                角色名称 <span className="text-destructive">*</span>
              </Label>
              <Input
                value={roleForm.name}
                onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                placeholder="请输入角色名称"
              />
            </div>
            <div className="space-y-2">
              <Label>角色描述</Label>
              <Input
                value={roleForm.description}
                onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                placeholder="请输入角色描述"
              />
            </div>

            {/* 菜单权限配置 */}
            <div className="space-y-3">
              <Label className="text-base font-medium">菜单权限配置</Label>
              <div className="border rounded-lg p-4">
                <div className="grid grid-cols-2 gap-3">
                  {PERMISSIONS.menu.map((menu) => (
                    <div key={menu.key} className="flex items-start space-x-3 p-2 rounded hover:bg-muted">
                      <Checkbox
                        checked={roleForm.menus?.includes(menu.key)}
                        onCheckedChange={(checked) => {
                          const currentMenus = roleForm.menus || [];
                          if (checked) {
                            setRoleForm({ ...roleForm, menus: [...currentMenus, menu.key] });
                          } else {
                            setRoleForm({
                              ...roleForm,
                              menus: currentMenus.filter((p) => p !== menu.key),
                            });
                          }
                        }}
                      />
                      <div className="flex-1">
                        <span className="font-medium">{menu.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 操作权限配置 */}
            <div className="space-y-3">
              <Label className="text-base font-medium">操作权限配置</Label>
              <div className="border rounded-lg p-4">
                <div className="grid grid-cols-2 gap-3">
                  {PERMISSIONS.action.map((action) => (
                    <div key={action.key} className="flex items-start space-x-3 p-2 rounded hover:bg-muted">
                      <Checkbox
                        checked={roleForm.actions?.includes(action.key)}
                        onCheckedChange={(checked) => {
                          const currentActions = roleForm.actions || [];
                          if (checked) {
                            setRoleForm({ ...roleForm, actions: [...currentActions, action.key] });
                          } else {
                            setRoleForm({
                              ...roleForm,
                              actions: currentActions.filter((p) => p !== action.key),
                            });
                          }
                        }}
                      />
                      <div className="flex-1">
                        <span className="font-medium">{action.label}</span>
                        <p className="text-xs text-muted-foreground">{action.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveRole} disabled={!roleForm.name}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除角色确认弹窗 */}
      <Dialog open={isDeleteRoleDialogOpen} onOpenChange={setIsDeleteRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除角色</DialogTitle>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              删除角色后，该角色下的用户将失去相应权限。此操作不可恢复，请谨慎操作。
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteRoleDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleConfirmDeleteRole}>
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <Button onClick={handleSaveUser} disabled={!userForm.username || !userForm.name || !userForm.roleId}>
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
            <AlertDescription>
              重置密码后，该用户的密码将恢复为初始密码（默认：123456），用户下次登录时需要修改密码。
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetPasswordDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleConfirmResetPassword}>确认重置</Button>
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
