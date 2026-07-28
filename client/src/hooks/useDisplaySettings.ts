import { useState, useEffect, useCallback } from 'react';

export type FontSizeLevel = 'small' | 'medium' | 'large' | 'xlarge';

const FONT_SIZE_KEY = 'display_font_size';

export const fontSizeMap: Record<FontSizeLevel, string> = {
  small: '14px',   // 小（当前大小）
  medium: '15px',  // 中
  large: '16px',   // 大
  xlarge: '18px',  // 特大
};

export const fontSizeLabels: Record<FontSizeLevel, string> = {
  small: '小',
  medium: '中',
  large: '大',
  xlarge: '特大',
};

export const getStoredFontSize = (): FontSizeLevel => {
  try {
    const stored = localStorage.getItem(FONT_SIZE_KEY);
    if (stored && ['small', 'medium', 'large', 'xlarge'].includes(stored)) {
      return stored as FontSizeLevel;
    }
  } catch {
    // ignore
  }
  return 'small';
};

export const useDisplaySettings = () => {
  const [fontSize, setFontSizeState] = useState<FontSizeLevel>(getStoredFontSize());

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === FONT_SIZE_KEY) {
        setFontSizeState(getStoredFontSize());
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const setFontSize = useCallback((level: FontSizeLevel) => {
    try {
      localStorage.setItem(FONT_SIZE_KEY, level);
      setFontSizeState(level);
      // 立即应用到文档
      document.documentElement.style.fontSize = fontSizeMap[level];
    } catch {
      // ignore
    }
  }, []);

  return {
    fontSize,
    setFontSize,
    fontSizeMap,
    fontSizeOptions: Object.keys(fontSizeMap) as FontSizeLevel[],
  };
};
