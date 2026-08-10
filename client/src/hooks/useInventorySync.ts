import { useState, useEffect, useCallback, useRef } from 'react';
import { useData } from '@/data/DataContext';
import type { IProduct } from '@/data/mockData';
import { toast } from 'sonner';
import { logger } from '@lark-apaas/client-toolkit/logger';

interface InventoryChange {
  productId: string;
  type: 'inbound' | 'outbound' | 'adjust';
  quantity: number;
  weight: number;
  timestamp: number;
  operator: string;
}

interface SyncState {
  isConnected: boolean;
  lastSyncTime: number;
  pendingChanges: InventoryChange[];
}

class InventorySyncService {
  private listeners: Set<(change: InventoryChange) => void> = new Set();
  private syncInterval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private refresh: (() => Promise<void>) | null = null;
  private inFlight: Promise<void> | null = null;

  // 添加监听器
  onInventoryChange(callback: (change: InventoryChange) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // 触发库存变更
  notify(change: InventoryChange) {
    this.listeners.forEach((callback) => callback(change));
  }

  async sync(refresh = this.refresh) {
    if (!refresh) return;
    if (this.inFlight) return this.inFlight;
    this.inFlight = refresh().finally(() => {
      this.inFlight = null;
    });
    return this.inFlight;
  }

  // 单例轮询：无论多少组件订阅，全局只发起一组30秒请求。
  start(refresh: () => Promise<void>) {
    this.refresh = refresh;
    if (this.isRunning) return;
    this.isRunning = true;
    this.syncInterval = setInterval(() => {
      void this.sync().catch((error) => logger.warn('库存自动同步失败', error));
    }, 30000);
  }

  // 停止同步
  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.isRunning = false;
  }
}

// 单例模式
const syncService = new InventorySyncService();

export const useInventorySync = () => {
  const { products, refreshProducts } = useData();
  const [syncState, setSyncState] = useState<SyncState>({
    isConnected: true,
    lastSyncTime: Date.now(),
    pendingChanges: [],
  });
  const [recentChanges, setRecentChanges] = useState<InventoryChange[]>([]);
  const changesRef = useRef<InventoryChange[]>([]);

  // 记录库存变更
  const recordChange = useCallback(
    (change: Omit<InventoryChange, 'timestamp'>) => {
      const fullChange: InventoryChange = {
        ...change,
        timestamp: Date.now(),
      };

      changesRef.current = [fullChange, ...changesRef.current].slice(0, 50);
      setRecentChanges(changesRef.current);

      // 通知其他组件
      syncService.notify(fullChange);

      // 更新同步状态
      setSyncState((prev) => ({
        ...prev,
        lastSyncTime: Date.now(),
      }));

      // 显示通知
      const actionText =
        change.type === 'inbound' ? '入库' : change.type === 'outbound' ? '出库' : '调整';
      toast.success(
        `${actionText}操作已同步 - 产品ID: ${change.productId}, 数量: ${change.quantity}`
      );
    },
    []
  );

  // 手动触发同步
  const manualSync = useCallback(async () => {
    setSyncState((prev) => ({ ...prev, isConnected: false }));

    try {
      await syncService.sync(refreshProducts);

      setSyncState({
        isConnected: true,
        lastSyncTime: Date.now(),
        pendingChanges: [],
      });

      toast.success('库存数据同步成功');
    } catch (error) {
      setSyncState((prev) => ({ ...prev, isConnected: false }));
      toast.error('库存同步失败');
    }
  }, [refreshProducts]);

  // 监听库存变更
  useEffect(() => {
    syncService.start(refreshProducts);

    const unsubscribe = syncService.onInventoryChange(() => {
      // 数据变更通知
    });

    const channel = typeof BroadcastChannel !== 'undefined'
      ? new BroadcastChannel('heat-inventory-sync')
      : null;
    channel?.addEventListener('message', () => {
      void syncService.sync(refreshProducts).then(() => {
        setSyncState((prev) => ({ ...prev, isConnected: true, lastSyncTime: Date.now() }));
      }).catch(() => setSyncState((prev) => ({ ...prev, isConnected: false })));
    });

    return () => {
      unsubscribe();
      channel?.close();
    };
  }, [refreshProducts]);

  // 检查库存预警
  const checkStockAlerts = useCallback(
    (threshold: number = 10) => {
      const alerts = products.filter((p) => p.stock <= threshold && p.stock > 0);
      const outOfStock = products.filter((p) => p.stock === 0);

      return {
        alerts,
        outOfStock,
        total: products.length,
        lowStockCount: alerts.length,
        outOfStockCount: outOfStock.length,
      };
    },
    [products]
  );

  // 获取库存统计
  const getInventoryStats = useCallback(() => {
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
    const totalValue = products.reduce(
      (sum, p) => sum + p.stock * p.unitPrice,
      0
    );
    const lowStockItems = products.filter((p) => p.stock < 10).length;

    return {
      totalProducts,
      totalStock,
      totalValue,
      lowStockItems,
    };
  }, [products]);

  // 获取产品库存变动历史
  const getProductHistory = useCallback(
    (productId: string) => {
      return changesRef.current.filter((c) => c.productId === productId);
    },
    []
  );

  return {
    inventoryData: products,
    lastSyncTime: new Date(syncState.lastSyncTime),
    isSyncing: !syncState.isConnected,
    forceSync: manualSync,
    syncState,
    recentChanges,
    recordChange,
    manualSync,
    checkStockAlerts,
    getInventoryStats,
    getProductHistory,
  };
};

// 使用本地存储实现跨标签页同步
export const useCrossTabSync = () => {
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'inventory_last_update') {
        // 通知数据已更新
        window.dispatchEvent(new CustomEvent('inventory-updated'));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const notifyOtherTabs = useCallback(() => {
    localStorage.setItem('inventory_last_update', Date.now().toString());
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('heat-inventory-sync');
      channel.postMessage({ type: 'inventory-updated', at: Date.now() });
      channel.close();
    }
  }, []);

  return { notifyOtherTabs };
};

export default useInventorySync;
