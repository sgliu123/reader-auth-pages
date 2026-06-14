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
  const licenseKey = body.licenseKey;  // ✅ 修复：使用 licenseKey 而不是 key

  if (!licenseKey) {
    return addCors(new Response(JSON.stringify({
      valid: false,
      error: '缺少授权码'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    }));
  }

  const value = await env.AUTH_KV.get(licenseKey);
  if (!value) {
    return addCors(new Response(JSON.stringify({
      valid: false,
      error: '授权码不存在'
    }), {
      headers: { 'Content-Type': 'application/json' },
    }));
  }

  const keyData = JSON.parse(value);
  
  // ✅ 修复：使用新数据格式
  // 检查是否已过期
  if (keyData.expiresAt && keyData.expiresAt < Date.now()) {
    return addCors(new Response(JSON.stringify({
      valid: false,
      error: '授权码已过期'
    }), {
      headers: { 'Content-Type': 'application/json' },
    }));
  }

  // 检查是否已被使用（绑定）
  const isUsed = keyData.status !== 'unused' || keyData.deviceId !== null;

  return addCors(new Response(JSON.stringify({
    valid: true,
    success: true,
    key: keyData,
    isUsed: isUsed
  }), {
    headers: { 'Content-Type': 'application/json' },
  }));
}
