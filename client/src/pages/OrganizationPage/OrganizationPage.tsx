import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Building2, Plus, Users, Settings, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';

interface Organization {
  id: string;
  code: string;
  name: string;
  role: 'super_admin' | 'admin' | 'member';
  status: 'active' | 'suspended' | 'inactive';
  createdAt: string;
}

// 本地存储键名
const LOCAL_ORGS_KEY = 'heat_treatment_local_orgs';

// 从 localStorage 读取本地组织列表
function getLocalOrgs(): Organization[] {
  try {
    const raw = localStorage.getItem(LOCAL_ORGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// 保存组织到 localStorage
function saveLocalOrg(org: Organization): void {
  const orgs = [org, ...getLocalOrgs()];
  localStorage.setItem(LOCAL_ORGS_KEY, JSON.stringify(orgs));
}

export default function OrganizationPage() {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgCode, setNewOrgCode] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      // 先尝试从服务器获取
      const response = await axiosForBackend.get('/api/tenant/my-organizations');
      const remoteOrgs = response.data.items || [];
      // 合并本地组织
      const localOrgs = getLocalOrgs();
      const merged = [...remoteOrgs];
      for (const localOrg of localOrgs) {
        if (!merged.find(o => o.code === localOrg.code)) {
          merged.push(localOrg);
        }
      }
      setOrganizations(merged);
    } catch {
      // 服务器不可用时使用本地数据
      const localOrgs = getLocalOrgs();
      setOrganizations(localOrgs);
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
      
      let org: Organization;
      
      try {
        // 尝试通过 API 创建
        await axiosForBackend.post('/api/tenant/organizations', {
          name: newOrgName.trim(),
          code: newOrgCode.trim(),
        });
        org = {
          id: newOrgCode.trim(),
          code: newOrgCode.trim(),
          name: newOrgName.trim(),
          role: 'super_admin',
          status: 'active',
          createdAt: new Date().toISOString(),
        };
      } catch (apiError) {
        // API 失败则本地创建
        const localOrgs = getLocalOrgs();
        if (localOrgs.find(o => o.code === newOrgCode.trim())) {
          toast.error('组织编码已存在');
          setCreating(false);
          return;
        }
        org = {
          id: 'local_' + Date.now(),
          code: newOrgCode.trim(),
          name: newOrgName.trim(),
          role: 'super_admin',
          status: 'active',
          createdAt: new Date().toISOString(),
        };
        saveLocalOrg(org);
      }
      
      toast.success('组织创建成功！正在进入系统...');
      setDialogOpen(false);
      setNewOrgName('');
      setNewOrgCode('');
      
      // 自动选中并进入
      localStorage.setItem('currentOrgCode', org.code);
      localStorage.setItem('currentOrgId', org.id);
      localStorage.setItem('currentOrgName', org.name);
      
      setTimeout(() => {
        navigate('/', { replace: true });
        window.location.reload();
      }, 500);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || '创建失败，请重试');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinOrganization = async () => {
    if (!inviteCode.trim()) {
      toast.error('请输入邀请码');
      return;
    }

    try {
      setJoining(true);
      await axiosForBackend.post('/api/tenant/join', {
        inviteCode: inviteCode.toUpperCase(),
      });
      toast.success('加入组织成功');
      setJoinDialogOpen(false);
      setInviteCode('');
      fetchOrganizations();
    } catch (error: any) {
      toast.error(error.response?.data?.message || '加入失败');
    } finally {
      setJoining(false);
    }
  };

  const handleSelectOrg = (org: Organization) => {
    localStorage.setItem('currentOrgCode', org.code);
    localStorage.setItem('currentOrgId', org.id);
    localStorage.setItem('currentOrgName', org.name);
    
    navigate('/', { replace: true });
    window.location.reload();
  };

  const getRoleLabel = (role: string) => {
    const map: Record<string, string> = {
      super_admin: '超级管理员',
      admin: '管理员',
      member: '成员',
    };
    return map[role] || role;
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      active: { label: '正常', className: 'text-green-600 bg-green-50' },
      suspended: { label: '暂停', className: 'text-yellow-600 bg-yellow-50' },
      inactive: { label: '停用', className: 'text-red-600 bg-red-50' },
    };
    return map[status] || { label: status, className: 'text-gray-600 bg-gray-50' };
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">选择组织</h1>
          <p className="text-gray-600">选择一个组织进入系统，或创建新组织</p>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-center gap-4 mb-8">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                创建组织
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>创建新组织</DialogTitle>
                <DialogDescription>
                  创建属于您自己的组织空间
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">组织名称</label>
                  <Input
                    placeholder="例如：我的公司"
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">组织编码</label>
                  <Input
                    placeholder="例如：my-company"
                    value={newOrgCode}
                    onChange={(e) => setNewOrgCode(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  />
                  <p className="text-xs text-gray-500 mt-1">编码用于系统内部识别，只能包含小写字母、数字和连字符</p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
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

          <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Users className="w-4 h-4" />
                加入组织
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>加入组织</DialogTitle>
                <DialogDescription>
                  输入邀请码加入已有组织
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">邀请码</label>
                  <Input
                    placeholder="输入8位邀请码"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    maxLength={8}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setJoinDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleJoinOrganization} disabled={joining}>
                  {joining ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      加入中...
                    </>
                  ) : (
                    '加入'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="ghost" onClick={fetchOrganizations} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* 组织列表 */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : organizations.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">暂无组织</h3>
              <p className="text-gray-500 mb-4">您还没有加入任何组织</p>
              <div className="flex justify-center gap-2">
                <Button onClick={() => setDialogOpen(true)}>
                  创建组织
                </Button>
                <Button variant="outline" onClick={() => setJoinDialogOpen(true)}>
                  加入组织
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {organizations.map((org) => {
              const status = getStatusLabel(org.status);
              return (
                <Card
                  key={org.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleSelectOrg(org)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{org.name}</CardTitle>
                          <CardDescription>@{org.code}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.className}`}>
                          {status.label}
                        </span>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Settings className="w-4 h-4" />
                        {getRoleLabel(org.role)}
                      </span>
                      <span>创建于 {new Date(org.createdAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
