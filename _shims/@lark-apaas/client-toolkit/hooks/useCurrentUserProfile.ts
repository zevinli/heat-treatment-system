import { useState, useEffect } from 'react';

export interface UserProfile {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
  email?: string;
  phone?: string;
  department?: string;
}

export function useCurrentUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    // 与登录、权限和布局模块共用同一缓存键。旧实现读取了一个项目中从未写入的
    // `__global_heat_current_user`，导致注册/登录成功后工作台仍显示“未知用户”。
    const stored = localStorage.getItem('heat_treatment_current_user');
    let user: UserProfile | null = null;
    try { user = stored ? JSON.parse(stored) : null; } catch { user = null; }
    setProfile({
      ...(user || {}),
      id: user?.id || 'unknown',
      name: user?.name || user?.username || '未知用户',
    });
    setLoading(false);
  }, []);
  return profile || { id: 'unknown', name: '未知用户' };
}
export default useCurrentUserProfile;
