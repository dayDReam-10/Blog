(() => {
    'use strict';
    // 项目页日历
    function renderCalendar() {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        const currentDate = today.getDate();

        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        document.getElementById('calendar-month-year').innerText = `${monthNames[currentMonth]} ${currentYear}`;

        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        const grid = document.getElementById('calendar-grid');
        grid.innerHTML = '';

        // 填充前面的空白
        for (let i = 0; i < firstDay; i++) {
            const emptyCell = document.createElement('div');
            grid.appendChild(emptyCell);
        }

        // 填充日期
        for (let i = 1; i <= daysInMonth; i++) {
            const cell = document.createElement('div');
            cell.innerText = i;
            cell.style.fontSize = '0.8rem';
            cell.style.padding = '5px 0';
            cell.style.borderRadius = '5px';
            cell.style.cursor = 'default';
            cell.style.transition = '0.3s';

            if (i === currentDate) {
                cell.style.backgroundColor = 'var(--accent-color)';
                cell.style.color = 'white';
                cell.style.fontWeight = 'bold';
            } else {
                cell.style.color = 'var(--main-text)';
                cell.onmouseover = () => cell.style.backgroundColor = 'var(--toggle-bg)';
                cell.onmouseout = () => cell.style.backgroundColor = 'transparent';
            }

            grid.appendChild(cell);
        }
    }
    renderCalendar();

    function handleCardClick(el, url) {
        el.classList.add('pulled-out');
        setTimeout(() => { window.open(url, '_blank'); el.classList.remove('pulled-out'); }, 300);
    }

    window.handleCardClick = handleCardClick;
})();
