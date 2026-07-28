import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Package, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { setCurrentUser, getCurrentUser } from '@/pages/PermissionPage/PermissionPage';

// 模拟用户数据库
const MOCK_USERS = [
  { id: '1', username: 'admin', password: 'admin123', name: '系统管理员', roleId: '1', roleName: '系统管理员', department: '技术部' },
  { id: '2', username: 'shouhuo', password: '123456', name: '收货员', roleId: '2', roleName: '收货员', department: '收货部' },
  { id: '3', username: 'fahuo', password: '123456', name: '发货员', roleId: '3', roleName: '发货员', department: '发货部' },
  { id: '4', username: 'caiwu', password: '123456', name: '财务', roleId: '4', roleName: '财务人员', department: '财务部' },
];

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 检查是否已登录
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      navigate('/');
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      toast.error('请输入用户名和密码');
      return;
    }

    setIsLoading(true);

    // 模拟登录延迟
    setTimeout(() => {
      const user = MOCK_USERS.find(
        (u) => u.username === username && u.password === password
      );

      if (user) {
        const userInfo = {
          id: user.id,
          username: user.username,
          name: user.name,
          roleId: user.roleId,
          roleName: user.roleName,
          department: user.department,
          status: 'active' as const,
          lastLogin: new Date().toLocaleString('zh-CN'),
          deviceLimit: 3,
        };

        setCurrentUser(userInfo);
        toast.success(`欢迎回来，${user.name}！`);
        navigate('/');
      } else {
        toast.error('用户名或密码错误');
      }

      setIsLoading(false);
    }, 800);
  };

  const handleQuickLogin = (type: string) => {
    const users: Record<string, { username: string; password: string }> = {
      admin: { username: 'admin', password: 'admin123' },
      shouhuo: { username: 'shouhuo', password: '123456' },
      fahuo: { username: 'fahuo', password: '123456' },
      caiwu: { username: 'caiwu', password: '123456' },
    };

    const creds = users[type];
    if (creds) {
      setUsername(creds.username);
      setPassword(creds.password);
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
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">
                  <User className="w-4 h-4 inline mr-1" />
                  用户名
                </Label>
                <Input
                  id="username"
                  placeholder="请输入用户名"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
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
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    登录中...
                  </>
                ) : (
                  '登录'
                )}
              </Button>
            </form>

            <div className="mt-6">
              <p className="text-sm text-muted-foreground text-center mb-3">快速登录（演示）</p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                  onClick={() => handleQuickLogin('admin')}
                >
                  管理员
                </Badge>
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                  onClick={() => handleQuickLogin('shouhuo')}
                >
                  收货员
                </Badge>
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                  onClick={() => handleQuickLogin('fahuo')}
                >
                  发货员
                </Badge>
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                  onClick={() => handleQuickLogin('caiwu')}
                >
                  财务
                </Badge>
              </div>
            </div>
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
