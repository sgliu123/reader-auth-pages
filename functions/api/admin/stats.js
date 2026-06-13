// 获取统计信息
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
    data: {
      totalKeys: keys.length,
      activeKeys: keys.filter(k => !k.expiration || k.expiration > Date.now()).length,
      expiredKeys: keys.filter(k => k.expiration && k.expiration <= Date.now()).length,
      timestamp: new Date().toISOString(),
    }
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
