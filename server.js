#!/usr/bin/env node
/**
 * 安迅家官网 CMS —— 零依赖 Node 后端
 * 运行: node server.js        (默认 3000 端口)
 * 环境变量:
 *   PORT=3000                 监听端口
 *   ADMIN_TOKEN=你的口令       若设置，后台保存/重置需带请求头 x-admin-token
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const CONTENT_FILE = path.join(ROOT, 'content.json');
const DEFAULT_FILE = path.join(ROOT, 'content.default.json');
const PORT = Number(process.env.PORT || 3000);
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

const readBody = req => new Promise((res, rej) => {
  let d = '';
  req.on('data', c => { d += c; if (d.length > 2e6) { rej(new Error('请求体过大')); req.destroy(); } });
  req.on('end', () => res(d));
  req.on('error', rej);
});

const sendJson = (res, code, obj) => {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
};

/** 过滤并补全内容，防止非法数据写坏前台 */
function sanitize(s) {
  const d = JSON.parse(fs.readFileSync(DEFAULT_FILE, 'utf8'));
  const S = (v, fb, n = 600) => (typeof v === 'string' ? v.slice(0, n) : fb);
  const N = (v, fb, min, max) => (Number.isFinite(+v) ? Math.min(max, Math.max(min, +v)) : fb);
  const L = (v, fb, item, n) => (Array.isArray(v) ? v.slice(0, n).map(item) : fb);
  const col = (v, fb) => (/^#[0-9a-fA-F]{6}$/.test(v || '') ? v : fb);
  const th = (s && typeof s.theme === 'object' && s.theme) || {};
  return {
    brand: S(s.brand, d.brand, 40),
    version: S(s.version, d.version, 20),
    badges: L(s.badges, d.badges, x => S(x, '', 20), 5),
    heroTitle: S(s.heroTitle, d.heroTitle, 40),
    heroHighlight: S(s.heroHighlight, d.heroHighlight, 20),
    slogan: S(s.slogan, d.slogan, 100),
    features: L(s.features, d.features, f => ({
      icon: S(f && f.icon, 'mail', 20),
      title: S(f && f.title, '', 30),
      desc: S(f && f.desc, '', 200)
    }), 6),
    tryTitle: S(s.tryTitle, d.tryTitle, 30),
    tryHint: S(s.tryHint, d.tryHint, 300),
    recipients: L(s.recipients, d.recipients, x => S(x, '', 10), 8),
    placeholder: S(s.placeholder, d.placeholder, 200),
    maxLength: N(s.maxLength, d.maxLength, 10, 200),
    meta: S(s.meta, d.meta, 100),
    deviceLabel: S(s.deviceLabel, d.deviceLabel, 30),
    iosButton: S(s.iosButton, d.iosButton, 30),
    iosUrl: S(s.iosUrl, d.iosUrl, 500),
    androidButton: S(s.androidButton, d.androidButton, 30),
    androidUrl: S(s.androidUrl, d.androidUrl, 500),
    footer: S(s.footer, d.footer, 200),
    theme: {
      bg: col(th.bg, d.theme.bg),
      gold: col(th.gold, d.theme.gold),
      goldHi: col(th.goldHi, d.theme.goldHi),
      cream: col(th.cream, d.theme.cream),
      sub: col(th.sub, d.theme.sub)
    }
  };
}

const authed = req => !ADMIN_TOKEN || req.headers['x-admin-token'] === ADMIN_TOKEN;

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://localhost');
  try {
    /* ---------- API ---------- */
    if (u.pathname === '/api/content' && req.method === 'GET') {
      return sendJson(res, 200, JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf8')));
    }
    if (u.pathname === '/api/content' && req.method === 'PUT') {
      if (!authed(req)) return sendJson(res, 401, { error: '未授权：口令错误或未提供 x-admin-token' });
      const body = sanitize(JSON.parse(await readBody(req) || '{}'));
      fs.writeFileSync(CONTENT_FILE, JSON.stringify(body, null, 2));
      return sendJson(res, 200, { ok: true, saved: body });
    }
    if (u.pathname === '/api/content/reset' && req.method === 'POST') {
      if (!authed(req)) return sendJson(res, 401, { error: '未授权' });
      fs.writeFileSync(CONTENT_FILE, fs.readFileSync(DEFAULT_FILE));
      return sendJson(res, 200, { ok: true, content: JSON.parse(fs.readFileSync(DEFAULT_FILE, 'utf8')) });
    }

    /* ---------- 静态页面 ---------- */
    let p = u.pathname;
    if (p === '/') p = '/index.html';
    if (p === '/admin') p = '/admin.html';
    const file = path.normalize(path.join(PUBLIC, p));
    if (!file.startsWith(PUBLIC)) return sendJson(res, 403, { error: 'forbidden' });
    if (fs.existsSync(file) && fs.statSync(file).isFile()) {
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      return fs.createReadStream(file).pipe(res);
    }
    sendJson(res, 404, { error: 'not found' });
  } catch (e) {
    sendJson(res, 500, { error: String(e.message || e) });
  }
});

server.listen(PORT, () => {
  console.log('安迅家官网 CMS 已启动');
  console.log('  前台: https://anxunjia.cc/');
  console.log('  后台: https://anxunjia.cc/admin');
  if (ADMIN_TOKEN) console.log('  已启用 ADMIN_TOKEN 口令保护');
});
