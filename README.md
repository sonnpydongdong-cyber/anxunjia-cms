# 安迅家官网 CMS

零依赖 Node.js 官网 + 内容后台。

- **前台**：https://anxunjia.cc/
- **后台**：https://anxunjia.cc/admin

## 本地运行

```bash
node server.js
```

- 前台：http://localhost:3000/
- 后台：http://localhost:3000/admin

## 环境变量

- `PORT`：监听端口（默认 3000）
- `ADMIN_TOKEN`：后台保存/重置的口令保护

## 部署

适合 Railway、Render、Fly.io 等支持持久文件系统的平台。

生产环境建议设置 `ADMIN_TOKEN`，并将域名绑定为 `anxunjia.cc`。
