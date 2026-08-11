import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Sun, Moon, Eye, Check, Palette } from 'lucide-react';
import { useTheme, type Theme, THEME_CONFIGS } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

const themeIcons: Record<Theme, typeof Sun> = {
  light: Sun,
  dark: Moon,
  'eye-care': Eye,
};

const themeGradients: Record<Theme, string> = {
  light: 'from-amber-400 via-orange-400 to-yellow-400',
  dark: 'from-indigo-500 via-purple-500 to-blue-500',
  'eye-care': 'from-amber-600 via-orange-500 to-yellow-500',
};

export function ThemeSwitcher({ 
  variant = 'default',
  size = 'default',
  className,
}: { 
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}) {
  const { theme, setTheme, config, allThemes } = useTheme();
  const [open, setOpen] = useState(false);

  const CurrentIcon = themeIcons[theme];

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          size={size}
          aria-label={`切换界面主题，当前为${config.label}`}
          title={`切换界面主题，当前为${config.label}`}
          className={cn(
            "relative overflow-hidden transition-all duration-300",
            size === 'icon' ? 'h-9 w-9' : 'h-9 px-3',
            className
          )}
        >
          {/* 背景渐变效果 */}
          <div 
            className={cn(
              "absolute inset-0 opacity-10 bg-gradient-to-br transition-all duration-500",
              themeGradients[theme]
            )} 
          />
          
          <div className="relative flex items-center gap-2">
            <div 
              className={cn(
                "flex items-center justify-center rounded-lg transition-all duration-300",
                size === 'icon' ? 'w-full h-full' : 'w-7 h-7',
                "bg-gradient-to-br",
                themeGradients[theme]
              )}
            >
              <CurrentIcon className={cn(
                "text-primary-foreground transition-transform duration-300",
                size === 'icon' ? 'size-4' : 'size-3.5'
              )} />
            </div>
            {size !== 'icon' && (
              <span className="text-sm font-medium">{config.label}</span>
            )}
          </div>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-56 p-2"
        sideOffset={8}
      >
        <DropdownMenuLabel className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <Palette className="size-3.5" />
          主题设置
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator className="my-1.5" />
        
        {(Object.keys(allThemes) as Theme[]).map((themeKey) => {
          const themeConfig = allThemes[themeKey];
          const Icon = themeIcons[themeKey];
          const isActive = theme === themeKey;
          
          return (
            <DropdownMenuItem
              key={themeKey}
              onClick={() => {
                setTheme(themeKey);
                setOpen(false);
              }}
              className={cn(
                "flex items-center gap-3 px-2 py-2.5 rounded-lg cursor-pointer transition-all duration-200",
                "hover:bg-accent focus:bg-accent",
                isActive && "bg-accent/60"
              )}
            >
              {/* 主题图标 */}
              <div 
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 bg-gradient-to-br",
                  themeGradients[themeKey],
                  isActive && "shadow-md ring-2 ring-primary/20"
                )}
              >
                <Icon className="size-4 text-primary-foreground" />
              </div>
              
              {/* 主题信息 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={cn(
                    "text-sm font-medium transition-colors",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {themeConfig.label}
                  </span>
                  {isActive && (
                    <Check className="size-3.5 text-primary" />
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground/80 leading-tight mt-0.5">
                  {themeConfig.description}
                </p>
              </div>
            </DropdownMenuItem>
          );
        })}
        
        <DropdownMenuSeparator className="my-1.5" />
        
        {/* 快捷键提示 */}
        <div className="px-2 py-1.5 text-[10px] text-muted-foreground/60 text-center">
          点击上方选项切换主题
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// 紧凑版本的主题切换器（仅图标按钮）
export function ThemeSwitcherCompact({ className }: { className?: string }) {
  return (
    <ThemeSwitcher 
      variant="ghost" 
      size="icon" 
      className={cn("rounded-lg", className)} 
    />
  );
}

// 浮动操作按钮版本
export function ThemeSwitcherFab({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const CurrentIcon = themeIcons[theme];
  
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className={cn(
        "fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg",
        "hover:shadow-xl hover:scale-105 transition-all duration-300",
        "border-2 bg-background/80 backdrop-blur-sm",
        className
      )}
      title="切换主题"
    >
      <div className={cn(
        "flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br",
        themeGradients[theme]
      )}>
        <CurrentIcon className="size-4 text-primary-foreground" />
      </div>
    </Button>
  );
}
