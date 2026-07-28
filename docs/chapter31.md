

---

## 第31章 Business-UI 用户组件系统

### 31.1 系统架构

用户组件系统包含三个子系统：UserSelect（用户选择器）、UserDisplay（用户展示）、UserProfile（用户详情卡片）。基于 EntityCombobox 底层组件实现，集成飞书用户搜索 API。

| 子系统 | 文件数 | 总行数 | 职责 |
|--------|--------|--------|------|
| UserSelect | 8 | ~650 | 用户搜索选择器 |
| UserDisplay | 5 | ~250 | 用户头像+姓名展示 |
| UserProfile | 4 | ~750 | 用户详情卡片（飞书原生卡片） |
| API 服务 | 6 | ~400 | 用户/部门 API 封装 |

### 31.2 UserSelect 用户选择器（212行核心）

#### Props

```typescript
interface UserSelectProps extends BaseEntitySelectProps<User> {
  accountType?: 'apaas' | 'lark';    // 账号类型，默认 'apaas'
  valueType?: 'string' | 'object';   // 值类型，默认 'string'
}
```

- `accountType`：决定使用 aPaaS 用户体系还是飞书用户体系
- `valueType`：`'string'` 时 value 为 userId 字符串，`'object'` 时 value 为完整 User 对象

#### User 类型

```typescript
interface User {
  id: string;         // 用户ID
  name: string;       // 显示名称
  avatar?: string;    // 头像URL
  email?: string;     // 邮箱
  department?: string; // 部门名称
  userType?: '_employee' | '_externalUser';  // 用户类型
}
```

#### 数据获取

```typescript
function createUsersFetcher(options: { accountType?: AccountType; pageSize?: number } = {}) {
  const { accountType = 'apaas', pageSize = 100 } = options;

  return async (search: string) => {
    const response = await searchUsers({ query: search, pageSize });
    const userList = response?.data?.userList || [];

    return {
      items: userList.map(user => searchUserInfoToUser(user, accountType)),
    };
  };
}
```

`searchUsers` 调用 aPaaS 用户搜索 API，返回用户列表。`searchUserInfoToUser` 将 API 返回的原始用户信息转换为 `User` 类型。

#### 值类型转换 useUserValue

```typescript
function useUserValue(
  value: User | User[] | string | string[] | null,
  multiple: boolean,
  accountType: 'apaas' | 'lark',
  valueType: 'string' | 'object',
) {
  const [internalValue, setInternalValue] = useState<User | User[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!value) {
      setInternalValue(multiple ? [] : null);
      return;
    }

    if (valueType === 'object') {
      // 对象模式：直接使用
      setInternalValue(value as User | User[]);
    } else {
      // 字符串模式：需要根据 ID 查询用户信息
      setIsLoading(true);
      const ids = multiple ? value as string[] : [value as string];
      fetchUsersByIds(ids, accountType).then(users => {
        setInternalValue(multiple ? users : users[0] ?? null);
        setIsLoading(false);
      });
    }
  }, [value, valueType, multiple, accountType]);

  const toExternalValue = (internalVal: User | User[] | null, isMultiple: boolean) => {
    if (!internalVal) return isMultiple ? [] : null;
    if (valueType === 'object') return internalVal;
    // 字符串模式：提取 ID
    return isMultiple
      ? (internalVal as User[]).map(u => u.id)
      : (internalVal as User).id;
  };

  return { internalValue, isLoading, toExternalValue };
}
```

当 `valueType='string'` 时，需要额外的异步请求将 userId 转换为完整的 User 对象。这期间 `isLoading=true`，显示加载状态。

#### 组件渲染

