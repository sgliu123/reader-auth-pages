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

export async function onRequestPost(context) {
  const { env, request } = context;

  const body = await request.json().catch(() => ({}));
  const count = Math.min(body.count || 1, 100); // 最多100个
  const expiresIn = body.expiresIn; // 过期时间，单位毫秒

  const keys = [];
  for (let n = 0; n < count; n++) {
    const key = generateKey();
    const expirationTtl = expiresIn ? Math.floor(expiresIn / 1000) : undefined;

    await env.AUTH_KV.put(key, JSON.stringify({
      createdAt: new Date().toISOString(),
      used: false,
      usedAt: null,
    }), expirationTtl ? { expirationTtl } : undefined);

    keys.push(key);
  }

  return new Response(JSON.stringify({
    success: true,
    data: { keys }
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
