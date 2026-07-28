

---

## 第65章 前端 API 层完整实现参考

### 65.1 API 层架构

前端 API 请求统一封装在 `client/src/api/` 目录下，按模块拆分文件，通过桶导出聚合。

```
client/src/api/
├── index.ts           # 桶导出
├── customer.ts        # 客户管理 API
├── product.ts         # 产品管理 API
├── inbound.ts         # 入库管理 API
├── outbound.ts        # 出库管理 API
├── inventory.ts       # 库存管理 API
├── reconciliation.ts  # 对账管理 API
├── statistics.ts      # 统计报表 API
├── organization.ts    # 组织管理 API
├── rbac.ts            # 权限管理 API
├── template.ts        # 打印模板 API
└── dashboard.ts       # 工作台 API
```

### 65.2 桶导出文件

```typescript
// client/src/api/index.ts
export * as customerApi from './customer';
export * as productApi from './product';
export * as inboundApi from './inbound';
export * as outboundApi from './outbound';
export * as inventoryApi from './inventory';
export * as reconciliationApi from './reconciliation';
export * as statisticsApi from './statistics';
export * as organizationApi from './organization';
export * as rbacApi from './rbac';
export * as templateApi from './template';
export * as dashboardApi from './dashboard';
```

### 65.3 客户 API

```typescript
// client/src/api/customer.ts
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  Customer,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CustomerListParams,
  CustomerSearchItem,
  CustomerHistory,
  PaginatedResponse,
} from '@shared/api.interface';

export async function getList(params: CustomerListParams): Promise<PaginatedResponse<Customer>> {
  const { data } = await axiosForBackend.get('/api/customers', { params });
  return data;
}

export async function getById(id: string): Promise<Customer> {
  const { data } = await axiosForBackend.get(`/api/customers/${id}`);
  return data;
}

export async function create(req: CreateCustomerRequest): Promise<Customer> {
  const { data } = await axiosForBackend.post('/api/customers', req);
  return data;
}

export async function update(id: string, req: UpdateCustomerRequest): Promise<Customer> {
  const { data } = await axiosForBackend.put(`/api/customers/${id}`, req);
  return data;
}

export async function remove(id: string): Promise<{ id: string }> {
  const { data } = await axiosForBackend.delete(`/api/customers/${id}`);
  return data;
}

export async function search(q: string, limit = 20): Promise<{ items: CustomerSearchItem[] }> {
  const { data } = await axiosForBackend.get('/api/customers/search', {
    params: { q, limit },
  });
  return data;
}

export async function getHistory(id: string): Promise<CustomerHistory> {
  const { data } = await axiosForBackend.get(`/api/customers/${id}/history`);
  return data;
}

export async function getAll(): Promise<Customer[]> {
  const { data } = await axiosForBackend.get('/api/customers', {
    params: { pageSize: 1000 },
  });
  return data.items;
}
```

### 65.4 产品 API

```typescript
// client/src/api/product.ts
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  Product,
  ProductDetail,
  CreateProductRequest,
  UpdateProductRequest,
  ProductListParams,
  ProductSearchItem,
  ProductRecord,
  PaginatedResponse,
} from '@shared/api.interface';

export async function getList(params: ProductListParams): Promise<PaginatedResponse<Product>> {
  const { data } = await axiosForBackend.get('/api/products', { params });
  return data;
}

export async function getById(id: string): Promise<ProductDetail> {
  const { data } = await axiosForBackend.get(`/api/products/${id}`);
  return data;
}

export async function create(req: CreateProductRequest): Promise<Product> {
  const { data } = await axiosForBackend.post('/api/products', req);
  return data;
}

export async function update(id: string, req: UpdateProductRequest): Promise<Product> {
  const { data } = await axiosForBackend.put(`/api/products/${id}`, req);
  return data;
}

export async function remove(id: string): Promise<{ id: string }> {
  const { data } = await axiosForBackend.delete(`/api/products/${id}`);
  return data;
}

export async function search(
  q: string,
  options?: { material?: string; process?: string; limit?: number }
): Promise<{ items: ProductSearchItem[] }> {
  const { data } = await axiosForBackend.get('/api/products/search', {
    params: { q, ...options },
  });
  return data;
}

export async function getRecords(id: string): Promise<ProductRecord[]> {
  const { data } = await axiosForBackend.get(`/api/products/${id}/records`);
  return data;
}

export async function getAll(): Promise<Product[]> {
  const { data } = await axiosForBackend.get('/api/products', {
    params: { pageSize: 1000 },
  });
  return data.items;
}
```