```tsx
export const UserSelect: React.FC<UserSelectProps> = (props) => {
  const {
    size = 'medium',
    triggerType = 'button',
    multiple = false,
    value,
    valueType = 'string',
    accountType = 'apaas',
    ...
  } = props;

  const { internalValue, isLoading, toExternalValue } = useUserValue(
    value ?? null, multiple, accountType, valueType,
  );

  const fetchFn = useMemo(() => createUsersFetcher({ accountType }), [accountType]);

  const handleChange = useCallback((newValue: User | User[] | null) => {
    if (!onChange) return;
    const externalValue = toExternalValue(newValue, multiple);
    (onChange as (value: unknown) => void)(externalValue);
  }, [onChange, toExternalValue, multiple]);

  return (
    <BaseCombobox
      autoFocus={autoFocus}
      className={className}
      classNames={classNames}
      debounce={300}
      disabled={disabled}
      emptyText="没有匹配结果，换个关键词试试吧"
      fetchFn={fetchFn}
      getItemLabel={(user) => user.name}
      getItemValue={(user) => user}
      multiple={multiple}
      onChange={handleChange}
      placeholder="请选择"
      renderItem={(userValue, isSelected, itemClassName, itemDisabled) => (
        <UserItemWrapper
          key={userValue.id}
          userValue={userValue}
          isSelected={isSelected}
          className={itemClassName}
          disabled={itemDisabled}
        />
      )}
      renderTag={renderTagWithLoading}
      showSearch
      size={size}
      triggerType={triggerType}
      value={internalValue}
      ...
    />
  );
};
```

#### UserItem 列表项

```tsx
function UserItem({ userValue, isSelected, className, size, searchKeyword, disabled }) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-md px-2 transition-colors',
        sizeClasses[size],
        isSelected && 'bg-primary/10',
        disabled && 'opacity-50',
        !disabled && 'hover:bg-muted cursor-pointer',
        className,
      )}
      onClick={() => !disabled && handleSelect(userValue)}
    >
      <Avatar className="size-6">
        <AvatarImage src={userValue.avatar} />
        <AvatarFallback>{userValue.name?.[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <HighlightText text={userValue.name} keyword={searchKeyword} />
        {userValue.department && (
          <span className="text-xs text-muted-foreground ml-1">· {userValue.department}</span>
        )}
      </div>
      {isSelected && <Check className="size-4 text-primary" />}
    </div>
  );
}
```

#### UserSelectTag 多选标签

```tsx
function UserSelectTag({ userValue, onClose, size, disabled, isLoading, accountType }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs">
      {isLoading ? (
        <Spinner className="size-3" />
      ) : (
        <Avatar className="size-4">
          <AvatarImage src={userValue.avatar} />
          <AvatarFallback className="text-xs">{userValue.name?.[0]}</AvatarFallback>
        </Avatar>
      )}
      <span className="max-w-24 truncate">{userValue.name}</span>
      {!disabled && (
        <button onClick={(e) => onClose(userValue, e)} className="rounded-sm hover:bg-foreground/10">
          <X className="size-3" />
        </button>
      )}
    </span>
  );
}
```

### 31.3 UserDisplay 用户展示（67行）

#### Props

```typescript
interface IUserDisplayProps {
  users: IUserProfile | IUserProfile[];    // 单个或多个用户
  size?: 'small' | 'medium' | 'large';    // 头像尺寸
  className?: string;
  style?: React.CSSProperties;
  showLabel?: boolean;                     // 是否显示姓名，默认 true
  showUserProfile?: boolean;               // 是否显示用户详情卡片（Popover）
}
```

#### IUserProfile 类型

```typescript
interface IUserProfile {
  user_id: string;
  name?: string;
  avatar?: string;
  email?: string;
  department?: string;
}
```

#### 组件实现

```tsx
export const UserDisplay: React.FC<IUserDisplayProps> = ({
  users, size, className, style, showLabel = true,
}) => {
  const normalizedUsers = React.useMemo<IUserProfile[]>(() => {
    if (!users) return [];
    return Array.isArray(users) ? users : [users];
  }, [users]);

  if (!normalizedUsers.length) return null;

  return (
    <div className={cn('flex flex-wrap gap-1', className)} style={style}>
      {normalizedUsers.map(user => (
        <Popover key={user.user_id}>
          <PopoverTrigger asChild>
            <div>
              <UserWithAvatar
                data={user}
                size={size}
                showLabel={showLabel}
                className="cursor-pointer hover:bg-[rgba(31_35_41_0.15)] active:bg-[rgba(31_35_41_0.2)]"
              />
            </div>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            sideOffset={8}
            className="w-[320px] border-0 border-border/50 bg-card p-0 shadow-[...]"
          >
            <UserProfile userId={user.user_id} />
          </PopoverContent>
        </Popover>
      ))}
    </div>
  );
};
```

