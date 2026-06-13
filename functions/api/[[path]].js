// CORS 头配置
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// 为响应添加 CORS 头
function addCors(response) {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

// 处理 OPTIONS 预检请求
export async function onRequestOptions(context) {
  return new Response(null, { status: 204, headers: corsHeaders });
}

// 根路径和 404 处理
export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;

  // 根路径或 /api
  if (path === '/' || path === '/api' || path === '/api/') {
    return addCors(new Response(JSON.stringify({
      success: true,
      message: 'reader-auth API is running (Pages Functions)',
      endpoints: [
        'GET  /api/admin/stats',
        'POST /api/keys/generate',
        'GET  /api/keys/list',
        'POST /api/keys/validate',
        'POST /api/keys/use',
        'POST /api/keys/delete',
      ]
    }), {
      headers: { 'Content-Type': 'application/json' },
    }));
  }

  // 404
  return addCors(new Response(JSON.stringify({
    success: false,
    error: 'Not Found',
    path: path
  }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  }));
}
