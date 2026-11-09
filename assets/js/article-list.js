(() => {
    'use strict';
    const list = document.getElementById('article-list');
    if (!list || typeof notesData === 'undefined') return;
    const normalize = (value) => String(value || '').replace(/<br\s*\/?\s*>/gi, '\n');
    const plain = (value) => normalize(value)
        .replace(/```[\s\S]*?```/g, '')
        .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        .replace(/<[^>]*>/g, '')
        .replace(/^[ \t]*[#>|-]+[ \t]*/gm, '')
        .replace(/[*_`~]/g, '')
        .replace(/\s+/g, ' ').trim();
    const notes = [...notesData].sort((a, b) =>
        String(b.date).localeCompare(String(a.date)) ||
        String(b.datetime).localeCompare(String(a.datetime)));
    const href = (note) => 'article.html?id=' + encodeURIComponent(note.idDate);
    const categories = ['Reverse', 'ACM', 'Notes', 'Pwn'];
    const categoryFor = (note) => {
        // Explicit metadata wins; infer only from title/status, never incidental body keywords.
        if (categories.includes(note.category)) return note.category;
        const subject = note.title + ' ' + note.status;
        if (/Personal Essay|随笔/i.test(subject)) return 'Notes';
        if (/\bACM\b|\bICPC\b|算法|数据结构|竞赛/i.test(subject)) return 'ACM';
        if (/\bPwn\b|漏洞利用|堆利用|栈溢出/i.test(subject)) return 'Pwn';
        return 'Reverse';
    };
    const excerptFor = (note) => {
        if (typeof note.summary === 'string' && note.summary.trim()) return note.summary.trim();
        const paragraphs = normalize(note.content).replace(/```[\s\S]*?```/g, '')
            .split(/\n\s*\n/);
        const paragraph = paragraphs.find(part => {
            const value = part.trim();
            return value && !/^(?:#|!\[|\||>|[-*+]\s|\d+[.)、]\s|https?:)/.test(value) &&
                plain(value) !== note.title && plain(value).length > 25;
        });
        return paragraph ? plain(paragraph) : '';
    };
    const tagsFor = (note) => {
        const tags = Array.isArray(note.tags) ? note.tags.filter(tag => typeof tag === 'string' && tag.trim()) : [];
        if (note.status) tags.push(note.status);
        const subject = note.title + ' ' + note.status;
        for (const [pattern, label] of [
            [/godot/i, 'Godot'], [/UE4|Unreal/i, 'UE4'], [/android|安卓/i, 'Android'],
            [/ELF/i, 'ELF'], [/ptrace/i, 'Ptrace'], [/CVE-/i, '漏洞分析'],
            [/linker/i, 'Linker'], [/Personal Essay|随笔/i, '随笔']
        ]) {
            if (pattern.test(subject)) tags.push(label);
        }
        return [...new Set(tags)];
    };
    const fragment = document.createDocumentFragment();
    for (const note of notes) {
        const row = document.createElement('article');
        row.className = 'article-row';
        row.dataset.category = categoryFor(note);
        const copy = document.createElement('div');
        copy.className = 'article-row-copy';
        const body = plain(note.content);
        const count = body.replace(/\s/g, '').length;
        const meta = document.createElement('p');
        meta.className = 'article-row-meta';
        meta.textContent = [note.date, '约 ' + (count >= 1000 ? (count / 1000).toFixed(1) + ' 千' : count) + '字'].filter(Boolean).join(' · ');
        const heading = document.createElement('h2');
        const link = document.createElement('a');
        link.href = href(note);
        link.textContent = note.title;
        heading.append(link);
        const excerpt = document.createElement('p');
        excerpt.className = 'article-row-excerpt';
        const summary = excerptFor(note);
        excerpt.textContent = summary;
        excerpt.hidden = !summary;
        const titleRow = document.createElement('div');
        titleRow.className = 'article-row-heading';
        copy.append(meta, titleRow, excerpt);
        const tags = document.createElement('ul');
        tags.className = 'article-row-tags';
        if (/^#[0-9a-f]{3,8}$/i.test(note.color || '')) tags.style.setProperty('--tag-color', note.color);
        tags.setAttribute('aria-label', '文章标签');
        for (const tag of tagsFor(note)) {
            const item = document.createElement('li');
            item.textContent = tag;
            tags.append(item);
        }
        titleRow.append(heading, tags);
        row.append(copy);
        const match = normalize(note.content).match(/!\[[^\]]*\]\(([^\s)]+)(?:\s+"[^"]*")?\)/);
        if (match) {
            const url = new URL(match[1], location.href);
            const base = new URL('assets/images/', location.href);
            if (url.origin === base.origin && url.pathname.startsWith(base.pathname)) {
                const coverLink = document.createElement('a');
                coverLink.className = 'article-row-cover';
                coverLink.href = href(note);
                coverLink.setAttribute('aria-label', '阅读：' + note.title);
                const image = document.createElement('img');
                image.src = url.href;
                image.alt = note.title + '配图';
                image.loading = 'lazy';
                image.addEventListener('error', () => coverLink.remove(), { once: true });
                coverLink.append(image);
                row.append(coverLink);
            }
        }
        fragment.append(row);
    }
    list.replaceChildren(fragment);
    const recent = document.getElementById('recent-articles');
    const empty = document.createElement('p');
    empty.className = 'article-category-empty';
    empty.setAttribute('role', 'status');
    list.append(empty);
    const buttons = [...document.querySelectorAll('[data-category]')].filter(el => el.tagName === 'BUTTON');
    const applyCategory = () => {
        const requested = decodeURIComponent(location.hash.slice(1));
        const category = requested === 'All' || categories.includes(requested) ? requested : 'All';
        const matching = category === 'All' ? notes : notes.filter(note => categoryFor(note) === category);
        list.setAttribute('aria-label', category + ' 文章列表');
        list.querySelectorAll('.article-row').forEach(row => {
            row.hidden = category !== 'All' && row.dataset.category !== category;
        });
        buttons.forEach(button => {
            button.setAttribute('aria-pressed', String(button.dataset.category === category));
            const count = button.dataset.category === 'All' ? notes.length : notes.filter(note => categoryFor(note) === button.dataset.category).length;
            button.title = button.dataset.category + ' · ' + count + ' 篇';
        });
        empty.hidden = matching.length > 0;
        empty.textContent = category + ' 分类暂时没有文章';
        if (!recent) return;
        recent.replaceChildren();
        for (const note of matching.slice(0, 5)) {
            const item = document.createElement('li');
            const link = document.createElement('a');
            link.href = href(note);
            link.textContent = note.title;
            const date = document.createElement('time');
            date.dateTime = note.date;
            date.textContent = note.date;
            item.append(link, date);
            recent.append(item);
        }
        recent.closest('section').hidden = matching.length === 0;
    };
    buttons.forEach(button => button.addEventListener('click', () => {
        location.hash = button.dataset.category;
    }));
    window.addEventListener('hashchange', applyCategory);
    applyCategory();
})();
