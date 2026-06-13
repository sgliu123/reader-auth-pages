// 根路径和 404 处理
export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;

  // 根路径或 /api
  if (path === '/' || path === '/api' || path === '/api/') {
    return new Response(JSON.stringify({
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
    });
  }

  // 404
  return new Response(JSON.stringify({
    success: false,
    error: 'Not Found',
    path: path
  }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });
}
