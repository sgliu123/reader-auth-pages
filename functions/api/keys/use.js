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
  const licenseKey = body.licenseKey;
  const action = body.action; // 'bind' 或 'unbind'
  const deviceId = body.deviceId;

  if (!licenseKey) {
    return addCors(new Response(JSON.stringify({ error: '缺少授权码' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    }));
  }

  const value = await env.AUTH_KV.get(licenseKey);
  if (!value) {
    return addCors(new Response(JSON.stringify({ error: '授权码不存在' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    }));
  }

  const keyData = JSON.parse(value);

  if (action === 'unbind') {
    keyData.deviceId = null;
    keyData.status = 'active';
  } else {
    // bind
    keyData.deviceId = deviceId;
    keyData.status = 'active';
    keyData.activatedAt = Date.now();
  }

  await env.AUTH_KV.put(licenseKey, JSON.stringify(keyData));

  return addCors(new Response(JSON.stringify({
    success: true,
    key: keyData
  }), {
    headers: { 'Content-Type': 'application/json' },
  }));
}