### 65.5 入库 API

```typescript
// client/src/api/inbound.ts
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  InboundRecord,
  CreateInboundRequest,
  UpdateInboundRequest,
  InboundListParams,
  InboundImportResult,
  InboundStatus,
  PaginatedResponse,
} from '@shared/api.interface';

export async function getList(params: InboundListParams): Promise<PaginatedResponse<InboundRecord>> {
  const { data } = await axiosForBackend.get('/api/inbound', { params });
  return data;
}

export async function getById(id: string): Promise<InboundRecord> {
  const { data } = await axiosForBackend.get(`/api/inbound/${id}`);
  return data;
}

export async function create(req: CreateInboundRequest): Promise<InboundRecord> {
  const { data } = await axiosForBackend.post('/api/inbound', req);
  return data;
}

export async function update(id: string, req: UpdateInboundRequest): Promise<InboundRecord> {
  const { data } = await axiosForBackend.put(`/api/inbound/${id}`, req);
  return data;
}

export async function remove(id: string): Promise<{ id: string }> {
  const { data } = await axiosForBackend.delete(`/api/inbound/${id}`);
  return data;
}

export async function importExcel(file: File): Promise<InboundImportResult> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await axiosForBackend.post('/api/inbound/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function print(id: string): Promise<{ html: string }> {
  const { data } = await axiosForBackend.get(`/api/inbound/${id}/print`);
  return data;
}

export async function updateStatus(id: string, status: InboundStatus): Promise<InboundRecord> {
  const { data } = await axiosForBackend.patch(`/api/inbound/${id}/status`, { status });
  return data;
}
```

### 65.6 出库 API

```typescript
// client/src/api/outbound.ts
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  OutboundRecord,
  CreateOutboundRequest,
  UpdateOutboundRequest,
  OutboundListParams,
  OutboundStatus,
  CloseOutboundRequest,
  PaginatedResponse,
} from '@shared/api.interface';

export async function getList(params: OutboundListParams): Promise<PaginatedResponse<OutboundRecord>> {
  const { data } = await axiosForBackend.get('/api/outbound', { params });
  return data;
}

export async function getById(id: string): Promise<OutboundRecord> {
  const { data } = await axiosForBackend.get(`/api/outbound/${id}`);
  return data;
}

export async function create(req: CreateOutboundRequest): Promise<OutboundRecord> {
  const { data } = await axiosForBackend.post('/api/outbound', req);
  return data;
}

export async function update(id: string, req: UpdateOutboundRequest): Promise<OutboundRecord> {
  const { data } = await axiosForBackend.put(`/api/outbound/${id}`, req);
  return data;
}

export async function remove(id: string): Promise<{ id: string }> {
  const { data } = await axiosForBackend.delete(`/api/outbound/${id}`);
  return data;
}

export async function print(id: string): Promise<{ html: string }> {
  const { data } = await axiosForBackend.get(`/api/outbound/${id}/print`);
  return data;
}

export async function updateStatus(id: string, status: OutboundStatus): Promise<OutboundRecord> {
  const { data } = await axiosForBackend.patch(`/api/outbound/${id}/status`, { status });
  return data;
}

export async function close(id: string, req?: CloseOutboundRequest): Promise<OutboundRecord> {
  const { data } = await axiosForBackend.post(`/api/outbound/${id}/close`, req);
  return data;
}
```

### 65.7 库存 API

