'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const apiRoot = process.env.KUGOU_API_DIR || path.join(root, '.local', 'KuGouMusicApi');
const output = path.join(root, 'assets', 'data', 'recent-songs.json');

const text = (value) => typeof value === 'string' ? value.trim() : '';

const normalizeSong = (song) => {
  const info = song?.info || song;
  const title = text(info?.songname) || text(info?.audio_name) || text(info?.name);
  if (!title) return null;
  const artist = text(info?.author_name) || text(info?.singername) || text(info?.artist);
  const cover = (text(info?.img) || text(info?.album_img) || text(info?.cover))
    .replace('{size}', '400')
    .replace(/^http:\/\//i, 'https://');
  const hash = text(info?.hash) || text(info?.audio_id);
  return {
    title,
    artist,
    cover,
    url: hash ? `https://www.kugou.com/song/#hash=${encodeURIComponent(hash)}` : ''
  };
};

const readAuth = () => {
  if (process.env.KUGOU_AUTH_JSON) return JSON.parse(process.env.KUGOU_AUTH_JSON);
  return JSON.parse(fs.readFileSync(path.join(root, '.local', 'kugou-auth.json'), 'utf8'));
};

const main = async () => {
  const auth = readAuth();
  if (!auth?.token || !auth?.userid) throw new Error('KuGou authorization is missing or expired.');
  const api = require(path.join(apiRoot, 'main.js'));
  const result = await api.user_history({ cookie: auth, timestamp: Date.now() });
  const records = result?.body?.data?.songs;
  if (!Array.isArray(records)) throw new Error('KuGou returned an unexpected history response.');
  const songs = records.map(normalizeSong).filter(Boolean).slice(0, 10);
  if (!songs.length) throw new Error('KuGou returned no displayable songs.');
  fs.writeFileSync(output, `${JSON.stringify({ songs }, null, 2)}\n`, 'utf8');
  console.log(`Updated ${songs.length} recent songs.`);
};

main().catch((error) => {
  console.error(error?.message || error);
  process.exitCode = 1;
});
