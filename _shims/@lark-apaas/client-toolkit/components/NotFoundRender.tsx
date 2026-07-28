import React from 'react';

interface NotFoundRenderProps {
  title?: string;
  message?: string;
  children?: React.ReactNode;
}

export function NotFoundRender({ title, message, children }: NotFoundRenderProps) {
  return React.createElement('div', { style: { padding: 48, textAlign: 'center' } },
    React.createElement('h1', { style: { fontSize: 72, fontWeight: 700, color: '#d1d5db', marginBottom: 16 } }, '404'),
    title && React.createElement('h2', { style: { fontSize: 20, fontWeight: 600, marginBottom: 8 } }, title),
    message && React.createElement('p', { style: { color: '#6b7280', fontSize: 14 } }, message),
    children
  );
}
export default NotFoundRender;
