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

  for (const item of list.keys) {
    const value = await env.AUTH_KV.get(item.name);
    if (value) {
      const data = JSON.parse(value);

      // 兼容旧数据格式
      if (data.createdAt && !data.key) {
        // 这是旧格式数据，转换为新格式
        keys.push({
          key: item.name,
          type: '30',
          status: data.used ? 'active' : 'unused',
          deviceId: null,
          activatedAt: data.usedAt,
          expiresAt: item.expiration || null,
          createdAt: data.createdAt
        });
      } else {
        // 新格式数据
        keys.push(data);
      }
    }
  }

  return addCors(new Response(JSON.stringify({
    keys: keys
  }), {
    headers: { 'Content-Type': 'application/json' },
  }));
}
