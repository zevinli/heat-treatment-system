# 🚀 部署指南 - 热处理收发货管理系统

## 当前状态 ✅

- ✅ 1,521 个文件已提交到本地 Git 仓库
- ✅ CI/CD 工作流已配置（GitHub Pages + 后端构建检查）
- ✅ Vercel / Netlify 部署配置文件已创建
- ✅ 一键部署脚本已创建

## 📋 最后一步：推送到 GitHub（3 个选项）

### 选项 A：终端推送（默认）

```bash
cd /Users/user/Documents/system

# 1. 先去 GitHub 创建仓库: https://github.com/new
#    仓库名: heat-treatment-system
#    不要勾选 "Add a README file"

# 2. 关联远程并推送
git remote add origin https://github.com/jp559956/heat-treatment-system.git
git branch -M main
git push -u origin main

# 输入 GitHub 用户名和密码/Token
```

### 选项 B：用 GitHub Desktop 推送
打开 GitHub Desktop → Add Existing Repository → 选择 `/Users/user/Documents/system` → Publish

### 选项 C：用 VS Code 推送
VS Code → Source Control → ... → Remote → Add Remote → Push

---

## 🌐 部署方式

推送后，以下部署自动生效：

| 平台 | 触发方式 | URL |
|------|---------|-----|
| **GitHub Pages** | 自动（git push 后） | `https://jp559956.github.io/heat-treatment-system/` |
| **Vercel** | 连接仓库即可 | `https://你的项目.vercel.app` |
| **Netlify** | 连接仓库即可 | `https://你的项目.netlify.app` |

### Vercel 部署（推荐，支持 API 代理）

```
1. 打开 https://vercel.com
2. Import → 选择 GitHub 仓库 heat-treatment-system
3. 框架自动识别 Vite，直接 Deploy
4. 如需后端 API，在 Vercel 设置中配置 Rewrites
```

### Netlify 部署

```
1. 打开 https://netlify.com
2. Add new site → Import from Git
3. 选择仓库，自动部署
4. 配置文件 netlify.toml 已就绪
```

---

## 🔑 GitHub Pages 设置

推送后，在 GitHub 仓库页面操作：

```
Settings → Pages → Source: "GitHub Actions"
```

推送代码后约 2 分钟，前端自动上线。

---

## 🖥️ 服务器部署（后端）

### 1. 在服务器上

```bash
git clone https://github.com/jp559956/heat-treatment-system.git
cd heat-treatment-system
npm install
cp .env.production .env
# 编辑 .env 填入数据库密码等
npm run build:server
npm run build:client
pm2 start dist/server/main.js --name heat-treatment
```

### 2. Nginx 配置

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /path/to/heat-treatment/dist/client;
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 📱 微信小程序部署

### 方案：WebView 内嵌（最快）

1. 先完成网站部署（获取 HTTPS 域名）
2. 在微信小程序后台配置业务域名
3. 小程序页面使用 `<web-view src="https://your-domain.com">`

### 方案：Taro 重写（最佳体验）

```bash
npx @tarojs/cli init mini-app
cd mini-app
# 将 client/src/api/ 复制过来（复用 API 层）
# 用 Taro 组件重写 UI 页面
npm run build:weapp
```

---

## ✅ 验证清单

- [ ] 代码已推送到 GitHub
- [ ] GitHub Pages 已上线
- [ ] 访问 `https://jp559956.github.io/heat-treatment-system/` 可看到着陆页
- [ ] 登录功能正常（账号: `admin`, 密码: `admin123`）
- [ ] 创建组织后可进入工作台
- [ ] （可选）后端部署到服务器
- [ ] （可选）配置自定义域名
- [ ] （可选）微信小程序 WebView 集成
