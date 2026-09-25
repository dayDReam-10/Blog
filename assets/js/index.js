(() => {
    'use strict';
    // 日历逻辑
    let currentYear = 2024, currentMonth = 2;
    const noteDates = ["2024-03-31", "2024-03-29"];

    function generateCalendar(year, month) {
        const body = document.getElementById('calendar-body');
        const label = document.getElementById('current-month-year');
        const date = new Date(year, month, 1);
        const months = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
        label.innerText = `${months[month]} ${year}`;
        body.innerHTML = '';
        ["S", "M", "T", "W", "T", "F", "S"].forEach(d => {
            const el = document.createElement('div'); el.className = 'calendar-day-label'; el.innerText = d; body.appendChild(el);
        });
        for (let i = 0; i < date.getDay(); i++) {
            const empty = document.createElement('div'); empty.className = 'calendar-cell empty'; body.appendChild(empty);
        }
        const totalDays = new Date(year, month + 1, 0).getDate();
        for (let d = 1; d <= totalDays; d++) {
            const cell = document.createElement('div');
            cell.className = 'calendar-cell';
            const fDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            cell.innerText = d;
            if (noteDates.includes(fDate)) cell.classList.add('has-note');
            cell.onclick = () => {
                document.querySelectorAll('.calendar-cell').forEach(c => c.classList.remove('selected'));
                cell.classList.add('selected');
                const target = document.querySelector(`.timeline-item[data-date="${fDate}"]`);
                if (target) {
                    document.querySelectorAll('.timeline-item').forEach(i => i.classList.remove('highlight'));
                    target.classList.add('highlight');
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            };
            body.appendChild(cell);
        }
    }

    function prevMonth() { currentMonth--; if (currentMonth < 0) { currentMonth = 11; currentYear--; } generateCalendar(currentYear, currentMonth); }
    function nextMonth() { currentMonth++; if (currentMonth > 11) { currentMonth = 0; currentYear++; } generateCalendar(currentYear, currentMonth); }

    generateCalendar(currentYear, currentMonth);

    // 浮窗交互逻辑
    const blogOverlay = document.getElementById('blog-modal-overlay');
    const blogClose = document.getElementById('blog-modal-close');

    if (blogClose && blogOverlay) blogClose.addEventListener('click', () => {
        blogOverlay.classList.remove('active');
        document.body.style.overflow = '';
    });

    if (blogOverlay) blogOverlay.addEventListener('click', (e) => {
        if (e.target === blogOverlay) {
            blogOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    const timelineContainer = document.getElementById('journal-timeline');
    if (timelineContainer && typeof notesData !== 'undefined') {
        const fragment = document.createDocumentFragment();
        notesData.forEach(note => {
            const item = document.createElement('div');
            item.className = 'timeline-item';
            item.setAttribute('data-date', note.date);
            item.id = 'note-' + note.idDate;
            item.style.cursor = 'pointer';

            item.innerHTML = `
                <div class="timeline-dot"></div>
                <div class="timeline-date">
                    <span class="status-badge" style="color: ${note.color};">${note.status}</span>
                </div>
                <div class="timeline-card">
                    <h3>${note.title}</h3>
                </div>
            `;

            // 打开文章详情页
            item.addEventListener('click', () => {
                window.location.href = `article.html?id=${encodeURIComponent(note.idDate)}`;
            });

            fragment.appendChild(item);
        });
        timelineContainer.replaceChildren(fragment);
    }

    // Keep the existing calendar button handlers available to the markup.
    window.prevMonth = prevMonth;
    window.nextMonth = nextMonth;
})();
