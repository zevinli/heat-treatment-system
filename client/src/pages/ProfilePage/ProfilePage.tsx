import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUserProfile } from '@lark-apaas/client-toolkit/hooks/useCurrentUserProfile';
import { getDataloom } from '@lark-apaas/client-toolkit/dataloom';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Camera, 
  Lock, 
  Shield, 
  Bell, 
  Save, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Package,
  FileText,
  TrendingUp,
  Calendar,
  MapPin,
  Edit3,
  Eye,
  EyeOff,
  Upload,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// 用户信息类型
interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  department?: string;
  position?: string;
  joinDate?: string;
  location?: string;
}

// 业务统计类型
interface BusinessStats {
  monthlyInbound: number;
  monthlyOutbound: number;
  monthlyReconciliation: number;
  completionRate: number;
  pendingTasks: number;
  totalTasks: number;
}

// 头像上传组件
const AvatarUpload: React.FC<{
  avatar?: string;
  name: string;
  onUpload: (file: File) => Promise<void>;
  uploading?: boolean;
}> = ({ avatar, name, onUpload, uploading }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('图片大小不能超过5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('请上传图片文件');
        return;
      }
      await onUpload(file);
    }
  };

  return (
    <div className="relative group">
      <Avatar className="w-32 h-32 border-4 border-background shadow-xl">
        <AvatarImage src={avatar} className="object-cover" />
        <AvatarFallback className="text-3xl bg-gradient-to-br from-primary to-primary-dark text-primary-foreground">
          {name?.charAt(0) || 'U'}
        </AvatarFallback>
      </Avatar>
      
      <button
        onClick={handleClick}
        disabled={uploading}
        className={cn(
          "absolute -bottom-2 -right-2 p-2.5 rounded-full",
          "bg-primary text-primary-foreground shadow-lg",
          "hover:bg-primary/90 transition-all duration-200",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "border-2 border-background"
        )}
      >
        {uploading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Camera className="w-4 h-4" />
        )}
      </button>
      
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      
      {/* 悬停提示 */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-full cursor-pointer" onClick={handleClick}>
        <span className="text-white text-xs font-medium">更换头像</span>
      </div>
    </div>
  );
};

