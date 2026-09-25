(() => {
'use strict';
marked.setOptions({ gfm:true, breaks:true });
const params = new URLSearchParams(window.location.search);
const id = params.get('id');
const records = typeof notesData !== 'undefined' ? notesData : [];
const note = Array.isArray(records) ? records.find((item) => item.idDate === id) : null;
const normalize = (content = '') => String(content).replace(/\r\n/g,'\n').replace(/<br\s*\/?>(\s*)/gi,'\n').replace(/^\s*---\s*\n?/,'').trim();
if (!note) {
    document.getElementById('article-title').textContent = 'RECORD_NOT_FOUND';
    document.getElementById('article-content').innerHTML = '<p class="error">The requested article does not exist in notes_data.js.</p>';
} else {
    document.title = `${note.title} | DayDReam`;
    document.getElementById('article-date').textContent = '';
    document.getElementById('article-status').textContent = note.status;
    document.getElementById('article-title').textContent = note.title;
    document.getElementById('article-content').innerHTML = marked.parse(normalize(note.content));
    document.querySelectorAll('#article-content img').forEach((image) => {
        image.loading = 'lazy';
        image.decoding = 'async';
        image.referrerPolicy = 'no-referrer';
        image.addEventListener('error', () => image.dataset.imageError = 'true', { once: true });
    });
    const firstHeading = document.querySelector('#article-content h1, #article-content h2');
    if (firstHeading && firstHeading.textContent.trim() === note.title.trim()) firstHeading.remove();
}
})();
