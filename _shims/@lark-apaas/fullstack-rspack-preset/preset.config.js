const rspack = require('@rspack/core');
const path = require('path');

module.exports = {
  module: {
    rules: [
      {
        test: /\\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
      {
        test: /\\.(ts|tsx)$/,
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
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
    tsConfig: { configFile: path.resolve(__dirname, '../../tsconfig.app.json') },
    alias: { '@': path.resolve(__dirname, '../../client/src') },
  },
  plugins: [new rspack.HtmlRspackPlugin({ template: './client/index.html' })],
};
