import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Flame,
  LayoutDashboard,
  Inbox,
  Send,
  Package,
  FileText,
  BarChart3,
  Database,
  Settings,
  User,
  LogOut,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  PanelLeft,
  PanelLeftClose,
  Shield,
  FileSpreadsheet,
  BookOpen,
  Sparkles,
  Users,
  Factory,
  Box,
  TrendingUp,
  PieChart,
  Store,
  Building2,
  Search,
  Bell,
  HelpCircle,
  History,
  FlaskConical,
  ClipboardList,
  Menu,
  X,
  Command,
  ExternalLink,
  SwitchCamera,
} from "lucide-react";
import { useCurrentUserProfile } from "@lark-apaas/client-toolkit/hooks/useCurrentUserProfile";
import { axiosForBackend } from "@lark-apaas/client-toolkit/utils/getAxiosForBackend";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { logger } from "@lark-apaas/client-toolkit/logger";
import { useDisplaySettings } from "@/hooks/useDisplaySettings";
import { ThemeSwitcher } from "./ThemeSwitcher";
import ErrorBoundary from "./ErrorBoundary";
import { DataProvider } from "@/data/DataContext";
import { useData } from "@/data/DataContext";
import { useTenant } from "@/contexts/TenantContext";
import { FeishuContextButton, FeishuGlobalDropdown } from "@/components/FeishuLinkButton";

// ==================== 导航配置 - 优化后的扁平结构 ====================

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  children?: NavItem[];
}

// 主导航项
const mainNavItems: NavItem[] = [
  { path: "/dashboard", label: "工作台", icon: LayoutDashboard },
];

// 业务操作
const businessNavItems: NavItem[] = [
  { path: "/inbound", label: "来货登记", icon: Inbox },
  { path: "/outbound", label: "快速发货", icon: Send },
  { path: "/orders", label: "单据查询", icon: FileText },
  { path: "/inventory", label: "库存管理", icon: Package },
  { path: "/reconciliation", label: "智能对账", icon: FileSpreadsheet },
];

// 数据洞察
const analyticsNavItems: NavItem[] = [
  { path: "/statistics", label: "数据概览", icon: PieChart },
  { path: "/statistics/customer", label: "客户分析", icon: Users },
  { path: "/statistics/inventory", label: "库存分析", icon: Box },
  { path: "/statistics/product", label: "产品分析", icon: Factory },
  { path: "/statistics/finance", label: "财务分析", icon: TrendingUp },
];

// 系统管理
const systemNavItems: NavItem[] = [
  { path: "/customers", label: "客户管理", icon: Store },
  { path: "/products", label: "产品管理", icon: Factory },
    {
    path: "/admin",
    label: "管理后台",
    icon: LayoutDashboard,
  },
  {
    path: "/settings",
    label: "系统设置",
    icon: Settings,
    children: [
      { path: "/settings/templates", label: "打印模板", icon: FileSpreadsheet },
      { path: "/settings/permissions", label: "权限管理", icon: Shield },
      { path: "/operation-logs", label: "操作日志", icon: History },
      { path: "/settings/feature-flags", label: "实验功能", icon: FlaskConical },
      { path: "/settings/manual", label: "用户手册", icon: BookOpen },
    ]
  },
];

// ==================== 组件 ====================

// Logo组件 - 简约现代风格
const AppLogo = () => {
  const { state } = useSidebar();
  const { currentTenant } = useTenant();
  
  return (
    <Link 
      to="/" 
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
        "hover:bg-accent/50 active:scale-[0.98]"
      )}
    >
      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-primary-foreground shadow-sm flex-shrink-0">
        <Flame className="size-5" />
      </div>
      <div className={cn(
        "flex flex-col transition-all duration-200 overflow-hidden",
        state === "collapsed" ? "w-0 opacity-0" : "w-auto opacity-100"
      )}>
        <span className="font-semibold text-sm text-foreground leading-tight truncate max-w-[140px]">
          {currentTenant?.orgName || "热处理管理"}
        </span>
        <span className="text-[10px] text-muted-foreground leading-tight">
          智能收发货平台
        </span>
      </div>
    </Link>
  );
};

