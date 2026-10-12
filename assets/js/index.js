(() => {
    'use strict';

    const blogOverlay = document.getElementById('blog-modal-overlay');
    const blogClose = document.getElementById('blog-modal-close');
    const closeModal = () => {
        blogOverlay?.classList.remove('active');
        document.body.style.overflow = '';
    };
    blogClose?.addEventListener('click', closeModal);
    blogOverlay?.addEventListener('click', (event) => {
        if (event.target === blogOverlay) closeModal();
    });

    const timelineContainer = document.getElementById('journal-timeline');
    if (!timelineContainer || typeof notesData === 'undefined') return;

    const isReverseNote = (note) => /reverse|security|environment detection|elf|ptrace|pwn/i.test(note.status) || /RE笔记|逆向/.test(note.title);
    const timestamp = (note) => {
        const time = (String(note.datetime || '').split('/')[1] || '00:00').trim();
        return Date.parse(`${note.date}T${time}:00`) || 0;
    };
    const latestFirst = (notes) => [...notes].sort((a, b) => timestamp(b) - timestamp(a));

    const articleLink = (note) => {
        const link = document.createElement('a');
        link.className = 'archive-link';
        link.id = 'note-' + note.idDate;
        link.dataset.date = note.date;
        link.href = `article.html?id=${encodeURIComponent(note.idDate)}`;
        const title = document.createElement('span');
        title.className = 'archive-title';
        title.textContent = note.title;
        const status = document.createElement('span');
        status.className = 'archive-status';
        status.textContent = note.status;
        status.style.color = note.color;
        link.append(status, title);
        return link;
    };

    const createArchive = (notes, { id, label, accessibleLabel }) => {
        if (!notes.length) return null;
        const sorted = latestFirst(notes);
        const group = document.createElement('section');
        group.className = 'timeline-item article-group';
        group.setAttribute('aria-label', accessibleLabel);
        group.innerHTML = `<div class="timeline-dot"></div>
            <div class="timeline-card archive-card">
                <div class="archive-heading"><span>${label}</span><span class="archive-count">${sorted.length} RECORDS</span></div>
                <div class="archive-latest"><span class="archive-latest-label">LATEST ENTRY</span></div>
                <div class="archive-panel" id="${id}" inert><div class="archive-panel-inner"><div class="archive-list"></div></div></div>
                <button type="button" class="archive-toggle" aria-expanded="false" aria-controls="${id}">展开其余 ${sorted.length - 1} 篇</button>
            </div>`;
        group.querySelector('.archive-latest').appendChild(articleLink(sorted[0]));
        const list = group.querySelector('.archive-list');
        sorted.slice(1).forEach(note => list.appendChild(articleLink(note)));
        const button = group.querySelector('.archive-toggle');
        const panel = group.querySelector('.archive-panel');
        if (sorted.length === 1) button.hidden = true;
        button.addEventListener('click', () => {
            const open = group.classList.toggle('is-open');
            button.setAttribute('aria-expanded', String(open));
            button.textContent = open ? '收起文章' : `展开其余 ${sorted.length - 1} 篇`;
            panel.inert = !open;
            // Keep the group in view after collapsing a long archive from its bottom.
            if (!open && group.getBoundingClientRect().top < 0) {
                const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                group.scrollIntoView({ behavior: reduceMotion ? 'instant' : 'smooth', block: 'start' });
            }
        });
        return group;
    };

    const fragment = document.createDocumentFragment();
    const sections = [
        createArchive(notesData.filter(isReverseNote), {
            id: 'reverse-archive', label: 'REVERSE ENGINEERING', accessibleLabel: '逆向与二进制安全文章'
        }),
        createArchive(notesData.filter(note => !isReverseNote(note)), {
            id: 'journal-archive', label: 'PERSONAL JOURNAL', accessibleLabel: '随笔与近况'
        })
    ];
    sections.filter(Boolean).forEach(section => fragment.appendChild(section));
    timelineContainer.replaceChildren(fragment);
})();
