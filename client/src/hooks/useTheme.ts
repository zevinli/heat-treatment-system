import { useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark' | 'eye-care';

interface ThemeConfig {
  label: string;
  description: string;
  icon: string;
}

export const THEME_CONFIGS: Record<Theme, ThemeConfig> = {
  light: {
    label: '浅色模式',
    description: '明亮的界面风格',
    icon: 'Sun',
  },
  dark: {
    label: '深色模式',
    description: '护眼暗色风格',
    icon: 'Moon',
  },
  'eye-care': {
    label: '护眼模式',
    description: '暖色护眼风格',
    icon: 'Eye',
  },
};

export const allThemes = THEME_CONFIGS;

const STORAGE_KEY = 'heat-treatment-theme';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  // 获取当前主题配置
  const config = THEME_CONFIGS[theme];

  // 初始化主题
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme;
    const initial = stored || 'light';
    setThemeState(initial);
    applyTheme(initial);
    setMounted(true);
  }, []);

  // 应用主题到 DOM
  const applyTheme = useCallback((newTheme: Theme) => {
    const root = document.documentElement;

    // 移除所有主题类
    root.classList.remove('light', 'dark');
    root.removeAttribute('data-theme');

    // 应用新主题
    if (newTheme === 'eye-care') {
      root.setAttribute('data-theme', 'eye-care');
    } else {
      root.classList.add(newTheme);
      if (newTheme === 'dark') {
        root.setAttribute('data-theme', 'dark');
      }
    }
  }, []);

  // 设置主题
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
    applyTheme(newTheme);
  }, [applyTheme]);

  // 切换主题（浅色 -> 深色 -> 护眼 -> 浅色）
  const toggleTheme = useCallback(() => {
    const themes: Theme[] = ['light', 'dark', 'eye-care'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  }, [theme, setTheme]);

  // 切换浅色/深色（不包含护眼）
  const toggleLightDark = useCallback(() => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  }, [theme, setTheme]);

  return {
    theme,
    setTheme,
    toggleTheme,
    toggleLightDark,
    mounted,
    config,
    allThemes: THEME_CONFIGS,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    isEyeCare: theme === 'eye-care',
  };
}
