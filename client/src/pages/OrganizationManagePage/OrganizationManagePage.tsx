import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2,
  Users,
  Plus,
  RefreshCw,
  Loader2,
  Search,
  Settings,
  Copy,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';

interface Organization {
  id: string;
  code: string;
  name: string;
  dbName: string;
  dbHost: string;
  status: 'active' | 'suspended' | 'inactive';
  maxUsers: number;
  maxStorageGb: number;
  expiresAt: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function OrganizationManagePage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [inviteCode, setInviteCode] = useState('');
  const [copied, setCopied] = useState(false);
  
  // 新建组织表单
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgCode, setNewOrgCode] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (searchQuery) params.search = searchQuery;
      if (statusFilter !== 'all') params.status = statusFilter;

      const response = await axiosForBackend.get('/api/tenant/organizations', { params });
      setOrganizations(response.data.items || []);
    } catch (error) {
      toast.error('获取组织列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrganization = async () => {
    if (!newOrgName.trim() || !newOrgCode.trim()) {
      toast.error('请输入组织名称和编码');
      return;
    }

    if (!/^[a-z0-9-]+$/.test(newOrgCode)) {
      toast.error('组织编码只能包含小写字母、数字和连字符');
      return;
    }

    try {
      setCreating(true);
      await axiosForBackend.post('/api/tenant/organizations', {
        name: newOrgName,
        code: newOrgCode,
      });
      toast.success('组织创建成功');
      setCreateDialogOpen(false);
      setNewOrgName('');
      setNewOrgCode('');
      fetchOrganizations();
    } catch (error: any) {
      toast.error(error.response?.data?.message || '创建失败');
    } finally {
      setCreating(false);
    }
  };

  const handleCreateInviteCode = async (orgId: string) => {
    try {
      const response = await axiosForBackend.post(`/api/tenant/organizations/${orgId}/invite-codes`, {
        role: 'member',
        maxUses: 1,
        expiresDays: 7,
      });
      setInviteCode(response.data.inviteCode);
      setInviteDialogOpen(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || '创建邀请码失败');
    }
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('邀请码已复制');
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      active: { label: '正常', className: 'bg-green-100 text-green-800' },
      suspended: { label: '暂停', className: 'bg-yellow-100 text-yellow-800' },
      inactive: { label: '停用', className: 'bg-red-100 text-red-800' },
    };
    return map[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">组织管理</h1>
          <p className="text-muted-foreground">管理系统中的所有租户组织</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          新建组织
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">总组织数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              {organizations.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">正常运营</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-green-600" />
              {organizations.filter(o => o.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">已暂停</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <Settings className="w-5 h-5 text-yellow-600" />
              {organizations.filter(o => o.status !== 'active').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和筛选 */}
      <Card>
        <CardHeader>
          <CardTitle>组织列表</CardTitle>
          <CardDescription>查看和管理所有租户组织</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="搜索组织名称或编码..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="筛选状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="active">正常</SelectItem>
                <SelectItem value="suspended">暂停</SelectItem>
                <SelectItem value="inactive">停用</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchOrganizations} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* 表格 */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>组织名称</TableHead>
                  <TableHead>编码</TableHead>
                  <TableHead>数据库</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                    </TableCell>
                  </TableRow>
                ) : organizations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      暂无组织数据
                    </TableCell>
                  </TableRow>
                ) : (
                  organizations.map((org) => {
                    const status = getStatusLabel(org.status);
                    return (
                      <TableRow key={org.id}>
                        <TableCell>
                          <div className="font-medium">{org.name}</div>
                          {org.description && (
                            <div className="text-xs text-gray-500">{org.description}</div>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{org.code}</TableCell>
                        <TableCell>
                          <div className="text-sm">{org.dbName}</div>
                          <div className="text-xs text-gray-500">{org.dbHost}</div>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.className}`}>
                            {status.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(org.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCreateInviteCode(org.id)}
                          >
                            邀请码
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 创建组织对话框 */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建新组织</DialogTitle>
            <DialogDescription>
              创建一个新的组织，系统将为其分配独立的数据库。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-1 block">组织名称</label>
              <Input
                placeholder="请输入组织名称"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">组织编码</label>
              <Input
                placeholder="example-company"
                value={newOrgCode}
                onChange={(e) => setNewOrgCode(e.target.value.toLowerCase())}
              />
              <p className="text-xs text-gray-500 mt-1">仅支持小写字母、数字和连字符</p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreateOrganization} disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  创建中...
                </>
              ) : (
                '创建'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 邀请码对话框 */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>邀请码已生成</DialogTitle>
            <DialogDescription>
              将邀请码分享给需要加入组织的成员
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-gray-100 px-4 py-3 rounded-lg text-lg font-mono tracking-wider">
                {inviteCode}
              </code>
              <Button variant="outline" size="icon" onClick={copyInviteCode}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              邀请码有效期为7天，可使用1次
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
