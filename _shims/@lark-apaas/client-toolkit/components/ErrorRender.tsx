import React from 'react';

export function ErrorRender({ error, children }: { error?: Error | null; errorInfo?: React.ErrorInfo | null; children?: React.ReactNode }) {
  if (!error) {
    return React.createElement(React.Fragment, null, children);
  }
  return React.createElement('div', { style: { padding: 24, textAlign: 'center' } },
    React.createElement('h2', { style: { fontSize: 18, fontWeight: 600, marginBottom: 8 } }, 'Something went wrong'),
    React.createElement('pre', { style: { color: '#ef4444', fontSize: 14 } }, error.message)
  );
}
export default ErrorRender;
