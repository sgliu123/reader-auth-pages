// ============================================
// Cloudflare Pages Functions - 授权码管理 API
// 路径: functions/api/[[path]].js
// 匹配所有 /api/* 请求
// ============================================

// CORS 响应头配置
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// 处理 CORS 预检请求 (OPTIONS)
export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// 主请求处理 - 为所有响应添加 CORS 头
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // 获取 KV 存储（绑定名称为 LICENSE_KV）
  const kv = env.LICENSE_KV;

  try {
    let response;

    // 路由分发
    if (path === '/api/admin/stats' && request.method === 'GET') {
      response = await getStats(kv);
    } else if (path === '/api/keys/list' && request.method === 'GET') {
      response = await listKeys(kv);
    } else if (path === '/api/keys/generate' && request.method === 'POST') {
      response = await generateKeys(request, kv);
    } else if (path === '/api/keys/validate' && request.method === 'POST') {
      response = await validateKey(request, kv);
    } else if (path === '/api/keys/use' && request.method === 'POST') {
      response = await useKey(request, kv);
    } else if (path === '/api/keys/delete' && request.method === 'POST') {
      response = await deleteKey(request, kv);
    } else {
      response = new Response(JSON.stringify({ code: 404, msg: '接口不存在' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 为所有响应添加 CORS 头
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;

  } catch (error) {
    console.error('API Error:', error);
    const errorResponse = new Response(JSON.stringify({ 
      code: 500, 
      msg: '服务器内部错误: ' + error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });

    Object.entries(corsHeaders).forEach(([key, value]) => {
      errorResponse.headers.set(key, value);
    });

    return errorResponse;
  }
}

// ============================================
// 业务逻辑函数
// ============================================

// 查看统计
async function getStats(kv) {
  const keys = await kv.list();
  const allKeys = keys.keys || [];

  let active = 0, bound = 0, unused = 0;

  for (const key of allKeys) {
    const data = await kv.get(key.name, { type: 'json' });
    if (data) {
      if (data.status === 'active') active++;
      if (data.deviceId) bound++;
      if (!data.deviceId && data.status === 'active') unused++;
    }
  }

  return jsonResponse({
    code: 200,
    total: allKeys.length,
    active,
    bound,
    unused
  });
}

// 列出授权码
async function listKeys(kv) {
  const keys = await kv.list();
  const allKeys = keys.keys || [];
  const result = [];

  for (const key of allKeys) {
    const data = await kv.get(key.name, { type: 'json' });
    if (data) {
      result.push({
        key: key.name,
        type: data.type || '30',
        status: data.status || 'active',
        deviceId: data.deviceId || null,
        activatedAt: data.activatedAt || null,
        expiresAt: data.expiresAt || null
      });
    }
  }

  return jsonResponse({
    code: 200,
    keys: result
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

  return jsonResponse({
    code: 200,
    msg: `成功生成 ${generatedKeys.length} 个授权码`,
    keys: generatedKeys
  });
}

// 验证授权码
async function validateKey(request, kv) {
  const body = await request.json();
  const { licenseKey, deviceId } = body;

  if (!licenseKey) {
    return jsonResponse({ code: 400, msg: '授权码不能为空' }, 400);
  }

  const keyData = await kv.get(licenseKey, { type: 'json' });

  if (!keyData) {
    return jsonResponse({ code: 404, msg: '授权码不存在' }, 404);
  }

  if (keyData.status === 'disabled') {
    return jsonResponse({ code: 403, msg: '授权码已被禁用' }, 403);
  }

  if (keyData.deviceId && keyData.deviceId !== deviceId) {
    return jsonResponse({ code: 403, msg: '授权码已绑定其他设备' }, 403);
  }

  // 检查是否过期
  if (keyData.expiresAt && Date.now() > keyData.expiresAt) {
    return jsonResponse({ code: 403, msg: '授权码已过期' }, 403);
  }

  return jsonResponse({
    code: 200,
    valid: true,
    type: keyData.type,
    expiresAt: keyData.expiresAt
  });
}

// 使用/激活授权码
async function useKey(request, kv) {
  const body = await request.json();
  const { licenseKey, deviceId, deviceName, action = 'activate' } = body;

  if (!licenseKey) {
    return jsonResponse({ code: 400, msg: '授权码不能为空' }, 400);
  }

  const keyData = await kv.get(licenseKey, { type: 'json' });

  if (!keyData) {
    return jsonResponse({ code: 404, msg: '授权码不存在' }, 404);
  }

  if (action === 'unbind') {
    // 解除绑定
    keyData.deviceId = null;
    keyData.activatedAt = null;
    keyData.expiresAt = null;
    await kv.put(licenseKey, JSON.stringify(keyData));
    return jsonResponse({ code: 200, msg: '已解除绑定' });
  }

  // 激活逻辑
  if (keyData.status === 'disabled') {
    return jsonResponse({ code: 403, msg: '授权码已被禁用' }, 403);
  }

  if (keyData.deviceId && keyData.deviceId !== deviceId) {
    return jsonResponse({ code: 403, msg: '授权码已绑定其他设备' }, 403);
  }

  // 计算过期时间
  let expiresAt = null;
  if (keyData.type !== 'lifetime') {
    const days = parseInt(keyData.type) || 30;
    expiresAt = Date.now() + days * 86400000;
  } else {
    expiresAt = 9999999999999; // 永久
  }

  keyData.deviceId = deviceId;
  keyData.deviceName = deviceName;
  keyData.activatedAt = Date.now();
  keyData.expiresAt = expiresAt;

  await kv.put(licenseKey, JSON.stringify(keyData));

  return jsonResponse({
    code: 200,
    msg: '激活成功',
    expiresAt
  });
}

// 删除授权码
async function deleteKey(request, kv) {
  const body = await request.json();
  const { licenseKey } = body;

  if (!licenseKey) {
    return jsonResponse({ code: 400, msg: '授权码不能为空' }, 400);
  }

  await kv.delete(licenseKey);

  return jsonResponse({
    code: 200,
    msg: '删除成功'
  });
}

// ============================================
// 工具函数
// ============================================

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

// JSON 响应封装
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