```typescript
// client/src/api/inventory.ts
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  InventoryItem,
  InventoryOverview,
  InventoryListParams,
  AdjustInventoryRequest,
  InventoryHistoryRecord,
  PaginatedResponse,
} from '@shared/api.interface';

export async function getList(params: InventoryListParams): Promise<PaginatedResponse<InventoryItem>> {
  const { data } = await axiosForBackend.get('/api/inventory', { params });
  return data;
}

export async function getOverview(): Promise<InventoryOverview> {
  const { data } = await axiosForBackend.get('/api/inventory/overview');
  return data;
}

export async function getByProduct(productId: string): Promise<InventoryItem> {
  const { data } = await axiosForBackend.get(`/api/inventory/product/${productId}`);
  return data;
}

export async function adjust(req: AdjustInventoryRequest): Promise<InventoryItem> {
  const { data } = await axiosForBackend.post('/api/inventory/adjust', req);
  return data;
}

export async function getHistory(
  productId: string,
  params?: { page?: number; pageSize?: number }
): Promise<PaginatedResponse<InventoryHistoryRecord>> {
  const { data } = await axiosForBackend.get(`/api/inventory/${productId}/history`, { params });
  return data;
}

export async function exportExcel(params?: InventoryListParams): Promise<Blob> {
  const { data } = await axiosForBackend.get('/api/inventory/export', {
    params,
    responseType: 'blob',
  });
  return data;
}
```

### 65.8 对账 API

```typescript
// client/src/api/reconciliation.ts
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  ReconciliationRecord,
  CreateReconciliationRequest,
  UpdateReconciliationRequest,
  ReconciliationListParams,
  ReconciliationStatus,
  ReconciliationPreview,
  PaginatedResponse,
} from '@shared/api.interface';

export async function getList(params: ReconciliationListParams): Promise<PaginatedResponse<ReconciliationRecord>> {
  const { data } = await axiosForBackend.get('/api/reconciliation', { params });
  return data;
}

export async function getById(id: string): Promise<ReconciliationRecord> {
  const { data } = await axiosForBackend.get(`/api/reconciliation/${id}`);
  return data;
}

export async function create(req: CreateReconciliationRequest): Promise<ReconciliationRecord> {
  const { data } = await axiosForBackend.post('/api/reconciliation', req);
  return data;
}

export async function update(id: string, req: UpdateReconciliationRequest): Promise<ReconciliationRecord> {
  const { data } = await axiosForBackend.put(`/api/reconciliation/${id}`, req);
  return data;
}

export async function remove(id: string): Promise<{ id: string }> {
  const { data } = await axiosForBackend.delete(`/api/reconciliation/${id}`);
  return data;
}

export async function updateStatus(id: string, status: ReconciliationStatus): Promise<ReconciliationRecord> {
  const { data } = await axiosForBackend.patch(`/api/reconciliation/${id}/status`, { status });
  return data;
}

export async function print(id: string): Promise<{ html: string }> {
  const { data } = await axiosForBackend.get(`/api/reconciliation/${id}/print`);
  return data;
}

export async function preview(req: CreateReconciliationRequest): Promise<ReconciliationPreview> {
  const { data } = await axiosForBackend.get('/api/reconciliation/preview', { params: req });
  return data;
}
```

### 65.9 统计 API

```typescript
// client/src/api/statistics.ts
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  StatisticsOverview,
  InboundStatistics,
  OutboundStatistics,
  InventoryStatistics,
  CustomerStatistics,
  ReconciliationStatistics,
  StatisticsParams,
} from '@shared/api.interface';

export async function getOverview(params?: StatisticsParams): Promise<StatisticsOverview> {
  const { data } = await axiosForBackend.get('/api/statistics/overview', { params });
  return data;
}

export async function getInboundStats(params?: StatisticsParams): Promise<InboundStatistics[]> {
  const { data } = await axiosForBackend.get('/api/statistics/inbound', { params });
  return data;
}

export async function getOutboundStats(params?: StatisticsParams): Promise<OutboundStatistics[]> {
  const { data } = await axiosForBackend.get('/api/statistics/outbound', { params });
  return data;
}

export async function getInventoryStats(): Promise<InventoryStatistics[]> {
  const { data } = await axiosForBackend.get('/api/statistics/inventory');
  return data;
}

export async function getCustomerStats(params?: StatisticsParams): Promise<CustomerStatistics[]> {
  const { data } = await axiosForBackend.get('/api/statistics/customer', { params });
  return data;
}

export async function getReconciliationStats(params?: StatisticsParams): Promise<ReconciliationStatistics[]> {
  const { data } = await axiosForBackend.get('/api/statistics/reconciliation', { params });
  return data;
}
```

