

---

## 第35章 共享工具函数与 Hooks 完整参考

### 35.1 工具函数体系

系统在 `client/src/utils/` 和 `server/common/utils/` 目录下维护了大量工具函数，覆盖格式化、校验、数据转换等场景。

#### client/src/utils/

| 文件 | 行数 | 职责 |
|------|------|------|
| `config.ts` | ~80 | 应用初始化配置（axios 拦截器、全局错误处理） |
| `img-resources/avatar-placeholders.ts` | ~40 | 头像占位图 URL 数组 |
| `cn.ts` | ~10 | className 合并工具（clsx + tailwind-merge） |

#### server/common/utils/

| 文件 | 行数 | 职责 |
|------|------|------|
| `format.ts` | ~120 | 日期/金额/数量格式化 |
| `validators.ts` | ~80 | 业务校验函数 |
| `converters.ts` | ~60 | 数据类型转换 |

### 35.2 cn — className 合并

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**用途**：合并多个 className，自动解决 Tailwind 冲突（后者覆盖前者）。

```tsx
// 示例
<div className={cn('px-2 py-1', isActive && 'bg-primary text-white', className)} />
// 如果 className 传入 'px-4'，最终结果为 'py-1 bg-primary text-white px-4'
// twMerge 自动保留后写的 px-4，覆盖前面的 px-2
```

### 35.3 格式化工具

```typescript
// 金额格式化：1234.5 → "¥1,234.50"
export function formatCurrency(amount: number, currency = 'CNY'): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

// 数量格式化：1234.5 → "1,234.5"
export function formatQuantity(qty: number, decimals = 1): string {
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(qty);
}

// 日期格式化
export function formatDate(date: Date | string, format = 'YYYY-MM-DD'): string {
  const d = dayjs(date);
  return d.format(format);
}

// 相对时间：3小时前
export function formatRelativeTime(date: Date | string): string {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;
  return formatDate(date);
}

// 百分比：0.856 → "85.6%"
export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

// 文件大小：1024 → "1.0 KB"
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let unitIndex = 0;
  while (bytes >= 1024 && unitIndex < units.length - 1) {
    bytes /= 1024;
    unitIndex++;
  }
  return `${bytes.toFixed(1)} ${units[unitIndex]}`;
}
```

### 35.4 校验工具

```typescript
// 手机号校验
export function isValidPhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone);
}

// 邮箱校验
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// 统一社会信用代码校验
export function isValidUSCC(code: string): boolean {
  return /^[0-9A-HJ-NPQRTUWXY]{18}$/.test(code);
}

// 身份证号校验（基本格式）
export function isValidIDCard(id: string): boolean {
  return /^\d{17}[\dXx]$/.test(id);
}

// 金额校验（正数，最多2位小数）
export function isValidAmount(value: string): boolean {
  return /^\d+(\.\d{1,2})?$/.test(value) && parseFloat(value) > 0;
}

// 数量校验（正数，最多3位小数）
export function isValidQuantity(value: string): boolean {
  return /^\d+(\.\d{1,3})?$/.test(value) && parseFloat(value) > 0;
}
```

### 35.5 数据转换工具

```typescript
// 分页参数转换
export function toPageParams(page: number, pageSize: number) {
  return {
    offset: (page - 1) * pageSize,
    limit: pageSize,
  };
}

// 查询参数序列化（数组→逗号分隔）
export function serializeQueryParams(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      searchParams.set(key, value.join(','));
    } else {
      searchParams.set(key, String(value));
    }
  }
  return searchParams.toString();
}

// 颜色 HSL 转 hex
export function hslToHex(h: number, s: number, l: number): string {
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l / 100 - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}
```

### 35.6 前端自定义 Hooks

#### useDebounce

```typescript
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
```

#### useLocalStorage

```typescript
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [stored, setStored] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    setStored(value);
    window.localStorage.setItem(key, JSON.stringify(value));
  };

  return [stored, setValue];
}
```

#### useMediaQuery

```typescript
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, [query]);

  return matches;
}
```

#### useInfiniteScroll

```typescript
function useInfiniteScroll(callback: () => void, options?: { threshold?: number; enabled?: boolean }) {
  const { threshold = 200, enabled = true } = options || {};
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          callback();
        }
      },
      { rootMargin: `${threshold}px` }
    );
    if (targetRef.current) observer.observe(targetRef.current);
    return () => observer.disconnect();
  }, [callback, threshold, enabled]);

  return targetRef;
}
```

#### useDownload

```typescript
function useDownload() {
  return useCallback(async (url: string, filename?: string) => {
    const response = await fetch(url);
    const blob = await response.blob();
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  }, []);
}
```

#### useClipboard

```typescript
function useClipboard() {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }, []);

  return { copied, copy };
}
```

#### usePagination