// 简单导航项
const SimpleNavItem = ({ 
  item, 
  isActive 
}: { 
  item: NavItem; 
  isActive: boolean;
}) => (
  <SidebarMenuItem>
    <SidebarMenuButton
      asChild
      isActive={isActive}
      tooltip={item.label}
      className={cn(
        "h-10 px-3 rounded-lg transition-all duration-200",
        "hover:bg-accent",
        isActive && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
      )}
    >
      <Link to={item.path} className="flex items-center gap-3">
        <item.icon className={cn("size-4.5", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
        <span className="font-medium">{item.label}</span>
        {item.badge && (
          <Badge variant={isActive ? "outline" : "secondary"} className="ml-auto text-[10px] px-1.5 py-0 h-5">
            {item.badge}
          </Badge>
        )}
      </Link>
    </SidebarMenuButton>
  </SidebarMenuItem>
);

// 带子菜单的导航项 - 优化版
const CollapsibleNavItem = ({
  item,
  pathname,
}: {
  item: NavItem;
  pathname: string;
}) => {
  const isChildActive = item.children?.some(child => 
    pathname === child.path || pathname.startsWith(child.path + "/")
  );
  const isActive = pathname === item.path || isChildActive;
  const [isOpen, setIsOpen] = useState(isActive);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            isActive={isActive}
            tooltip={item.label}
            className={cn(
              "h-10 px-3 rounded-lg transition-all duration-200",
              "hover:bg-accent",
              isActive && "bg-primary/10 text-primary hover:bg-primary/10"
            )}
          >
            <item.icon className={cn("size-4.5", isActive ? "text-primary" : "text-muted-foreground")} />
            <span className="font-medium flex-1 text-left">{item.label}</span>
            {item.badge && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                {item.badge}
              </Badge>
            )}
            <ChevronDown 
              className={cn(
                "ml-1 size-4 text-muted-foreground transition-transform duration-200",
                isOpen && "rotate-180"
              )} 
            />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub className="ml-0 pl-6 pr-2 py-1 border-l border-border/50 ml-4 mt-1 space-y-0.5">
            {item.children?.map((child) => {
              const isChildActive = pathname === child.path || pathname.startsWith(child.path + "/");
              return (
                <SidebarMenuSubItem key={child.path}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={isChildActive}
                    className={cn(
                      "h-8 rounded-md transition-all duration-200",
                      "hover:bg-accent",
                      isChildActive && "bg-primary/5 text-primary font-medium"
                    )}
                  >
                    <Link to={child.path} className="flex items-center gap-2">
                      <child.icon className="size-4" />
                      <span className="text-sm">{child.label}</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              );
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
};

// 侧边栏折叠按钮
const SidebarToggle = () => {
  const { toggleSidebar, state } = useSidebar();
  
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      className="h-7 w-7 rounded-md hover:bg-accent"
      title={state === "expanded" ? "收起侧边栏" : "展开侧边栏"}
    >
      {state === "expanded" ? (
        <PanelLeftClose className="h-4 w-4" />
      ) : (
        <PanelLeft className="h-4 w-4" />
      )}
    </Button>
  );
};

// 用户菜单组件
const UserMenu = () => {
  const profile = useCurrentUserProfile();
  const userInfo = profile || { name: '用户' };
  const { state } = useSidebar();
  const { currentTenant, clearTenant } = useTenant();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axiosForBackend.post('/api/auth/logout');
    } catch (error) {
      logger.error('登出失败:', error);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('heat_treatment_current_user');
      clearTenant();
      navigate('/login', { replace: true });
    }
  };

  const handleSwitchOrg = () => {
    clearTenant();
    navigate('/organizations');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className={cn(
            "h-auto w-full justify-start px-2 py-2 rounded-xl hover:bg-accent",
            state === "collapsed" && "justify-center px-0"
          )}
        >
          <div className="flex items-center gap-3 w-full">
            <Avatar className="h-8 w-8 border-2 border-background shadow-sm">
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                {userInfo.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className={cn(
              "flex flex-col items-start text-left flex-1 min-w-0 transition-all duration-200",
              state === "collapsed" && "hidden"
            )}>
              <span className="text-sm font-medium text-foreground truncate w-full">
                {userInfo.name || "未登录用户"}
              </span>
              <span className="text-xs text-muted-foreground truncate w-full">
                {currentTenant?.orgName || "未选择组织"}
              </span>
            </div>
            <ChevronUp className={cn("size-4 text-muted-foreground", state === "collapsed" && "hidden")} />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-56 p-2">
        <DropdownMenuItem className="gap-2 py-2 cursor-pointer rounded-lg" asChild>
          <Link to="/profile" className="flex items-center">
            <User className="size-4" />
            <span>个人资料</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleSwitchOrg} 
          className="gap-2 py-2 cursor-pointer rounded-lg"
        >
          <SwitchCamera className="size-4" />
          <span>切换组织</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleLogout} 
          className="gap-2 py-2 cursor-pointer text-destructive rounded-lg hover:bg-destructive/10"
        >
          <LogOut className="size-4" />
          <span>退出登录</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// 侧边栏组件 - 全新设计
const AppSidebar = () => {
  const { pathname } = useLocation();

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-border/60 bg-background"
    >
      <SidebarRail />
      
      {/* Logo区域 */}
      <SidebarHeader className="p-3">
        <AppLogo />
      </SidebarHeader>

      <SidebarContent className="px-3 py-2">
        {/* 工作台 */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {mainNavItems.map(item => (
                <SimpleNavItem 
                  key={item.path} 
                  item={item} 
                  isActive={pathname === item.path} 
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* 业务操作 */}
        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider px-3 mb-1.5">
            业务操作
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {businessNavItems.map(item => (
                <SimpleNavItem 
                  key={item.path} 
                  item={item} 
                  isActive={pathname === item.path || pathname.startsWith(item.path + '/')} 
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* 数据洞察 */}
        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider px-3 mb-1.5">
            数据洞察
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {analyticsNavItems.map(item => (
                <SimpleNavItem 
                  key={item.path} 
                  item={item} 
                  isActive={pathname === item.path || pathname.startsWith(item.path + '/')} 
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* 系统管理 */}
        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider px-3 mb-1.5">
            系统管理
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {systemNavItems.map(item => 
                item.children ? (
                  <CollapsibleNavItem 
                    key={item.path} 
                    item={item} 
                    pathname={pathname}
                  />
                ) : (
                  <SimpleNavItem 
                    key={item.path} 
                    item={item} 
                    isActive={pathname.startsWith(item.path)} 
                  />
                )
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* 底部用户区域 */}
      <SidebarFooter className="p-3 mt-auto border-t border-border/60">
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <UserMenu />
          </div>
          <div className="flex-shrink-0 group-data-[collapsible=icon]:hidden">
            <SidebarToggle />
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

// 面包屑组件 - 简化版
const Breadcrumb = ({ pathname }: { pathname: string }) => {
  const getBreadcrumbItems = () => {
    const items: Array<{ label: string; path?: string }> = [];
    const allItems = [
      ...mainNavItems,
      ...businessNavItems,
      ...analyticsNavItems,
      ...systemNavItems,
    ];
    
    for (const item of allItems) {
      if (item.path === pathname) {
        items.push({ label: item.label });
        break;
      }
      if (item.children) {
        const child = item.children.find(c => c.path === pathname || pathname.startsWith(c.path + "/"));
        if (child) {
          items.push({ label: item.label, path: item.path });
          items.push({ label: child.label });
          break;
        }
      }
    }
    
    return items;
  };

  const items = getBreadcrumbItems();
  if (items.length === 0) return <span className="text-sm text-muted-foreground">首页</span>;

  return (
    <nav className="flex items-center gap-1.5 text-sm">
      <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
        首页
      </Link>
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-1.5">
          <ChevronRight className="size-3.5 text-muted-foreground/50" />
          {item.path && index < items.length - 1 ? (
            <Link to={item.path} className="text-muted-foreground hover:text-foreground transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
};

// 顶部标题栏组件 - 全新极简设计
const Header = ({ pathname }: { pathname: string }) => {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastReadNotificationCount, setLastReadNotificationCount] = useState(0);
  
  const { reconciliations, products } = useData();
  
  const getPageTitle = () => {
    const allItems = [
      ...mainNavItems,
      ...businessNavItems,
      ...analyticsNavItems,
      ...systemNavItems.flatMap(i => i.children || [i]),
    ];
    
    const item = allItems.find(i =>
      i.path === pathname || (pathname !== "/" && pathname.startsWith(i.path))
    );
    
    return item?.label || "页面";
  };
  
  // 通知数量
  const notificationCount = reconciliations.filter(r => r.unreceivedAmount > 0 && r.status !== 'draft').length;
  const inventoryWarningCount = products.filter(p => p.stock === 0).length;
  const totalNotifications = notificationCount + inventoryWarningCount;
  const hasUnreadNotifications = totalNotifications > lastReadNotificationCount;
  
  // 搜索建议
  const searchSuggestions = [
    { label: '来货登记', path: '/inbound', icon: Inbox },
    { label: '快速发货', path: '/outbound', icon: Send },
    { label: '单据查询', path: '/orders', icon: FileText },
    { label: '库存管理', path: '/inventory', icon: Package },
    { label: '智能对账', path: '/reconciliation', icon: FileSpreadsheet },
    { label: '数据统计', path: '/statistics', icon: BarChart3 },
    { label: '客户管理', path: '/customers', icon: Store },
    { label: '产品管理', path: '/products', icon: Factory },
    { label: '个人资料', path: '/profile', icon: User },
  ].filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <>
      <header className="sticky top-0 z-30 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6">
          {/* 左侧：面包屑 */}
          <div className="flex items-center">
            <Breadcrumb pathname={pathname} />
          </div>

          {/* 右侧：快捷操作 */}
          <div className="flex items-center gap-1">
            {/* 搜索 */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 gap-2 text-muted-foreground hover:text-foreground"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="size-4" />
              <span className="hidden sm:inline text-xs">搜索</span>
              <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
            
            {/* 分隔线 */}
            <Separator orientation="vertical" className="h-4 mx-1" />
            
            {/* 通知 */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 relative"
              onClick={() => {
                setNotificationOpen(true);
                setLastReadNotificationCount(totalNotifications);
              }}
            >
              <Bell className="size-4" />
              {hasUnreadNotifications && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-background" />
              )}
            </Button>
            
            {/* 帮助 */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => navigate('/settings/manual')}
            >
              <HelpCircle className="size-4" />
            </Button>
            
            {/* 主题切换 */}
            <ThemeSwitcher variant="ghost" size="icon" className="h-8 w-8" />
          </div>
        </div>
      </header>
      
      {/* 搜索对话框 */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
          <div className="flex items-center border-b px-4 py-3">
            <Search className="size-4 text-muted-foreground mr-3" />
            <Input
              placeholder="搜索功能或页面..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
              autoFocus
            />
            <kbd className="hidden sm:inline-flex h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground">
              ESC
            </kbd>
          </div>
          <div className="max-h-[320px] overflow-y-auto py-2">
            {searchSuggestions.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-muted-foreground text-sm">未找到相关功能</p>
              </div>
            ) : (
              <div className="px-2">
                {searchSuggestions.map((item) => (
                  <button
                    key={item.path}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors text-left"
                    onClick={() => {
                      navigate(item.path);
                      setSearchOpen(false);
                      setSearchQuery('');
                    }}
                  >
                    <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                      <item.icon className="size-4" />
                    </div>
                    <span className="font-medium text-sm">{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* 通知对话框 */}
      <Dialog open={notificationOpen} onOpenChange={setNotificationOpen}>
        <DialogContent className="max-w-sm p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-4 py-3 border-b">
            <DialogTitle className="flex items-center gap-2 text-base">
              <Bell className="size-4" />
              消息通知
              {totalNotifications > 0 && (
                <Badge variant="destructive" className="text-[10px] h-5">{totalNotifications}</Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            {totalNotifications === 0 ? (
              <div className="text-center py-10">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-50 flex items-center justify-center">
                  <Bell className="size-6 text-emerald-500" />
                </div>
                <p className="text-muted-foreground text-sm font-medium">暂无通知</p>
                <p className="text-xs text-muted-foreground/70 mt-1">所有业务运行正常</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {notificationCount > 0 && (
                  <button 
                    className="w-full p-3 rounded-lg border border-red-200 bg-red-50/50 hover:bg-red-50 text-left transition-colors"
                    onClick={() => {
                      navigate('/reconciliation');
                      setNotificationOpen(false);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 rounded-md bg-red-100 text-red-600">
                        <FileText className="size-4" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-red-800">待回款提醒</p>
                        <p className="text-xs text-red-700/80 mt-0.5">
                          有 {notificationCount} 个客户有待回款
                        </p>
                      </div>
                    </div>
                  </button>
                )}
                {inventoryWarningCount > 0 && (
                  <button 
                    className="w-full p-3 rounded-lg border border-amber-200 bg-amber-50/50 hover:bg-amber-50 text-left transition-colors"
                    onClick={() => {
                      navigate('/inventory');
                      setNotificationOpen(false);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 rounded-md bg-amber-100 text-amber-600">
                        <Package className="size-4" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-amber-800">库存预警</p>
                        <p className="text-xs text-amber-700/80 mt-0.5">
                          有 {inventoryWarningCount} 个产品库存不足
                        </p>
                      </div>
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// 页面标题组件
const PageTitle = ({ pathname }: { pathname: string }) => {
  const pageMatch = (() => {
    const allItems = [
      ...mainNavItems,
      ...businessNavItems,
      ...analyticsNavItems,
      ...systemNavItems.flatMap(i => i.children || [i]),
    ];
    return allItems.find(i => i.path === pathname || (pathname !== "/" && pathname.startsWith(i.path)));
  })();
  
  const getPageTitle = () => {
    const allItems = [
      ...mainNavItems,
      ...businessNavItems,
      ...analyticsNavItems,
      ...systemNavItems.flatMap(i => i.children || [i]),
    ];
    
    const item = allItems.find(i =>
      i.path === pathname || (pathname !== "/" && pathname.startsWith(i.path))
    );
    
    return item?.label || "页面";
  };

  return (
    <div className="px-4 sm:px-6 py-4 border-b border-border/40 bg-background/50">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">{getPageTitle()}</h1>
        <FeishuContextButton pathname={pathname} />
      </div>
    </div>
  );
};

// 主布局组件
const Layout = () => {
  const { pathname } = useLocation();
  const { fontSize, fontSizeMap } = useDisplaySettings();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    document.documentElement.style.fontSize = fontSizeMap[fontSize];
  }, [fontSize, fontSizeMap]);

  return (
    <DataProvider>
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-screen w-full bg-muted/30">
          <AppSidebar />
          
          <main className="flex-1 flex flex-col min-w-0">
            <Header pathname={pathname} />
            <PageTitle pathname={pathname} />
            
            <div className="flex-1 p-4 sm:p-6 overflow-auto">
              <ErrorBoundary>
                <div className="animate-in fade-in slide-in-from-bottom-1 duration-300">
                  <Outlet />
                </div>
              </ErrorBoundary>
            </div>
          </main>
        </div>
      </SidebarProvider>
    </DataProvider>
  );
};

export default Layout;
