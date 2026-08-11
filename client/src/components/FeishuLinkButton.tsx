import { ExternalLink, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import { useTenant } from '@/contexts/TenantContext';
import {
  getFeishuTableForPage,
  getAllFeishuTableLinks,
  type FeishuTableLink,
  type FeishuRuntimeConfig,
} from '@/config/feishu-tables';

function useFeishuRuntimeConfig() {
  const { currentTenant } = useTenant();
  return useQuery<FeishuRuntimeConfig>({
    queryKey: ['feishu-runtime-tables', currentTenant?.orgCode],
    enabled: Boolean(currentTenant?.orgCode),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    queryFn: async () => {
      const response = await axiosForBackend.get('/api/integration/feishu/current/tables');
      return response.data;
    },
  });
}

/**
 * 飞书多维表格快捷跳转按钮
 * 
 * 产品设计：
 * - 页面级上下文按钮：根据当前页面自动匹配对应的飞书表格
 * - 全局下拉菜单：展示所有7张表格，支持一键跳转
 * - 视觉上低调但可识别：outline 风格，hover 时显示飞书品牌色
 */

// ============ 页面上下文按钮 ============

interface FeishuContextButtonProps {
  /** 当前页面路由（可选，默认使用 useLocation） */
  pathname?: string;
}

export function FeishuContextButton({ pathname: propPathname }: FeishuContextButtonProps) {
  const location = useLocation();
  const pathname = propPathname || location.pathname;
  const { data: config } = useFeishuRuntimeConfig();
  const match = getFeishuTableForPage(pathname, config);
  
  // 当前页面没有对应的飞书表格时不渲染
  if (!match) return null;

  const { table, url } = match;

  const handleClick = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
          onClick={handleClick}
        >
          <span className="text-sm">{table.icon}</span>
          <span className="hidden sm:inline text-xs">在飞书中查看</span>
          <ExternalLink className="size-3" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>打开飞书「{table.tableName}」</p>
        <p className="text-xs text-muted-foreground">{table.description}</p>
      </TooltipContent>
    </Tooltip>
  );
}

// ============ 全局飞书下拉菜单 ============

interface FeishuGlobalDropdownProps {
  /** 触发按钮的 class 名（可选，用于 Header 集成） */
  className?: string;
}

export function FeishuGlobalDropdown({ className }: FeishuGlobalDropdownProps) {
  const { data: config } = useFeishuRuntimeConfig();
  const tables = getAllFeishuTableLinks(config);

  const handleOpenTable = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // 当前租户未开通或配置不完整时不显示无效入口。
  if (tables.length === 0) return null;

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={className || 'size-9'}
              aria-label="飞书多维表格"
            >
              <svg
                viewBox="0 0 24 24"
                className="size-5"
                fill="currentColor"
              >
                {/* 简约飞书风格图标：一个带折角的文档 */}
                <path d="M4 3h11l5 5v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" 
                  fill="none" stroke="currentColor" strokeWidth="1.5" />
                <path d="M15 3v5h5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <line x1="7" y1="11" x2="17" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="7" y1="15" x2="14" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">飞书多维表格</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
            <path d="M4 3h11l5 5v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M15 3v5h5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          飞书多维表格
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {tables.map(({ key, table, url }) => (
          <DropdownMenuItem
            key={key}
            onClick={() => handleOpenTable(url)}
            className="flex items-center gap-3 cursor-pointer py-2.5"
          >
            <span className="text-lg flex-shrink-0">{table.icon}</span>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium truncate">{table.tableName}</span>
              <span className="text-xs text-muted-foreground truncate">{table.description}</span>
            </div>
            <ExternalLink className="size-3 text-muted-foreground ml-auto flex-shrink-0" />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
