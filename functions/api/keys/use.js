// 使用密钥
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
      success: false,
      error: 'Key not found'
    }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const keyData = JSON.parse(value);
  if (keyData.used) {
    return new Response(JSON.stringify({
      success: true,
      data: { valid: false, reason: 'Key already used' }
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  keyData.used = true;
  keyData.usedAt = new Date().toISOString();
  await env.AUTH_KV.put(key, JSON.stringify(keyData));

  return new Response(JSON.stringify({
    success: true,
    data: { valid: true }
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
