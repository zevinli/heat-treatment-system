const rspack = require('@rspack/core');
const path = require('path');

const isDev = process.env.NODE_ENV !== 'production';

module.exports = {
  entry: { main: './client/src/index.tsx' },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, 'client/src'),
      '@lark-apaas/client-toolkit/logger': path.resolve(__dirname, '_shims/@lark-apaas/client-toolkit/logger.ts'),
      '@lark-apaas/client-toolkit/utils/getAxiosForBackend': path.resolve(__dirname, '_shims/@lark-apaas/client-toolkit/utils/getAxiosForBackend.ts'),
      '@lark-apaas/client-toolkit/antd-table': path.resolve(__dirname, '_shims/@lark-apaas/client-toolkit/antd-table.tsx'),
      '@lark-apaas/client-toolkit/components/AppContainer': path.resolve(__dirname, '_shims/@lark-apaas/client-toolkit/components/AppContainer.tsx'),
      '@lark-apaas/client-toolkit/components/ErrorRender': path.resolve(__dirname, '_shims/@lark-apaas/client-toolkit/components/ErrorRender.tsx'),
      '@lark-apaas/client-toolkit/components/UniversalLink': path.resolve(__dirname, '_shims/@lark-apaas/client-toolkit/components/UniversalLink.tsx'),
      '@lark-apaas/client-toolkit/hooks/useCurrentUserProfile': path.resolve(__dirname, '_shims/@lark-apaas/client-toolkit/hooks/useCurrentUserProfile.ts'),
      '@lark-apaas/client-toolkit/tools/services': path.resolve(__dirname, '_shims/@lark-apaas/client-toolkit/tools/services.ts'),
      '@lark-apaas/client-toolkit/tools/storage': path.resolve(__dirname, '_shims/@lark-apaas/client-toolkit/tools/storage.ts'),
      '@lark-apaas/client-toolkit/dataloom': path.resolve(__dirname, '_shims/@lark-apaas/client-toolkit/dataloom.ts'),
      '@lark-apaas/client-toolkit': path.resolve(__dirname, '_shims/@lark-apaas/client-toolkit/index.ts'),
    },
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
      {
        test: /\.(ts|tsx)$/,
        use: {
          loader: 'builtin:swc-loader',
          options: {
            jsc: { parser: { syntax: 'typescript', tsx: true } },
          },
        },
        type: 'javascript/auto',
      },
    ],
  },
  plugins: [new rspack.HtmlRspackPlugin({ template: './client/index.html' })],
  output: {
    filename: '[name].js',
    chunkFilename: 'chunks/[name].[contenthash:8].js',
  },
  optimization: isDev ? {} : {
    splitChunks: {
      chunks: 'async',
      minSize: 20000,
      cacheGroups: {
        asyncVendors: {
          test: /[\\/]node_modules[\\/]/,
          chunks: 'async',
          name: 'async-vendors',
          priority: 10,
        },
      },
    },
  },
  devServer: isDev ? {
    port: 8080,
    historyApiFallback: true,
    hot: true,
    proxy: { '/api': 'http://localhost:3000' },
  } : undefined,
};
