// 生成随机密钥
function generateKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let key = '';
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) key += '-';
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

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

export async function onRequestPost(context) {
  const { env, request } = context;

  const body = await request.json().catch(() => ({}));
  const count = Math.min(body.count || 1, 100);
  const type = body.type || '30'; // 前端传的是 type: '30', '90', '365', 'lifetime'

  const keys = [];
  for (let n = 0; n < count; n++) {
    const key = generateKey();
    const now = Date.now();
    
    // 计算过期时间
    let expiresAt = null;
    if (type !== 'lifetime') {
      expiresAt = now + parseInt(type) * 24 * 60 * 60 * 1000;
    }

    // 存储完整数据，适配前端格式
    await env.AUTH_KV.put(key, JSON.stringify({
      key: key,
      type: type,
      status: 'unused',
      deviceId: null,
      activatedAt: null,
      expiresAt: expiresAt,
      createdAt: now
    }));

    keys.push(key);
  }

  return addCors(new Response(JSON.stringify({
    keys: keys  // 直接返回，不要嵌套 data
  }), {
    headers: { 'Content-Type': 'application/json' },
  }));
}