功能：
1. 统一规范化为 `IUserProfile[]` 数组
2. 空数组返回 `null`
3. 每个用户渲染为 `UserWithAvatar`（头像+姓名）
4. 点击头像弹出 `Popover`，显示 `UserProfile` 详情卡片
5. Popover 宽度 320px，左对齐，距触发器 8px

### 31.4 UserWithAvatar 头像+姓名组件

```tsx
function UserWithAvatar({ data, size, showLabel, className }) {
  const sizeMap = {
    small: 'size-5',
    medium: 'size-6',
    large: 'size-8',
  };

  return (
    <div className={cn('inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 transition-colors', className)}>
      <Avatar className={sizeMap[size]}>
        <AvatarImage src={data.avatar} />
        <AvatarFallback className="text-xs">
          {data.name?.[0] ?? '?'}
        </AvatarFallback>
      </Avatar>
      {showLabel && (
        <span className="text-sm">{data.name}</span>
      )}
    </div>
  );
}
```

三种尺寸的头像：
- small：20px
- medium：24px
- large：32px

### 31.5 UserProfile 用户详情卡片（351行）

UserProfile 是最复杂的用户组件，支持两种模式：简单模式和飞书原生卡片模式。

#### Props

```typescript
interface UserProfileProps {
  userId?: string;
  accountType?: 'apaas' | 'lark';    // 默认 'apaas'
}
```

#### 两种渲染模式

**简单模式**（useLarkCard=false）：

显示用户基本信息：头像、姓名、邮箱、用户类型、账号状态。

```tsx
function SimpleUserProfile({ userProfileInfo }) {
  return (
    <Card className="flex w-80 flex-col gap-0 overflow-hidden border-0 p-0">
      {/* 背景图 */}
      <div className="relative h-28 w-full">
        <img src={getAssetsUrl('/obj/eden-cn/lm-zhhwh/ljhwZthlaukjlkulzlp/ui/bg.png')}
          alt="cover" className="absolute inset-0 h-full w-full object-cover" />
      </div>
      {/* 头像 */}
      <div className="-mt-12 flex justify-center">
        <Avatar className="size-24 border-4 border-background">
          <AvatarImage src={userProfileInfo.avatar} />
          <AvatarFallback className="text-2xl">{userProfileInfo.name?.[0]}</AvatarFallback>
        </Avatar>
      </div>
      {/* 姓名+状态 */}
      <div className="flex flex-col items-center gap-1 pt-2">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">{userProfileInfo.name}</span>
          {userProfileInfo.userType === '_employee' && <Badge>内部</Badge>}
          {userProfileInfo.userType === '_externalUser' && <Badge variant="outline">外部</Badge>}
        </div>
        {userProfileInfo.email && (
          <span className="text-sm text-muted-foreground">{userProfileInfo.email}</span>
        )}
        {userStatusText && <Badge variant="secondary">{userStatusText}</Badge>}
      </div>
    </Card>
  );
}
```

**飞书原生卡片模式**（useLarkCard=true）：

使用飞书 H5 JS SDK 渲染原生用户名片卡片。

