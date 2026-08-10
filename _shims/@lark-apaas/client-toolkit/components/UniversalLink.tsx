import React from 'react';
import { useNavigate } from 'react-router-dom';

interface UniversalLinkProps {
  to: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  openInNewTab?: boolean;
  onClick?: React.MouseEventHandler<HTMLElement>;
}

export function UniversalLink({ to, children, className, style, openInNewTab, onClick }: UniversalLinkProps) {
  const navigate = useNavigate();
  if (openInNewTab || to.startsWith('http')) {
    return React.createElement('a', { href: to, className, style, target: '_blank', rel: 'noopener noreferrer', onClick }, children);
  }
  return React.createElement('span', { className, role: 'link', style: { ...style, cursor: 'pointer' }, onClick: (event: React.MouseEvent<HTMLElement>) => { onClick?.(event); if (!event.defaultPrevented) navigate(to); } }, children);
}
export default UniversalLink;
