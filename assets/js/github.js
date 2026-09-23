// Shared GitHub API client with a short session cache and bounded requests.
(() => {
    'use strict';

    const USERNAME = 'dayDReam-10';
    const CACHE_PREFIX = 'github-api:';
    const CACHE_TTL = 10 * 60 * 1000;
    const REQUEST_TIMEOUT = 8000;
    const headers = { Accept: 'application/vnd.github+json' };

    function readCache(key) {
        try {
            const cached = JSON.parse(sessionStorage.getItem(CACHE_PREFIX + key) || 'null');
            return cached && cached.data && Date.now() - cached.time < CACHE_TTL ? cached.data : null;
        } catch {
            return null;
        }
    }

    function writeCache(key, data) {
        try {
            sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ time: Date.now(), data }));
        } catch {
            // Private browsing can disable sessionStorage; live data still works.
        }
    }

    async function requestJson(url) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
        try {
            const response = await fetch(url, {
                headers,
                credentials: 'omit',
                cache: 'default',
                signal: controller.signal
            });
            if (!response.ok) throw new Error('GitHub HTTP ' + response.status);
            return await response.json();
        } finally {
            clearTimeout(timer);
        }
    }

    async function requestCached(path) {
        const cached = readCache(path);
        if (cached) return { data: cached, cached: true };
        const data = await requestJson('https://api.github.com' + path);
        writeCache(path, data);
        return { data, cached: false };
    }

    function setText(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    }

    function formatDate(value) {
        return value ? 'LAST_PUSH: ' + new Date(value).toLocaleDateString().replace(/\//g, '.') : 'LAST_PUSH: UNKNOWN';
    }

    async function syncProfile() {
        try {
            const result = await requestCached('/users/' + USERNAME);
            const profile = result.data;
            setText('github-repos', profile.public_repos ?? '0');
            setText('github-followers', profile.followers ?? '0');
            setText('github-following', profile.following ?? '0');
            setText('sync-status', result.cached ? 'GITHUB_SYNC: CACHE' : 'GITHUB_SYNC: SUCCESS');
            return profile;
        } catch (error) {
            console.warn('GitHub profile sync failed:', error);
            setText('sync-status', 'GITHUB_SYNC: UNAVAILABLE');
            ['github-repos', 'github-followers', 'github-following'].forEach(id => setText(id, '—'));
            return null;
        }
    }

    async function syncRepositories() {
        const repositories = [
            { name: 'RE-PWN-Writeups', element: 're-pwn-update' },
            { name: 'McPlugins', element: 'works-update' },
            { name: 'StudioWork', element: 'studiowork-update' }
        ];
        await Promise.allSettled(repositories.map(async ({ name, element }) => {
            const target = document.getElementById(element);
            try {
                const repository = (await requestCached('/repos/' + USERNAME + '/' + name)).data;
                if (target) target.textContent = formatDate(repository.pushed_at);
                const dot = target?.parentElement?.querySelector('.sync-dot');
                if (dot) {
                    dot.style.animation = 'none';
                    dot.style.backgroundColor = '#4ade80';
                }
            } catch (error) {
                console.warn('GitHub repository sync failed for ' + name + ':', error);
                if (target) target.textContent = 'REMOTE_SYNC_UNAVAILABLE';
            }
        }));
    }

    syncProfile();
    if (document.getElementById('re-pwn-update') || document.getElementById('works-update')) syncRepositories();
})();