```typescript
function usePagination<T>(items: T[], pageSize: number) {
  const [page, setPage] = useState(1);
  const total = Math.ceil(items.length / pageSize);
  const currentItems = items.slice((page - 1) * pageSize, page * pageSize);

  return {
    page,
    pageSize,
    total,
    currentItems,
    hasNext: page < total,
    hasPrev: page > 1,
    next: () => setPage((p) => Math.min(p + 1, total)),
    prev: () => setPage((p) => Math.max(p - 1, 1)),
    setPage,
  };
}
```

#### useTableSort

```typescript
function useTableSort<T>(data: T[], initialField?: keyof T) {
  const [sortField, setSortField] = useState<keyof T | undefined>(initialField);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const sortedData = useMemo(() => {
    if (!sortField) return data;
    return [...data].sort((a, b) => {
      const av = a[sortField];
      const bv = b[sortField];
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortField, sortDir]);

  const toggleSort = (field: keyof T) => {
    if (field === sortField) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  return { sortedData, sortField, sortDir, toggleSort };
}
```

### 35.7 常量定义

#### client/src/utils/constants.ts

```typescript
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const DEBOUNCE_DELAY = {
  search: 300,
  autoSave: 2000,
  resize: 100,
} as const;

export const STORAGE_KEYS = {
  USER_INFO: '__global_heat_user_info',
  CUSTOMER_LIST: '__global_heat_customer_list',
  PRODUCT_LIST: '__global_heat_product_list',
  PRINT_TEMPLATES: '__global_heat_print_templates',
  ORG_CODE: '__global_heat_org_code',
} as const;

export const ROUTES = {
  DASHBOARD: '/',
  INBOUND: '/inbound',
  OUTBOUND: '/outbound',
  INVENTORY: '/inventory',
  RECONCILIATION: '/reconciliation',
  STATISTICS: '/statistics',
  CUSTOMERS: '/customers',
  PRODUCTS: '/products',
  TEMPLATES: '/settings/templates',
  PERMISSIONS: '/settings/permissions',
} as const;

export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const RECONCILIATION_STATUS = {
  UNMATCHED: 'unmatched',
  MATCHED: 'matched',
  DISPUTED: 'disputed',
  RESOLVED: 'resolved',
} as const;
```

### 35.8 上下文（Context）

#### TenantContext

```typescript
interface TenantContextValue {
  orgCode: string | null;
  orgName: string | null;
  setOrgCode: (code: string) => void;
  clearOrgCode: () => void;
  loading: boolean;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant must be used within TenantProvider');
  return ctx;
}
```

#### AuthContext

```typescript
interface AuthContextValue {
  user: UserInfo | null;
  roles: string[];
  permissions: string[];
  isAuthenticated: boolean;
  hasRole: (role: string) => boolean;
  hasPermission: (perm: string) => boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

#### ThemeContext

```typescript
interface ThemeContextValue {
  theme: 'light';
  setTheme: (theme: 'light') => void;
}

// 系统仅支持浅色主题，ThemeContext 为预留扩展
```

### 35.9 服务端通用常量

#### server/common/constants/

```typescript
export const ERROR_CODES = {
  TENANT_NOT_FOUND: 'TENANT_NOT_FOUND',
  TENANT_DB_CONNECTION_FAILED: 'TENANT_DB_CONNECTION_FAILED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  CONFLICT: 'CONFLICT',
} as const;

export const TENANT_HEADER = 'X-Organization-Code';
export const DEFAULT_DB_PORT = 5432;
export const DB_POOL_SIZE = 10;
export const DB_POOL_IDLE_TIMEOUT = 30000;
```

### 35.10 服务端通用工具

#### server/common/utils/

```typescript
// 生成租户数据库名
export function getTenantDbName(orgCode: string): string {
  return `db_tenant_${orgCode}`;
}

// 生成租户数据库配置
export function getTenantDbConfig(org: Organization) {
  return {
    host: org.dbHost,
    port: org.dbPort || DEFAULT_DB_PORT,
    user: org.dbUser,
    password: org.dbPassword,
    database: getTenantDbName(org.orgCode),
  };
}

// 分页参数校验
export function validatePagination(page?: string, pageSize?: string) {
  const p = page ? parseInt(page, 10) : 1;
  const ps = pageSize ? parseInt(pageSize, 10) : DEFAULT_PAGE_SIZE;
  if (p < 1) throw new BadRequestException('页码必须大于0');
  if (ps < 1 || ps > MAX_PAGE_SIZE) throw new BadRequestException(`每页条数必须在1-${MAX_PAGE_SIZE}之间`);
  return { page: p, pageSize: ps, offset: (p - 1) * ps, limit: ps };
}

// 生成 UUID（替代 crypto.randomUUID，兼容旧 Node.js）
export function generateUUID(): string {
  return crypto.randomUUID();
}
```
