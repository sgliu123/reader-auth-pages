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

  if (!licenseKey) {
    return addCors(new Response(JSON.stringify({ error: '缺少授权码' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    }));
  }

  await env.AUTH_KV.delete(licenseKey);

  return addCors(new Response(JSON.stringify({
    success: true
  }), {
    headers: { 'Content-Type': 'application/json' },
  }));
}
