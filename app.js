// ============ STATE ============
let currentTab = 'morning';
let currentPage = 1;
let editMode = false;

// Custom order stored per tab — deep copy from defaults, then override from localStorage
let customMorningPages = JSON.parse(JSON.stringify(morningPages));
let customEveningPages = JSON.parse(JSON.stringify(eveningPages));

// Load saved order from localStorage (v2 key to avoid stale data from old layout)
(function loadSavedOrder() {
    try {
        var savedMorning = localStorage.getItem('azkar_morning_order_v2');
        var savedEvening = localStorage.getItem('azkar_evening_order_v2');
        if (savedMorning) customMorningPages = JSON.parse(savedMorning);
        if (savedEvening) customEveningPages = JSON.parse(savedEvening);
    } catch (e) {}
})();

function getAzkar() {
    return currentTab === 'morning' ? morningAzkar : eveningAzkar;
}

function getPages() {
    return currentTab === 'morning' ? customMorningPages : customEveningPages;
}

function saveOrder() {
    try {
        localStorage.setItem('azkar_morning_order_v2', JSON.stringify(customMorningPages));
        localStorage.setItem('azkar_evening_order_v2', JSON.stringify(customEveningPages));
    } catch (e) {}
}

// ============ BUILD DHIKR CARD HTML ============
function buildDhikrCard(dhikr, pageIdx, posInPage, totalInPage) {
    var html = '<div class="dhikr-card' + (editMode ? ' edit-mode' : '') + '">';

    if (editMode) {
        var isFirst = posInPage === 0;
        var isLast = posInPage === totalInPage - 1;
        html += '<div class="reorder-controls">';
        html += '<button class="reorder-btn" onclick="moveDhikr(' + pageIdx + ',' + posInPage + ',-1)" ' + (isFirst ? 'disabled' : '') + '>▲</button>';
        html += '<button class="reorder-btn" onclick="moveDhikr(' + pageIdx + ',' + posInPage + ',1)" ' + (isLast ? 'disabled' : '') + '>▼</button>';
        html += '</div>';
    }

    html += '<div class="dhikr-text">' + dhikr.text.replace(/\n/g, '<br>') + '</div>';

    html += '</div>';
    return html;
}

// ============ RENDER ============
function renderPages() {
    var book = document.getElementById('book');
    var azkar = getAzkar();
    var pages = getPages();
    var totalPages = pages.length;
    book.innerHTML = '';

    // Dhikr pages (no title page — jump straight to azkar)
    pages.forEach(function(dhikrIds, pageIdx) {
        var pageNum = pageIdx + 1;
        var pageDiv = document.createElement('div');
        pageDiv.className = 'page' + (currentPage === pageNum ? ' active' : '');

        var cardsHtml = '';
        if (editMode) {
            cardsHtml += '<div class="edit-hint">استخدم الأسهم لتغيير ترتيب الأذكار <button class="reorder-btn" style="display:inline-flex;width:auto;padding:2px 10px;font-size:0.75rem;border-radius:10px;" onclick="resetOrder()">إعادة الترتيب الأصلي</button></div>';
        }
        dhikrIds.forEach(function(id, posInPage) {
            var dhikr = azkar.find(function(d) { return d.id === id; });
            if (dhikr) {
                cardsHtml += buildDhikrCard(dhikr, pageIdx, posInPage, dhikrIds.length);
            }
        });

        pageDiv.innerHTML =
            '<div class="page-content">' + cardsHtml + '</div>' +
            '<div class="page-footer">' + pageNum + ' / ' + totalPages + '</div>';

        book.appendChild(pageDiv);
    });

    updateNav(totalPages);
}

// ============ NAVIGATION ============
function goToPage(index) {
    var pages = getPages();
    if (index < 1 || index > pages.length) return;
    currentPage = index;
    renderPages();
}

function updateNav(totalPages) {
    var btnPrev = document.getElementById('btnPrev');
    var btnNext = document.getElementById('btnNext');
    var indicator = document.getElementById('pageIndicator');

    btnPrev.disabled = currentPage <= 1;
    btnNext.disabled = currentPage >= totalPages;
    indicator.textContent = currentPage + ' / ' + totalPages;
}

// ============ EDIT MODE ============
function toggleEditMode() {
    editMode = !editMode;
    var btn = document.getElementById('editToggle');
    btn.classList.toggle('active', editMode);
    btn.textContent = editMode ? '✓ حفظ الترتيب' : '✏️ تعديل الترتيب';
    if (!editMode) {
        saveOrder();
    }
    renderPages();
}

function moveDhikr(pageIdx, posInPage, direction) {
    var pages = getPages();
    var page = pages[pageIdx];
    var newPos = posInPage + direction;
    if (newPos < 0 || newPos >= page.length) return;

    // Swap
    var temp = page[posInPage];
    page[posInPage] = page[newPos];
    page[newPos] = temp;

    saveOrder();
    renderPages();
}

function resetOrder() {
    if (currentTab === 'morning') {
        customMorningPages = JSON.parse(JSON.stringify(morningPages));
    } else {
        customEveningPages = JSON.parse(JSON.stringify(eveningPages));
    }
    saveOrder();
    renderPages();
}

// ============ TABS ============
function switchTab(tab) {
    currentTab = tab;
    currentPage = 1;
    document.getElementById('tab-morning').classList.toggle('active', tab === 'morning');
    document.getElementById('tab-evening').classList.toggle('active', tab === 'evening');
    renderPages();
}

// ============ SWIPE SUPPORT ============
var touchStartX = 0;

document.addEventListener('touchstart', function(e) {
    touchStartX = e.changedTouches[0].screenX;
}, false);

document.addEventListener('touchend', function(e) {
    var touchEndX = e.changedTouches[0].screenX;
    var diff = touchStartX - touchEndX;
    var pages = getPages();
    if (Math.abs(diff) < 50) return;

    if (diff > 0) {
        if (currentPage > 0) goToPage(currentPage - 1);
    } else {
        if (currentPage < pages.length) goToPage(currentPage + 1);
    }
}, false);

// ============ KEYBOARD ============
document.addEventListener('keydown', function(e) {
    var pages = getPages();
    if (e.key === 'ArrowRight' && currentPage < pages.length) {
        goToPage(currentPage + 1);
    } else if (e.key === 'ArrowLeft' && currentPage > 0) {
        goToPage(currentPage - 1);
    }
});

// ============ INIT ============
renderPages();
