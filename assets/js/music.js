(() => {
    'use strict';

    const widget = document.querySelector('.music-widget');
    const list = document.getElementById('music-list');
    const message = document.getElementById('music-message');
    if (!widget || !list || !message) return;
    const config = window.musicConfig || {};
    const endpoint = String(config.recentEndpoint || '').trim();
    if (!endpoint) return;
    const limit = Math.max(1, Math.min(10, Number(config.limit) || 5));

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
            message.textContent = '最近播放暂时无法加载';
            return;
        }
        widget.setAttribute('aria-busy', 'true');
        message.textContent = '正在读取最近播放…';
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);
        try {
            const response = await fetch(url, {
                credentials: 'omit',
                headers: { Accept: 'application/json' },
                signal: controller.signal
            });
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
            message.textContent = '最近播放暂时无法加载';
            list.hidden = true;
        } finally {
            clearTimeout(timer);
            widget.setAttribute('aria-busy', 'false');
        }
    };

    loadRecent();
})();
