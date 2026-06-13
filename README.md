# Reader Auth API - 授权码管理后端

基于 Cloudflare Pages Functions + KV 的授权码管理 API。

## 快速开始

### 1. 创建 Cloudflare KV 命名空间

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 左侧菜单 → **Workers & Pages** → **KV**
3. 点击 **创建命名空间**
4. 名称填写：`LICENSE_KV`
5. 创建后复制 **ID** 填入 `wrangler.toml`

### 2. 修改 wrangler.toml

```toml
[[kv_namespaces]]
binding = "LICENSE_KV"
id = "你的实际 KV ID"
preview_id = "你的 Preview KV ID"
```

### 3. 部署到 Cloudflare Pages

#### 方式一：Git 连接部署（推荐）

1. 将此仓库推送到 GitHub
2. Cloudflare Dashboard → **Workers & Pages** → **创建应用程序** → **Pages** → **连接到 Git**
3. 选择此仓库
4. 构建设置：
   - **构建命令**：留空
   - **构建输出目录**：留空
5. 点击 **保存并部署**

#### 方式二：Wrangler CLI 部署

```bash
# 安装 wrangler
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 部署
wrangler pages deploy .
```

### 4. 绑定 KV 到 Pages 项目

部署后，进入 Pages 项目 → **Settings** → **Functions** → **KV 命名空间绑定**：
- **变量名称**：`LICENSE_KV`
- **KV 命名空间**：选择 `LICENSE_KV`

### 5. 验证部署

访问以下地址测试：

```
https://你的项目名.pages.dev/api/admin/stats
```

期望返回：
```json
{"code":200,"total":0,"active":0,"bound":0,"unused":0}
```

## API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/admin/stats` | GET | 查看统计 |
| `/api/keys/list` | GET | 列出授权码 |
| `/api/keys/generate` | POST | 生成授权码 |
| `/api/keys/validate` | POST | 验证授权码 |
| `/api/keys/use` | POST | 激活/解除绑定 |
| `/api/keys/delete` | POST | 删除授权码 |

## CORS 配置

已内置完整 CORS 支持：
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, OPTIONS`
- 自动处理 OPTIONS 预检请求

## 安全建议

生产环境建议修改 `functions/api/[[path]].js`：

1. **限制 CORS 来源**：将 `*` 改为你的前端域名
2. **添加 API Key**：在请求头中添加验证

## 相关项目

- [智能电子书阅读器](https://github.com/sgliu123/reader-app) - 前端阅读器
- [管理工具](https://github.com/sgliu123/reader-app) - 授权码管理界面