### 65.10 组织 API

```typescript
// client/src/api/organization.ts
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  Organization,
  OrganizationMember,
  CreateOrganizationRequest,
  CurrentOrganization,
} from '@shared/api.interface';

export async function getMyOrganizations(): Promise<Organization[]> {
  const { data } = await axiosForBackend.get('/api/organizations/my');
  return data;
}

export async function getCurrent(): Promise<CurrentOrganization> {
  const { data } = await axiosForBackend.get('/api/organizations/current');
  return data;
}

export async function select(code: string): Promise<{ success: boolean }> {
  const { data } = await axiosForBackend.post(`/api/organizations/${code}/select`);
  return data;
}

export async function create(req: CreateOrganizationRequest): Promise<Organization> {
  const { data } = await axiosForBackend.post('/api/organizations', req);
  return data;
}

export async function getMembers(orgId: string): Promise<OrganizationMember[]> {
  const { data } = await axiosForBackend.get(`/api/organizations/${orgId}/members`);
  return data;
}

export async function inviteMember(orgId: string, userId: string, role: string): Promise<{ success: boolean }> {
  const { data } = await axiosForBackend.post(`/api/organizations/${orgId}/members/invite`, { userId, role });
  return data;
}

export async function removeMember(orgId: string, userId: string): Promise<{ success: boolean }> {
  const { data } = await axiosForBackend.delete(`/api/organizations/${orgId}/members/${userId}`);
  return data;
}
```

### 65.11 权限 API

```typescript
// client/src/api/rbac.ts
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  Role,
  PermissionGroup,
  CreateRoleRequest,
  UpdateRoleRequest,
} from '@shared/api.interface';

export async function getRoles(): Promise<Role[]> {
  const { data } = await axiosForBackend.get('/api/rbac/roles');
  return data;
}

export async function createRole(req: CreateRoleRequest): Promise<Role> {
  const { data } = await axiosForBackend.post('/api/rbac/roles', req);
  return data;
}

export async function updateRole(id: string, req: UpdateRoleRequest): Promise<Role> {
  const { data } = await axiosForBackend.put(`/api/rbac/roles/${id}`, req);
  return data;
}

export async function deleteRole(id: string): Promise<{ id: string }> {
  const { data } = await axiosForBackend.delete(`/api/rbac/roles/${id}`);
  return data;
}

export async function getPermissionTree(): Promise<PermissionGroup[]> {
  const { data } = await axiosForBackend.get('/api/rbac/permissions/tree');
  return data;
}

export async function updateRolePermissions(roleId: string, permissionIds: string[]): Promise<Role> {
  const { data } = await axiosForBackend.put(`/api/rbac/roles/${roleId}/permissions`, { permissionIds });
  return data;
}

export async function getRoleMembers(roleId: string): Promise<{ userId: string; userName: string; joinedAt: string }[]> {
  const { data } = await axiosForBackend.get(`/api/rbac/roles/${roleId}/members`);
  return data;
}

export async function addMember(roleId: string, userId: string): Promise<{ success: boolean }> {
  const { data } = await axiosForBackend.post(`/api/rbac/roles/${roleId}/members`, { userId });
  return data;
}

export async function removeMember(roleId: string, userId: string): Promise<{ success: boolean }> {
  const { data } = await axiosForBackend.delete(`/api/rbac/roles/${roleId}/members/${userId}`);
  return data;
}

export async function mockRole(bizId: string): Promise<{ success: boolean }> {
  const { data } = await axiosForBackend.post('/api/rbac/mock', { bizId });
  return data;
}
```

