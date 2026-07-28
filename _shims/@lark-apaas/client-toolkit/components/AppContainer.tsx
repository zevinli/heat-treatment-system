import React from 'react';

export function AppContainer({ children, className }: { children: React.ReactNode; className?: string }) {
  return React.createElement('div', { className }, children);
}
export default AppContainer;
