# Reader Auth API - 授权码管理后端

基于 Cloudflare Pages Functions + AUTH_KV 的授权码管理 API。

## 更新说明

本次更新添加了完整 CORS 支持，解决前端跨域访问问题。

## API 端点

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/admin/stats` | GET | 查看统计 |
| `/api/keys/list` | GET | 列出授权码 |
| `/api/keys/generate` | POST | 生成授权码 |
| `/api/keys/validate` | POST | 验证授权码 |
| `/api/keys/use` | POST | 激活/解除绑定 |
| `/api/keys/delete` | POST | 删除授权码 |

## CORS 配置

已自动处理：
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, OPTIONS`
- 自动响应 OPTIONS 预检请求

## 部署

推送到 GitHub 后，Cloudflare Pages 自动部署。

确保 KV 绑定变量名为 `AUTH_KV`。
