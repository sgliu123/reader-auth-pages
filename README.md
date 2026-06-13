# reader-auth-pages

基于 Cloudflare Pages Functions 的 API 服务，替代 Workers 部署，国内访问更稳定  。

## 部署步骤

### 1. 获取 KV ID
- 登录 Cloudflare Dashboard → Workers & Pages → KV
- 找到你的 `AUTH_KV` 命名空间，复制其 ID
- 将 `wrangler.toml` 中的 `id = "你的_AUTH_KV_ID"` 替换为实际 ID

### 2. 创建 GitHub 仓库
- 在 GitHub 创建新仓库（例如 `reader-auth-pages`）
- 将本文件夹内容推送到仓库

### 3. Cloudflare Pages 部署
- Dashboard → Workers & Pages → Create application → Pages
- 连接 GitHub 仓库
- 构建设置：
  - Build command: 留空
  - Build output directory: 留空
- 点击 Deploy

### 4. 绑定 KV
- 部署完成后，进入项目 Settings → Functions → KV namespace bindings
- 添加绑定：
  - Variable name: `AUTH_KV`
  - KV namespace: 选择你的 `AUTH_KV`
- 重新部署

### 5. 测试
访问以下端点：
- `https://你的项目名.pages.dev/api/admin/stats`
- `https://你的项目名.pages.dev/api/keys/generate` (POST)
- `https://你的项目名.pages.dev/api/keys/list`
- `https://你的项目名.pages.dev/api/keys/validate` (POST)
- `https://你的项目名.pages.dev/api/keys/use` (POST)
- `https://你的项目名.pages.dev/api/keys/delete` (POST)

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/stats` | 获取统计信息 |
| POST | `/api/keys/generate` | 生成密钥 `{count: 1, expiresIn: 3600000}` |
| GET | `/api/keys/list` | 列出所有密钥 |
| POST | `/api/keys/validate` | 验证密钥 `{key: "XXXX-XXXX-XXXX-XXXX"}` |
| POST | `/api/keys/use` | 使用密钥 `{key: "XXXX-XXXX-XXXX-XXXX"}` |
| POST | `/api/keys/delete` | 删除密钥 `{key: "XXXX-XXXX-XXXX-XXXX"}` |

## 自定义域名（可选）

Pages 项目 → Custom domains → 添加你的域名
