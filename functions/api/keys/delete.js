// 删除密钥
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

  await env.AUTH_KV.delete(key);

  return new Response(JSON.stringify({
    success: true,
    data: { deleted: true }
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