```typescript
async function renderLarkProfile({ larkAppID, jsAPITicket, larkOpenID, cardRef, targetLarkOpenID }) {
  const timestamp = Date.now().toString();
  const nonceStr = generateRandomString(10);
  const url = globalThis.location.href.split('#')[0];
  const message = `jsapi_ticket=${jsAPITicket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${url}`;
  const signature = SHA1(message).toString();

  await globalThis.webComponent.config({
    openId: larkOpenID,
    signature,
    appId: larkAppID,
    timestamp,
    nonceStr,
    url,
    jsApiList: ['user_profile'],
    locale: ['zh_cn'],
  });

  await globalThis.webComponent.render('UserProfile', { openId: targetLarkOpenID }, cardRef.current);
}
```

飞书卡片渲染流程：
1. 生成随机 nonceStr
2. 使用 SHA1 签名算法生成 signature
3. 调用 `webComponent.config` 配置 SDK
4. 调用 `webComponent.render('UserProfile', { openId }, container)` 渲染卡片

#### 账号状态映射

```typescript
const ACCOUNT_STATUS = {
  UNSPECIFIED: 0,
  Inactive: 1,
  Active: 2,
  Disabled: 3,
  Terminated: 4,
};

const AccountStatusMap = {
  [ACCOUNT_STATUS.UNSPECIFIED]: '',
  [ACCOUNT_STATUS.Active]: '',
  [ACCOUNT_STATUS.Inactive]: '未激活',
  [ACCOUNT_STATUS.Disabled]: '已停用',
  [ACCOUNT_STATUS.Terminated]: '已注销',
};
```

#### 错误处理

```tsx
if (error) {
  return (
    <Card className="flex min-h-124 w-80 flex-col items-center justify-center gap-4 border-0 p-0">
      <ErrorImage />
      <div>
        <span className="text-sm">加载失败 请</span>
        <Button size="sm" variant="ghost" onClick={fetchData}>重试</Button>
      </div>
    </Card>
  );
}
```

错误状态显示错误图片 + 重试按钮，点击重试重新获取数据。

#### 加载状态

```tsx
if (loading) {
  return <Spinner className="size-8 animate-spin text-primary" />;
}
```

#### 飞书 SDK 按需加载

```typescript
const larkSdkUrl = 'https://lf3-cdn-tos.bytegoofy.com/obj/goofy/locl/lark/external_js_sdk/h5-js-sdk-1.2.21.js';
const scriptStatus = useExternalScript(larkSdkUrl, { onloadCallback: onAuthError });
```

`useExternalScript` Hook 动态加载飞书 H5 JS SDK，仅在 UserProfile 组件使用时加载，避免全局加载影响性能。

#### 鉴权错误处理

```typescript
const onAuthError = useCallback(() => {
  globalThis.webComponent.onAuthError(function(error: Error) {
    const errorMessage = JSON.parse(error.message);
    if (errorMessage?.msg?.code === 20442 && errorMessage?.msg?.msg === 'jsapi-ticket not exist') {
      globalThis.location.replace(redirectURLRef.current);
    }
  });
}, []);
```

当 jsapi-ticket 过期时，自动重定向到 redirectURL 重新鉴权。

### 31.6 API 服务层

#### 用户搜索 API

```typescript
// api/users/service.ts
export async function searchUsers(params: { query: string; pageSize?: number }) {
  return axiosForBackend.get('/api/users/search', { params });
}
```

#### 用户详情 API

```typescript
// api/user-profiles/service.ts
export async function fetchUserProfile(userId: string, accountType: string, signal?: AbortSignal) {
  return axiosForBackend.get(`/api/user-profiles/${userId}`, {
    params: { account_type: accountType },
    signal,
  });
}
```

#### 部门搜索 API

```typescript
// api/departments/service.ts
export async function searchDepartments(params: { query: string; pageSize?: number }) {
  return axiosForBackend.get('/api/departments/search', { params });
}
```

#### 资源 URL

```typescript
export function getAssetsUrl(path: string): string {
  return `https://lf3-cdn-tos.bytegoofy.com${path}`;
}
```

### 31.7 使用场景

| 场景 | 组件 | 配置 |
|------|------|------|
| 来货登记选客户负责人 | UserSelect | `multiple={false} valueType="string"` |
| 权限管理选用户 | UserSelect | `multiple={true} valueType="string"` |
| 操作日志展示操作人 | UserDisplay | `size="small" showLabel={true}` |
| 客户详情展示联系人 | UserDisplay | `size="medium"` |
| 用户头像悬浮查看详情 | UserDisplay + UserProfile | 默认行为（点击弹出卡片） |
| 审批流程选择审批人 | UserSelect | `multiple={true} valueType="object"` |

### 31.8 导出清单

```typescript
// UserSelect
export { UserSelect };
export { type User as UserValue, type UserInfo as User };
export { ItemPill };

// UserDisplay
export { UserDisplay };
export type { IUserProfile };

// UserProfile
export { UserProfile };
```
