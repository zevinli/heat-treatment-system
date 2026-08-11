import { useEffect, useState } from 'react';
import { CloudOff, Wifi } from 'lucide-react';

export function NetworkStatusBanner() {
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' || navigator.onLine);
  const [recovered, setRecovered] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const handleOffline = () => {
      setRecovered(false);
      setOnline(false);
    };
    const handleOnline = () => {
      setOnline(true);
      setRecovered(true);
      timer = setTimeout(() => setRecovered(false), 4000);
    };
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (online && !recovered) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className={online
        ? 'flex min-h-10 items-center justify-center gap-2 bg-success/10 px-4 py-2 text-sm text-success'
        : 'flex min-h-10 items-center justify-center gap-2 bg-warning/15 px-4 py-2 text-sm text-foreground'}
    >
      {online ? <Wifi className="size-4" /> : <CloudOff className="size-4" />}
      {online ? '网络已恢复，未完成的同步会自动继续' : '当前网络不可用，已填写的收发货内容会保存在本组织草稿中'}
    </div>
  );
}
