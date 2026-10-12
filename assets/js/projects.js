(() => {
    'use strict';

    const list = document.getElementById('reading-list');
    const empty = document.getElementById('reading-empty');
    const books = Array.isArray(window.booksData) ? window.booksData : [];
    if (list && empty) {
        books.forEach(book => {
            if (!book || typeof book.title !== 'string' || !book.title.trim() || typeof book.file !== 'string') return;
            let url;
            try { url = new URL(book.file, location.href); } catch { return; }
            const base = new URL('assets/books/', location.href);
            if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname) || !url.pathname.toLowerCase().endsWith('.pdf') || url.search || url.hash) return;
            const item = document.createElement('li');
            const title = document.createElement('span');
            title.className = 'reading-book-title';
            title.textContent = book.title;
            item.appendChild(title);
            if (book.author) {
                const author = document.createElement('span');
                author.className = 'reading-book-author';
                author.textContent = book.author;
                item.appendChild(author);
            }
            const download = document.createElement('a');
            download.className = 'reading-download';
            download.href = url.href;
            download.download = decodeURIComponent(url.pathname.split('/').pop());
            download.textContent = '下载 PDF';
            download.setAttribute('aria-label', '下载 ' + book.title + ' PDF');
            item.appendChild(download);
            list.appendChild(item);
        });
        empty.hidden = list.children.length > 0;
    }

    function handleCardClick(el, url) {
        el.classList.add('pulled-out');
        setTimeout(() => { window.open(url, '_blank', 'noopener,noreferrer'); el.classList.remove('pulled-out'); }, 300);
    }
    window.handleCardClick = handleCardClick;
})();