### 65.12 打印模板 API

```typescript
// client/src/api/template.ts
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  PrintTemplate,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  PrintPreviewResult,
} from '@shared/api.interface';

export async function getAll(): Promise<PrintTemplate[]> {
  const { data } = await axiosForBackend.get('/api/print-templates');
  return data;
}

export async function getById(id: string): Promise<PrintTemplate> {
  const { data } = await axiosForBackend.get(`/api/print-templates/${id}`);
  return data;
}

export async function create(req: CreateTemplateRequest): Promise<PrintTemplate> {
  const { data } = await axiosForBackend.post('/api/print-templates', req);
  return data;
}

export async function update(id: string, req: UpdateTemplateRequest): Promise<PrintTemplate> {
  const { data } = await axiosForBackend.put(`/api/print-templates/${id}`, req);
  return data;
}

export async function remove(id: string): Promise<{ id: string }> {
  const { data } = await axiosForBackend.delete(`/api/print-templates/${id}`);
  return data;
}

export async function toggle(id: string): Promise<PrintTemplate> {
  const { data } = await axiosForBackend.patch(`/api/print-templates/${id}/toggle`);
  return data;
}

export async function preview(id: string, recordId: string): Promise<PrintPreviewResult> {
  const { data } = await axiosForBackend.post(`/api/print-templates/${id}/preview`, { recordId });
  return data;
}
```

### 65.13 工作台 API

```typescript
// client/src/api/dashboard.ts
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  DashboardOverview,
  DashboardPendingItem,
  DashboardChartData,
  DashboardRecentAction,
} from '@shared/api.interface';

export async function getOverview(): Promise<DashboardOverview> {
  const { data } = await axiosForBackend.get('/api/dashboard/overview');
  return data;
}

export async function getPending(): Promise<DashboardPendingItem[]> {
  const { data } = await axiosForBackend.get('/api/dashboard/pending');
  return data;
}

export async function getCharts(): Promise<DashboardChartData> {
  const { data } = await axiosForBackend.get('/api/dashboard/charts');
  return data;
}

export async function getRecent(): Promise<DashboardRecentAction[]> {
  const { data } = await axiosForBackend.get('/api/dashboard/recent');
  return data;
}
```

### 65.14 React Query Hooks 封装

```typescript
// client/src/hooks/useInbound.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inboundApi } from '@/api';
import type { CreateInboundRequest, InboundListParams } from '@shared/api.interface';

export function useInboundList(params: InboundListParams) {
  return useQuery({
    queryKey: ['inbound', 'list', params],
    queryFn: () => inboundApi.getList(params),
  });
}

export function useInboundDetail(id: string) {
  return useQuery({
    queryKey: ['inbound', 'detail', id],
    queryFn: () => inboundApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateInbound() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateInboundRequest) => inboundApi.create(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbound'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateInbound() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, req }: { id: string; req: Partial<CreateInboundRequest> }) =>
      inboundApi.update(id, req),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['inbound'] });
      queryClient.invalidateQueries({ queryKey: ['inbound', 'detail', id] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useDeleteInbound() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inboundApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbound'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useInboundImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => inboundApi.importExcel(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbound'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}
```

### 65.15 请求拦截器

```typescript
// 在应用初始化时配置
axiosForBackend.interceptors.request.use((config) => {
  // 自动注入组织编码
  const orgCode = localStorage.getItem('org_code');
  if (orgCode) {
    config.headers['x-org-code'] = orgCode;
  }
  return config;
});

axiosForBackend.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      toast.error('网络连接失败');
      return Promise.reject(error);
    }

    const { status, data } = error.response;
    if (status === 401) {
      toast.error('登录已过期');
    } else if (status === 403) {
      toast.error('无权限');
    } else if (status >= 500) {
      toast.error('服务器错误');
    }
    return Promise.reject(error);
  }
);
```
