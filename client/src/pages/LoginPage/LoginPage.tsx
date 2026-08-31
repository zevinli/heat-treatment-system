import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Package, Lock, User, Eye, EyeOff, Loader2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { setCurrentUser, getCurrentUser } from '@/lib/auth-session';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const persistLoginSession = (token: string, user: any) => {
    if (!token || !user?.id) throw new Error('服务器未返回有效的登录凭证');
    const roleMap: Record<string, { id: string; name: string }> = {
      admin: { id: '1', name: '系统管理员' },
      operator: { id: '2', name: '操作员' },
      finance: { id: '4', name: '财务人员' },
      viewer: { id: '5', name: '只读成员' },
    };
    const mappedRole = roleMap[user.role] || roleMap.viewer;
    localStorage.setItem('authToken', token);
    localStorage.removeItem('currentOrgId');
    localStorage.removeItem('currentOrgCode');
    localStorage.removeItem('currentOrgName');
    setCurrentUser({
      id: user.id,
      username: user.username,
      name: user.name,
      roleId: mappedRole.id,
      roleName: mappedRole.name,
      accountRoleId: mappedRole.id,
      accountRoleName: mappedRole.name,
      department: user.department || '',
      status: 'active' as const,
      lastLogin: user.lastLogin || new Date().toLocaleString('zh-CN'),
      deviceLimit: user.deviceLimit || 1,
    });
  };

  // 检查是否已登录
  useEffect(() => {
    const currentUser = getCurrentUser();
    const authToken = localStorage.getItem('authToken');
    // 只有用户缓存和有效登录凭证同时存在时才跳过登录页。
    // 过去仅检查用户缓存，会让已过期/已清除 token 的用户在首页与登录页之间循环，
    // 表现为点击“登录”完全没有反应。
    if (currentUser && authToken) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      toast.error('请输入用户名和密码');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axiosForBackend.post('/api/auth/login', {
        username: username.trim(),
        password,
        deviceName: navigator.userAgent,
      });
      const { token, user } = response.data;
      persistLoginSession(token, user);
      toast.success(`欢迎回来，${user.name}！`);
      navigate('/organizations');
    } catch (error: any) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('heat_treatment_current_user');
      toast.error(error?.response?.data?.error?.message || error?.response?.data?.message || error.message || '登录失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedUsername = username.trim();
    if (!name.trim()) {
      toast.error('请输入姓名');
      return;
    }
    if (!/^[A-Za-z0-9_.-]{3,50}$/.test(normalizedUsername)) {
      toast.error('用户名需为3-50位字母、数字、点、横线或下划线');
      return;
    }
    if (password.length < 8 || password.length > 128) {
      toast.error('密码长度需为8-128位');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('两次输入的密码不一致');
      return;
    }
    setIsLoading(true);
    try {
      let response = await axiosForBackend.post('/api/auth/register', {
        name: name.trim(),
        username: normalizedUsername,
        password,
        deviceName: navigator.userAgent,
      });
      // 兼容滚动部署期间仍返回“用户信息”的旧服务版本。
      if (!response.data?.token) {
        response = await axiosForBackend.post('/api/auth/login', {
          username: normalizedUsername,
          password,
          deviceName: navigator.userAgent,
        });
      }
      persistLoginSession(response.data.token, response.data.user);
      toast.success('账号创建成功，请创建组织或使用邀请码加入组织');
      navigate('/organizations', { replace: true });
    } catch (error: any) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('heat_treatment_current_user');
      toast.error(error?.response?.data?.error?.message || error?.response?.data?.message || error.message || '注册失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
              <Package className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-2xl">热处理管理系统</CardTitle>
              <CardDescription>收发货智能管理平台</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 mb-5" role="tablist" aria-label="账号操作">
              <Button type="button" variant={mode === 'login' ? 'default' : 'outline'} onClick={() => setMode('login')}>登录</Button>
              <Button type="button" variant={mode === 'register' ? 'default' : 'outline'} onClick={() => setMode('register')}>注册</Button>
            </div>
            <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
              {mode === 'register' && (
                <div className="space-y-2">
                  <Label htmlFor="name"><UserPlus className="w-4 h-4 inline mr-1" />姓名</Label>
                  <Input id="name" placeholder="请输入姓名" value={name} onChange={e => setName(e.target.value)} disabled={isLoading} autoComplete="name" />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="username">
                  <User className="w-4 h-4 inline mr-1" />
                  用户名
                </Label>
                <Input
                  id="username"
                  placeholder={mode === 'register' ? '3-50位字母、数字、点、横线或下划线' : '请输入用户名'}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">
                  <Lock className="w-4 h-4 inline mr-1" />
                  密码
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="请输入密码"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              {mode === 'register' && (
                <div className="space-y-2">
                  <Label htmlFor="confirm-password"><Lock className="w-4 h-4 inline mr-1" />确认密码</Label>
                  <Input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="请再次输入密码"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    autoComplete="new-password"
                    aria-invalid={Boolean(confirmPassword && password !== confirmPassword)}
                  />
                  {confirmPassword && password !== confirmPassword && <p className="text-xs text-error">两次输入的密码不一致</p>}
                  {confirmPassword && password === confirmPassword && <p className="text-xs text-success">密码一致</p>}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {mode === 'login' ? '登录中...' : '注册中...'}
                  </>
                ) : (
                    mode === 'login' ? '登录' : '创建账号'
                )}
              </Button>
            </form>

          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          © 2026 热处理管理系统 · 版权所有
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
