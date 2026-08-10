export { logger } from './logger';
export { axiosForBackend } from './utils/getAxiosForBackend';
export { Table } from './antd-table';
export { AppContainer } from './components/AppContainer';
export { ErrorRender } from './components/ErrorRender';
export { UniversalLink } from './components/UniversalLink';
export { useCurrentUserProfile } from './hooks/useCurrentUserProfile';
export { getDataloom } from './dataloom';
export { getDefaultBucketId } from './tools/storage';
export type { UserInfo, SearchAvatar, DepartmentInfo } from './tools/services';
export type { ColumnType, TableProps } from './antd-table';

import { axiosForBackend } from './utils/getAxiosForBackend';

export async function request(config: { url: string; method?: string; data?: unknown; params?: Record<string, unknown>; headers?: Record<string, string> }): Promise<any> {
  const response = await axiosForBackend(config);
  return response.data;
}

export class ApiService {
  backend: boolean;
  constructor(options: { backend?: boolean } = {}) { this.backend = options.backend ?? true; }
  async request(options: { url?: string; method?: string; data?: unknown; params?: Record<string, unknown> } = {}): Promise<any> {
    const res = await axiosForBackend({ url: options.url, method: options.method || 'GET', data: options.data, params: options.params });
    return res.data;
  }
}

export { useAuth as useAuthFromToolkit } from './hooks/useAuth';

// capabilityClient with load() method - returns result with any properties
export const capabilityClient = {
  load: (capabilityId: string) => ({
    call: async <T = any>(method: string, params?: Record<string, unknown>): Promise<any> => {
      console.log('[CapabilityClient] Calling', method, 'on', capabilityId);
      return { success: true, content: '', data: {} };
    },
    async *callStream<T = any>(method: string, params?: Record<string, unknown>): AsyncGenerator<T> {
      console.log('[CapabilityClient] Streaming', method, 'on', capabilityId, params);
      yield { content: '智能分析服务尚未配置，请联系管理员配置后重试。' } as T;
    },
  }),
  async run(config: { capabilityId: string; params?: Record<string, unknown> }): Promise<any> {
    console.log('[CapabilityClient] Running:', config.capabilityId);
    return { success: true };
  },
};

import React from 'react';
export function UserAvatar({ userId: _uid, userName, size = 32, className }: { userId?: string; userName?: string; size?: number; className?: string }) {
  return React.createElement('div', {
    className,
    style: { width: size, height: size, borderRadius: '50%', backgroundColor: '#6366f1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.4, fontWeight: 600 },
  }, (userName || 'U')[0].toUpperCase());
}
