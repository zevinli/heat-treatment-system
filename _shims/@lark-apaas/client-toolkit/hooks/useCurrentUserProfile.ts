import { useState, useEffect } from 'react';

export interface UserProfile { id: string; name: string; avatar?: string; email?: string; department?: string; }

export function useCurrentUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const stored = localStorage.getItem('__global_heat_current_user');
    let user: { id?: string; name?: string; username?: string } | null = null;
    try { user = stored ? JSON.parse(stored) : null; } catch { user = null; }
    setProfile({ id: user?.id || 'unknown', name: user?.name || user?.username || '未知用户' });
    setLoading(false);
  }, []);
  return profile || { id: 'unknown', name: '未知用户' };
}
export default useCurrentUserProfile;
