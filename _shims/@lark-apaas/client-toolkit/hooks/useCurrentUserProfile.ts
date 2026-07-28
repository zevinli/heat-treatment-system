import { useState, useEffect } from 'react';

export interface UserProfile { id: string; name: string; avatar?: string; email?: string; department?: string; }

export function useCurrentUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    setProfile({ id: userId || 'unknown', name: userName || 'Unknown' });
    setLoading(false);
  }, []);
  return { profile, loading };
}
export default useCurrentUserProfile;
