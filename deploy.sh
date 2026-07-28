#!/bin/bash
set -e

echo "========================================="
echo "  热处理管理系统 - 一键部署脚本"
echo "========================================="

# 检查环境
if ! command -v node &> /dev/null; then
    echo "❌ 请先安装 Node.js 22+"
    exit 1
fi

echo ""
echo "📦 安装依赖..."
npm ci

echo ""
echo "🔨 构建前端..."
npm run build:client

echo ""
echo "🔨 构建后端..."
npm run build:server

echo ""
echo "========================================="
echo "  ✅ 构建完成！"
echo "========================================="
echo ""
echo "部署方式："
echo ""
echo "  1️⃣  GitHub Pages (仅前端):"
echo "     git push origin main"
echo "     → 自动部署到 https://你的用户名.github.io/你的仓库名/"
echo ""
echo "  2️⃣  本地运行:"
echo "     npm start"
echo "     → 打开 http://localhost:3000"
echo ""
echo "  3️⃣  Vercel (前端):"
echo "     npx vercel --prod"
echo ""
echo "  4️⃣  Netlify (前端):"
echo "     npx netlify deploy --prod --dir=dist/client"
echo ""
