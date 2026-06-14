// CORS 头配置
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

function addCors(response) {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export async function onRequestOptions(context) {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequestGet(context) {
  const { env } = context;

  const keys = [];
  const list = await env.AUTH_KV.list();
  
  for (const key of list.keys) {
    const value = await env.AUTH_KV.get(key.name);
    if (value) {
      keys.push(JSON.parse(value));
    }
  }

  return addCors(new Response(JSON.stringify({
    keys: keys  // 直接返回 keys，不要嵌套 data
  }), {
    headers: { 'Content-Type': 'application/json' },
  }));
}
