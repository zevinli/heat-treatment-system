import { useEffect, useRef, useState } from 'react';
import { CloudOff, Wifi } from 'lucide-react';

export function NetworkStatusBanner() {
  // navigator.onLine 在 WebView、代理和部分工厂内网环境中经常误报。
  // 业务能否保存取决于应用后端是否可达，因此用同源健康检查作为最终依据。
  const [online, setOnline] = useState(true);
  const [recovered, setRecovered] = useState(false);
  const onlineRef = useRef(true);

  useEffect(() => {
    let active = true;
    let recoveryTimer: ReturnType<typeof setTimeout> | undefined;
    let probeController: AbortController | undefined;

    const updateOnline = (nextOnline: boolean, showRecovery: boolean) => {
      if (!active) return;
      const wasOnline = onlineRef.current;
      onlineRef.current = nextOnline;
      setOnline(nextOnline);
      if (!nextOnline) {
        setRecovered(false);
      } else if (showRecovery && !wasOnline) {
        setRecovered(true);
        if (recoveryTimer) clearTimeout(recoveryTimer);
        recoveryTimer = setTimeout(() => setRecovered(false), 4000);
      }
    };

    const probeBackend = async (showRecovery = true) => {
      probeController?.abort();
      probeController = new AbortController();
      const timeout = window.setTimeout(() => probeController?.abort(), 5000);
      try {
        const response = await fetch('/api/health', {
          cache: 'no-store',
          credentials: 'same-origin',
          signal: probeController.signal,
        });
        updateOnline(response.ok, showRecovery);
      } catch {
        updateOnline(false, false);
      } finally {
        window.clearTimeout(timeout);
      }
    };

    const handleNetworkChange = () => { void probeBackend(true); };
    void probeBackend(false);
    const probeInterval = window.setInterval(() => { void probeBackend(true); }, 30000);
    window.addEventListener('offline', handleNetworkChange);
    window.addEventListener('online', handleNetworkChange);
    return () => {
      active = false;
      probeController?.abort();
      window.clearInterval(probeInterval);
      window.removeEventListener('offline', handleNetworkChange);
      window.removeEventListener('online', handleNetworkChange);
      if (recoveryTimer) clearTimeout(recoveryTimer);
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