// 统计卡片
const StatCard: React.FC<{
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend?: { value: number; positive: boolean };
}> = ({ title, value, description, icon, trend }) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardContent className="p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold">{value}</h3>
            {trend && (
              <span className={cn(
                "text-xs font-medium px-1.5 py-0.5 rounded-full",
                trend.positive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
              )}>
                {trend.positive ? '+' : ''}{trend.value}%
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

// 密码修改表单
const PasswordForm: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('两次输入的新密码不一致');
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error('新密码长度至少6位');
      return;
    }
    
    setLoading(true);
    try {
      // 这里调用后端API修改密码
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('密码修改成功');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error('密码修改失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="currentPassword">当前密码</Label>
        <div className="relative">
          <Input
            id="currentPassword"
            type={showPassword ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="请输入当前密码"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword">新密码</Label>
        <Input
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="请输入新密码（至少6位）"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">确认新密码</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="请再次输入新密码"
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        修改密码
      </Button>
    </form>
  );
};

// 主页面组件
const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const currentProfile = useCurrentUserProfile();
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  // 用户资料状态
  const [profile, setProfile] = useState<UserProfile>({
    id: (currentProfile as any)?.id || '',
    name: currentProfile?.name || '',
    email: (currentProfile as any)?.email || '',
    phone: (currentProfile as any)?.phone || '',
    avatar: (currentProfile as any)?.avatar,
    department: '热处理车间',
    position: '仓库管理员',
    joinDate: '2024-01-15',
    location: '北京',
  });

  // 编辑状态
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(profile);

  // 业务统计
  const [stats, setStats] = useState<BusinessStats>({
    monthlyInbound: 128,
    monthlyOutbound: 96,
    monthlyReconciliation: 45,
    completionRate: 87,
    pendingTasks: 12,
    totalTasks: 156,
  });

  // 头像上传
  const handleAvatarUpload = async (file: File) => {
    setUploadingAvatar(true);
    try {
      const dataloom = await getDataloom();
      const bucketId = await (dataloom.storage as any).getDefaultBucketId();
      const result = await (dataloom.storage as any).uploadFile(bucketId, file);
      
      setProfile(prev => ({ ...prev, avatar: result.download_url }));
      toast.success('头像上传成功');
    } catch (error) {
      logger.error('头像上传失败:', error);
      toast.error('头像上传失败');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // 保存资料
  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      // 这里调用后端API保存用户信息
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProfile(editedProfile);
      setIsEditing(false);
      toast.success('个人资料保存成功');
    } catch (error) {
      toast.error('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">个人中心</h1>
          <p className="text-sm text-muted-foreground mt-1">管理您的个人信息和账户设置</p>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} variant="outline">
              <Edit3 className="w-4 h-4 mr-2" />
              编辑资料
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleCancelEdit}>
                <X className="w-4 h-4 mr-2" />
                取消
              </Button>
              <Button onClick={handleSaveProfile} disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Save className="w-4 h-4 mr-2" />
                保存
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：个人信息卡片 */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <AvatarUpload
                  avatar={profile.avatar}
                  name={profile.name}
                  onUpload={handleAvatarUpload}
                  uploading={uploadingAvatar}
                />
                
                <h2 className="mt-4 text-xl font-bold">{profile.name}</h2>
                <p className="text-sm text-muted-foreground">{profile.position}</p>
                
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary">{profile.department}</Badge>
                </div>

                <Separator className="my-4" />

                <div className="w-full space-y-3 text-sm">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span className="flex-1 text-left truncate">{profile.email || '未设置邮箱'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span className="flex-1 text-left">{profile.phone || '未设置电话'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span className="flex-1 text-left">{profile.location}</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span className="flex-1 text-left">加入时间：{profile.joinDate}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 业务完成度 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">本月业务完成度</CardTitle>
              <CardDescription>任务完成情况统计</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">总体完成率</span>
                  <span className="text-sm font-bold text-primary">{stats.completionRate}%</span>
                </div>
                <Progress value={stats.completionRate} className="h-2" />
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{stats.pendingTasks}</p>
                  <p className="text-xs text-muted-foreground">待处理任务</p>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{stats.totalTasks}</p>
                  <p className="text-xs text-muted-foreground">总任务数</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧：详细信息和设置 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 业务统计卡片 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="本月入库"
              value={stats.monthlyInbound}
              description="较上月 +12%"
              icon={<Package className="w-5 h-5" />}
              trend={{ value: 12, positive: true }}
            />
            <StatCard
              title="本月出库"
              value={stats.monthlyOutbound}
              description="较上月 +8%"
              icon={<TrendingUp className="w-5 h-5" />}
              trend={{ value: 8, positive: true }}
            />
            <StatCard
              title="本月对账"
              value={stats.monthlyReconciliation}
              description="较上月 -3%"
              icon={<FileText className="w-5 h-5" />}
              trend={{ value: -3, positive: false }}
            />
          </div>

          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info">基本信息</TabsTrigger>
              <TabsTrigger value="security">安全设置</TabsTrigger>
              <TabsTrigger value="notifications">通知偏好</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>基本信息</CardTitle>
                  <CardDescription>管理您的个人资料</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">姓名</Label>
                      <Input
                        id="name"
                        value={isEditing ? editedProfile.name : profile.name}
                        onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">邮箱</Label>
                      <Input
                        id="email"
                        type="email"
                        value={isEditing ? editedProfile.email : profile.email}
                        onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">电话</Label>
                      <Input
                        id="phone"
                        value={isEditing ? editedProfile.phone : profile.phone}
                        onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="position">职位</Label>
                      <Input
                        id="position"
                        value={isEditing ? editedProfile.position : profile.position}
                        onChange={(e) => setEditedProfile({ ...editedProfile, position: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">部门</Label>
                      <Input
                        id="department"
                        value={isEditing ? editedProfile.department : profile.department}
                        onChange={(e) => setEditedProfile({ ...editedProfile, department: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">所在地</Label>
                      <Input
                        id="location"
                        value={isEditing ? editedProfile.location : profile.location}
                        onChange={(e) => setEditedProfile({ ...editedProfile, location: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>安全设置</CardTitle>
                  <CardDescription>修改您的登录密码</CardDescription>
                </CardHeader>
                <CardContent>
                  <PasswordForm />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>通知偏好</CardTitle>
                  <CardDescription>管理您接收通知的方式</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { id: 'email', label: '邮件通知', description: '接收重要业务的邮件提醒', icon: Mail },
                    { id: 'sms', label: '短信通知', description: '接收紧急事项的短信提醒', icon: Phone },
                    { id: 'system', label: '系统通知', description: '在系统内接收实时消息', icon: Bell },
                  ].map((item) => (
                    <div key={item.id} className="flex items-start gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <item.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{item.label}</h4>
                          <input
                            type="checkbox"
                            defaultChecked
                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
