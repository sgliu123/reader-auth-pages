// 验证密钥
export async function onRequestPost(context) {
  const { env, request } = context;

  const body = await request.json().catch(() => ({}));
  const key = body.key;

  if (!key) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Key is required'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const value = await env.AUTH_KV.get(key);
  if (!value) {
    return new Response(JSON.stringify({
      success: true,
      data: { valid: false, reason: 'Key not found' }
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const keyData = JSON.parse(value);
  return new Response(JSON.stringify({
    success: true,
    data: {
      valid: !keyData.used,
      used: keyData.used,
      createdAt: keyData.createdAt,
      usedAt: keyData.usedAt,
    }
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
