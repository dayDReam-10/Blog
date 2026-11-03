'use strict';

const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const root = path.resolve(__dirname, '..');
const stateDir = path.join(root, '.local');
const authFile = path.join(stateDir, 'kugou-auth.json');
const host = '127.0.0.1';
const port = Number(process.env.BLOG_PORT) || 4173;
const kugouPort = Number(process.env.KUGOU_PORT) || 4180;
process.env.HOST = host;
process.env.PORT = String(kugouPort);
const kugouApi = require(path.join(stateDir, 'KuGouMusicApi', 'main.js'));
let loginKey = '';
let cookieJar = {};
let cache = { expires: 0, songs: [] };

const sendJson = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
};

const getAuth = () => {
  try {
    const auth = JSON.parse(fs.readFileSync(authFile, 'utf8'));
    return auth.token && auth.userid ? auth : null;
  } catch {
    return null;
  }
};

const saveAuth = (auth) => {
  if (!auth?.token || !auth?.userid) throw new Error('KuGou did not return a complete login session.');
  fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(authFile, JSON.stringify(auth), { mode: 0o600 });
  cache = { expires: 0, songs: [] };
};

const mergeCookies = (entries) => {
  for (const entry of entries || []) {
    const pair = String(entry).split(';', 1)[0];
    const split = pair.indexOf('=');
    if (split > 0) cookieJar[pair.slice(0, split)] = pair.slice(split + 1);
  }
};

const callKugou = async (pathname) => {
  const response = await fetch(`http://${host}:${kugouPort}${pathname}`, {
    headers: Object.keys(cookieJar).length ? { Cookie: Object.entries(cookieJar).map(([key, value]) => `${key}=${value}`).join('; ') } : {}
  });
  mergeCookies(response.headers.getSetCookie?.() || []);
  const body = await response.json();
  if (!response.ok) throw new Error('KuGou API request failed.');
  return body;
};

const text = (value) => typeof value === 'string' ? value.trim() : '';

const findSongs = (body) => {
  const candidates = [body?.data?.list, body?.data?.songs, body?.data?.info, body?.list, body?.songs];
  return candidates.find(Array.isArray) || [];
};

const normalizeSong = (song) => {
  const info = song?.info || song;
  const title = text(info?.songname) || text(info?.audio_name) || text(info?.name);
  if (!title) return null;
  const artist = text(info?.author_name) || text(info?.singername) || text(info?.artist);
  const cover = (text(info?.img) || text(info?.album_img) || text(info?.cover))
    .replace('{size}', '400')
    .replace(/^http:\/\//i, 'https://');
  const hash = text(info?.hash) || text(info?.audio_id);
  return { title, artist, cover, url: hash ? `https://www.kugou.com/song/#hash=${encodeURIComponent(hash)}` : '' };
};

const handleApi = async (req, res, url) => {
  if (req.method !== 'GET') return sendJson(res, 405, { error: 'Method not allowed' });
  if (url.pathname === '/api/music/status') return sendJson(res, 200, { loggedIn: Boolean(getAuth()) });

  if (url.pathname === '/api/music/login/start') {
    cookieJar = getAuth() || {};
    const result = await callKugou(`/login/qr/key?timestamp=${Date.now()}`);
    loginKey = result?.data?.qrcode || result?.data?.key || '';
    if (!loginKey) return sendJson(res, 502, { error: 'Could not create a KuGou login code.' });
    const qr = await callKugou(`/login/qr/create?key=${encodeURIComponent(loginKey)}&qrimg=1&timestamp=${Date.now()}`);
    return sendJson(res, 200, { image: qr?.data?.base64 || '', url: qr?.data?.url || '' });
  }

  if (url.pathname === '/api/music/login/check') {
    if (!loginKey) return sendJson(res, 409, { error: 'Start a new login first.' });
    const result = await callKugou(`/login/qr/check?key=${encodeURIComponent(loginKey)}&timestamp=${Date.now()}`);
    const status = Number(result?.data?.status || 0);
    if (status === 4) {
      saveAuth(cookieJar);
      loginKey = '';
      return sendJson(res, 200, { status: 'authorized' });
    }
    if (status === 0) return sendJson(res, 200, { status: 'expired' });
    return sendJson(res, 200, { status: status === 2 ? 'confirm' : 'waiting' });
  }

  if (url.pathname === '/api/music/recent') {
    const auth = getAuth();
    if (!auth) return sendJson(res, 401, { error: 'KuGou login is not configured.' });
    if (cache.expires > Date.now()) return sendJson(res, 200, { songs: cache.songs });
    try {
      cookieJar = auth;
      const result = await callKugou(`/user/history?timestamp=${Date.now()}`);
      const songs = findSongs(result).map(normalizeSong).filter(Boolean).slice(0, 10);
      cache = { songs, expires: Date.now() + 60_000 };
      return sendJson(res, 200, { songs });
    } catch {
      return sendJson(res, 502, { error: 'KuGou history could not be loaded. Reauthorize if the session expired.' });
    }
  }

  if (url.pathname === '/api/music/logout') {
    try { fs.unlinkSync(authFile); } catch {}
    cache = { expires: 0, songs: [] };
    return sendJson(res, 200, { loggedOut: true });
  }
  return sendJson(res, 404, { error: 'Not found' });
};

const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.pdf': 'application/pdf' };

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${host}:${port}`);
  if (url.pathname.startsWith('/api/')) {
    const allowedHosts = new Set([`${host}:${port}`, `localhost:${port}`]);
    const origin = req.headers.origin;
    if (!allowedHosts.has(req.headers.host) || (origin && !new Set([`http://${host}:${port}`, `http://localhost:${port}`]).has(origin))) {
      sendJson(res, 403, { error: 'Local requests only.' });
      return;
    }
    try { await handleApi(req, res, url); } catch { sendJson(res, 502, { error: 'Local KuGou API request failed.' }); }
    return;
  }
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); } catch { res.writeHead(400).end(); return; }
  const requested = path.resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
  if (!requested.startsWith(root + path.sep) || requested.startsWith(stateDir + path.sep) || requested.includes(`${path.sep}node_modules${path.sep}`)) {
    res.writeHead(404).end();
    return;
  }
  fs.readFile(requested, (error, content) => {
    if (error) { res.writeHead(404).end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': mime[path.extname(requested)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' });
    res.end(content);
  });
});

const start = async () => {
  await kugouApi.startService();
  server.listen(port, host, () => console.log(`Local blog: http://${host}:${port}/`));
};

start().catch((error) => {
  console.error('Could not start the local KuGou service:', error?.message || error);
  process.exitCode = 1;
});
