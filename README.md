# 安迅家官网 CMS

零依赖 Node.js 官网 + 内容后台。

## 本地运行

```bash
node server.js
```

- 前台：http://localhost:3000/
- 后台：http://localhost:3000/admin

## 环境变量

- `PORT`：监听端口（默认 3000）
- `ADMIN_TOKEN`：后台保存/重置的口令保护

## 一键部署建议

适合部署到支持持久文件系统的平台：

- Railway
- Render
- Fly.io
- 任意 VPS（配合 PM2 / systemd）

**注意**：Vercel 等无服务器平台不适合，因为后台会写入 `content.json`，需要持久存储。

生产环境建议放在 Nginx/Caddy 之后，并设置 `ADMIN_TOKEN`。
