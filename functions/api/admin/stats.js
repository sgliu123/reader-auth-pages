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

// 获取统计信息 - 适配 AUTH_KV 格式
export async function onRequestGet(context) {
  const { env } = context;

  const keys = [];
  const list = await env.AUTH_KV.list();
  for (const key of list.keys) {
    keys.push({
      name: key.name,
      expiration: key.expiration,
      metadata: key.metadata,
    });
  }

  return addCors(new Response(JSON.stringify({
    success: true,
    data: {
      totalKeys: keys.length,
      activeKeys: keys.filter(k => !k.expiration || k.expiration > Date.now()).length,
      expiredKeys: keys.filter(k => k.expiration && k.expiration <= Date.now()).length,
      timestamp: new Date().toISOString(),
    }
  }), {
    headers: { 'Content-Type': 'application/json' },
  }));
}
