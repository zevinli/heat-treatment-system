import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppContainer } from '@lark-apaas/client-toolkit';
import { ErrorRender } from '@lark-apaas/client-toolkit';
import RoutesComponent from './app';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

const MainApp: React.FC = () => {
  return React.createElement(
    QueryClientProvider,
    { client: queryClient },
    React.createElement(
      BrowserRouter,
      null,
      React.createElement(
        AppContainer,
        null,
        React.createElement(
          ErrorRender,
          null,
          React.createElement(RoutesComponent)
        )
      )
    )
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(React.createElement(MainApp));
}
