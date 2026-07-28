import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Sun, Moon, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type Theme = 'light' | 'dark' | 'eye-care' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark' | 'eye-care';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'heat-treatment-theme';

// 获取系统主题偏好
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// 获取初始主题
const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem(STORAGE_KEY) as Theme;
  return stored || 'light';
};

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  enableSystem?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = 'light',
  enableSystem = true,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark' | 'eye-care'>('light');
  const [mounted, setMounted] = useState(false);

  // 初始化
  useEffect(() => {
    setMounted(true);
    const initial = getInitialTheme();
    setThemeState(initial);
  }, []);

  // 应用主题
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    let appliedTheme: 'light' | 'dark' | 'eye-care';

    if (theme === 'system' && enableSystem) {
      appliedTheme = getSystemTheme();
    } else {
      appliedTheme = theme as 'light' | 'dark' | 'eye-care';
    }

    setResolvedTheme(appliedTheme);

    // 移除所有主题类
    root.classList.remove('light', 'dark');
    root.removeAttribute('data-theme');

    // 应用新主题
    if (appliedTheme === 'eye-care') {
      root.setAttribute('data-theme', 'eye-care');
    } else {
      root.classList.add(appliedTheme);
      if (appliedTheme === 'dark') {
        root.setAttribute('data-theme', 'dark');
      }
    }

    // 存储用户偏好
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme, mounted, enableSystem]);

  // 监听系统主题变化
  useEffect(() => {
    if (!enableSystem || theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      setResolvedTheme(getSystemTheme());
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme, enableSystem]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    const themes: Theme[] = ['light', 'dark', 'eye-care'];
    const currentIndex = themes.indexOf(theme === 'system' ? resolvedTheme as Theme : theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  // 防止闪烁
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// 主题切换按钮
interface ThemeToggleProps {
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showLabel?: boolean;
}

const themeIcons = {
  light: Sun,
  dark: Moon,
  'eye-care': Eye,
  system: Sun,
};

const themeLabels = {
  light: '浅色模式',
  dark: '深色模式',
  'eye-care': '护眼模式',
  system: '跟随系统',
};

export function ThemeToggle({
  variant = 'ghost',
  size = 'icon',
  className,
  showLabel = false,
}: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const Icon = themeIcons[resolvedTheme] || Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn(
            'relative overflow-hidden transition-all duration-300',
            'hover:scale-105 active:scale-95',
            className
          )}
        >
          <Icon className="h-[1.2rem] w-[1.2rem] transition-transform duration-500 rotate-0 scale-100" />
          {showLabel && (
            <span className="ml-2 text-sm">{themeLabels[resolvedTheme]}</span>
          )}
          <span className="sr-only">切换主题</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className={cn(
            'gap-2 cursor-pointer transition-colors',
            theme === 'light' && 'bg-accent'
          )}
        >
          <Sun className="h-4 w-4" />
          <span>浅色模式</span>
          {theme === 'light' && (
            <span className="ml-auto text-xs text-primary">✓</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className={cn(
            'gap-2 cursor-pointer transition-colors',
            theme === 'dark' && 'bg-accent'
          )}
        >
          <Moon className="h-4 w-4" />
          <span>深色模式</span>
          {theme === 'dark' && (
            <span className="ml-auto text-xs text-primary">✓</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('eye-care')}
          className={cn(
            'gap-2 cursor-pointer transition-colors',
            theme === 'eye-care' && 'bg-accent'
          )}
        >
          <Eye className="h-4 w-4" />
          <span>护眼模式</span>
          {theme === 'eye-care' && (
            <span className="ml-auto text-xs text-primary">✓</span>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// 简洁主题切换按钮（仅切换浅色/深色）
export function SimpleThemeToggle({
  variant = 'ghost',
  size = 'icon',
  className,
}: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleTheme}
      className={cn(
        'relative overflow-hidden transition-all duration-300',
        'hover:scale-105 active:scale-95',
        className
      )}
    >
      <Sun
        className={cn(
          'h-[1.2rem] w-[1.2rem] absolute transition-all duration-500',
          isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
        )}
      />
      <Moon
        className={cn(
          'h-[1.2rem] w-[1.2rem] transition-all duration-500',
          isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
        )}
      />
      <span className="sr-only">{isDark ? '切换到浅色' : '切换到深色'}</span>
    </Button>
  );
}
