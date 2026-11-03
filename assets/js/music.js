(() => {
    'use strict';

    const widget = document.querySelector('.music-widget');
    const list = document.getElementById('music-list');
    const message = document.getElementById('music-message');
    const login = document.getElementById('music-login');
    const loginStart = document.getElementById('music-login-start');
    const loginReset = document.getElementById('music-login-reset');
    const qr = document.getElementById('music-qr');
    if (!widget || !list || !message) return;
    const config = window.musicConfig || {};
    const localMode = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';
    const endpoint = localMode ? '/api/music/recent' : String(config.recentEndpoint || 'assets/data/recent-songs.json').trim();
    if (!endpoint) return;
    const limit = Math.max(1, Math.min(10, Number(config.limit) || 5));
    if (localMode && login) login.hidden = false;

    const safeUrl = (value) => {
        if (typeof value !== 'string' || !value.trim()) return '';
        try {
            const url = new URL(value, window.location.href);
            if (url.username || url.password) return '';
            return url.protocol === 'https:' || (url.protocol === 'http:' && url.origin === window.location.origin) ? url.href : '';
        } catch {
            return '';
        }
    };

    const createTrack = (song) => {
        const item = document.createElement('li');
        item.className = 'music-track';
        const cover = document.createElement('span');
        cover.className = 'music-cover';
        cover.setAttribute('aria-hidden', 'true');
        cover.textContent = '♫';
        const coverUrl = safeUrl(song.cover);
        if (coverUrl) {
            const image = document.createElement('img');
            image.alt = '';
            image.loading = 'lazy';
            image.decoding = 'async';
            image.referrerPolicy = 'no-referrer';
            image.addEventListener('error', () => cover.replaceChildren(document.createTextNode('♫')), { once: true });
            image.src = coverUrl;
            cover.replaceChildren(image);
        }
        const info = document.createElement('div');
        info.className = 'music-info';
        const songUrl = safeUrl(song.url);
        const title = document.createElement(songUrl ? 'a' : 'span');
        title.className = 'music-song';
        title.textContent = song.title;
        if (songUrl) {
            title.href = songUrl;
            title.target = '_blank';
            title.rel = 'noopener noreferrer';
        }
        const artist = document.createElement('span');
        artist.className = 'music-artist';
        artist.textContent = typeof song.artist === 'string' && song.artist.trim() ? song.artist : '未知歌手';
        info.append(title, artist);
        item.append(cover, info);
        return item;
    };

    const loadRecent = async () => {
        const url = safeUrl(endpoint);
        if (!url) {
            message.textContent = localMode ? '请先连接酷狗账号' : '最近播放暂时无法加载';
            return;
        }
        widget.setAttribute('aria-busy', 'true');
        message.textContent = '正在读取最近播放…';
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);
        let unauthorized = false;
        try {
            const response = await fetch(url, {
                credentials: 'omit',
                headers: { Accept: 'application/json' },
                signal: controller.signal
            });
            unauthorized = response.status === 401;
            if (localMode && loginStart) loginStart.hidden = !unauthorized;
            if (!response.ok) throw new Error('Music request failed');
            const data = await response.json();
            if (!Array.isArray(data.songs)) throw new Error('Invalid music response');
            const songs = data.songs.filter(song => song && typeof song.title === 'string' && song.title.trim()).slice(0, limit);
            list.replaceChildren(...songs.map(createTrack));
            list.hidden = songs.length === 0;
            message.hidden = songs.length > 0;
            message.textContent = '还没有最近播放记录';
        } catch {
            message.hidden = false;
            message.textContent = localMode && unauthorized ? '请先连接酷狗账号' : '最近播放暂时无法加载';
            list.hidden = true;
            if (localMode && loginStart) loginStart.hidden = !unauthorized;
        } finally {
            clearTimeout(timer);
            widget.setAttribute('aria-busy', 'false');
        }
    };

    const pollLogin = async () => {
        if (!qr || qr.hidden) return;
        try {
            const response = await fetch('/api/music/login/check', { cache: 'no-store' });
            const data = await response.json();
            if (data.status === 'authorized') {
                qr.hidden = true;
                loginReset.hidden = true;
                message.hidden = false;
                message.textContent = '已连接酷狗，正在读取最近播放…';
                loginStart.disabled = false;
                loginStart.hidden = true;
                loadRecent();
                return;
            }
            if (data.status === 'expired') {
                message.textContent = '二维码已过期，请重新生成';
                loginStart.disabled = false;
                return;
            }
            message.textContent = data.status === 'confirm' ? '请在酷狗 App 中确认登录' : '等待酷狗 App 扫码…';
            setTimeout(pollLogin, 1800);
        } catch {
            message.textContent = '登录状态检查失败，请重试';
            loginStart.disabled = false;
        }
    };

    const startLogin = async () => {
        if (!localMode || !loginStart || !qr) return;
        loginStart.disabled = true;
        message.hidden = false;
        message.textContent = '正在生成酷狗登录二维码…';
        try {
            const response = await fetch('/api/music/login/start', { cache: 'no-store' });
            if (!response.ok) throw new Error();
            const data = await response.json();
            qr.src = data.image;
            qr.hidden = false;
            loginReset.hidden = false;
            message.textContent = '使用酷狗 App 扫码并确认登录';
            pollLogin();
        } catch {
            message.textContent = '二维码生成失败，请确认本地服务可以访问酷狗';
            loginStart.disabled = false;
        }
    };

    if (loginStart) loginStart.addEventListener('click', startLogin);
    if (loginReset) loginReset.addEventListener('click', () => {
        qr.hidden = true;
        loginReset.hidden = true;
        loginStart.disabled = false;
        startLogin();
    });

    loadRecent();
})();
