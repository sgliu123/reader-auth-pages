// 列出所有密钥
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

  return new Response(JSON.stringify({
    success: true,
    data: { keys }
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
