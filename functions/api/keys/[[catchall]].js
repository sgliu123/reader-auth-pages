// CORS 头配置
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// 为响应添加 CORS 头
function addCors(response) {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

// 处理 OPTIONS 预检请求
export async function onRequestOptions(context) {
  return new Response(null, { status: 204, headers: corsHeaders });
}

// 授权码管理 - 适配 AUTH_KV 格式
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  try {
    let response;

    if (path === '/api/keys/list' && method === 'GET') {
      response = await listKeys(env.AUTH_KV);
    } else if (path === '/api/keys/generate' && method === 'POST') {
      response = await generateKeys(request, env.AUTH_KV);
    } else if (path === '/api/keys/validate' && method === 'POST') {
      response = await validateKey(request, env.AUTH_KV);
    } else if (path === '/api/keys/use' && method === 'POST') {
      response = await useKey(request, env.AUTH_KV);
    } else if (path === '/api/keys/delete' && method === 'POST') {
      response = await deleteKey(request, env.AUTH_KV);
    } else {
      response = new Response(JSON.stringify({
        success: false,
        error: 'Not Found',
        path,
        method
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return addCors(response);

  } catch (error) {
    console.error('API Error:', error);
    return addCors(new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    }));
  }
}

// 列出授权码
async function listKeys(kv) {
  const list = await kv.list();
  const keys = [];

  for (const item of list.keys) {
    const value = await kv.get(item.name);
    let data = null;
    try {
      data = JSON.parse(value);
    } catch (e) {
      data = { rawValue: value };
    }

    keys.push({
      key: item.name,
      type: data.type || '30',
      status: data.status || 'active',
      deviceId: data.deviceId || null,
      activatedAt: data.activatedAt || null,
      expiresAt: data.expiresAt || null,
      createdAt: data.createdAt || null,
    });
  }

  return new Response(JSON.stringify({
    success: true,
    keys
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

// 生成授权码
async function generateKeys(request, kv) {
  const body = await request.json();
  const { type = '30', count = 1 } = body;

  const generatedKeys = [];

  for (let i = 0; i < count; i++) {
    const key = generateLicenseKey();
    const keyData = {
      type,
      status: 'active',
      deviceId: null,
      activatedAt: null,
      expiresAt: null,
      createdAt: Date.now()
    };

    await kv.put(key, JSON.stringify(keyData));
    generatedKeys.push(key);
  }

  return new Response(JSON.stringify({
    success: true,
    msg: `成功生成 ${generatedKeys.length} 个授权码`,
    keys: generatedKeys
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

// 验证授权码
async function validateKey(request, kv) {
  const body = await request.json();
  const { licenseKey, deviceId } = body;

  if (!licenseKey) {
    return new Response(JSON.stringify({
      success: false,
      error: '授权码不能为空'
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const value = await kv.get(licenseKey);
  if (!value) {
    return new Response(JSON.stringify({
      success: false,
      error: '授权码不存在'
    }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }

  const keyData = JSON.parse(value);

  if (keyData.status === 'disabled') {
    return new Response(JSON.stringify({
      success: false,
      error: '授权码已被禁用'
    }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  if (keyData.deviceId && keyData.deviceId !== deviceId) {
    return new Response(JSON.stringify({
      success: false,
      error: '授权码已绑定其他设备'
    }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  if (keyData.expiresAt && Date.now() > keyData.expiresAt) {
    return new Response(JSON.stringify({
      success: false,
      error: '授权码已过期'
    }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify({
    success: true,
    valid: true,
    type: keyData.type,
    expiresAt: keyData.expiresAt
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

// 使用/激活授权码
async function useKey(request, kv) {
  const body = await request.json();
  const { licenseKey, deviceId, deviceName, action = 'activate' } = body;

  if (!licenseKey) {
    return new Response(JSON.stringify({
      success: false,
      error: '授权码不能为空'
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const value = await kv.get(licenseKey);
  if (!value) {
    return new Response(JSON.stringify({
      success: false,
      error: '授权码不存在'
    }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }

  const keyData = JSON.parse(value);

  if (action === 'unbind') {
    keyData.deviceId = null;
    keyData.activatedAt = null;
    keyData.expiresAt = null;
    await kv.put(licenseKey, JSON.stringify(keyData));
    return new Response(JSON.stringify({
      success: true,
      msg: '已解除绑定'
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (keyData.status === 'disabled') {
    return new Response(JSON.stringify({
      success: false,
      error: '授权码已被禁用'
    }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  if (keyData.deviceId && keyData.deviceId !== deviceId) {
    return new Response(JSON.stringify({
      success: false,
      error: '授权码已绑定其他设备'
    }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  // 计算过期时间
  let expiresAt = null;
  if (keyData.type !== 'lifetime') {
    const days = parseInt(keyData.type) || 30;
    expiresAt = Date.now() + days * 86400000;
  } else {
    expiresAt = 9999999999999;
  }

  keyData.deviceId = deviceId;
  keyData.deviceName = deviceName;
  keyData.activatedAt = Date.now();
  keyData.expiresAt = expiresAt;

  await kv.put(licenseKey, JSON.stringify(keyData));

  return new Response(JSON.stringify({
    success: true,
    msg: '激活成功',
    expiresAt
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

// 删除授权码
async function deleteKey(request, kv) {
  const body = await request.json();
  const { licenseKey } = body;

  if (!licenseKey) {
    return new Response(JSON.stringify({
      success: false,
      error: '授权码不能为空'
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  await kv.delete(licenseKey);

  return new Response(JSON.stringify({
    success: true,
    msg: '删除成功'
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

// 生成授权码
function generateLicenseKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let key = '';
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) key += '-';
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}
