const state = {
    category: "morning",
    progress: {}
};

const tabs = document.querySelectorAll(".tab");
const list = document.getElementById("dhikrList");
const title = document.getElementById("categoryTitle");
const percent = document.getElementById("progressPercent");
const resetButton = document.getElementById("resetProgress");

function getCategory() {
    return azkarCategories[state.category];
}

function loadProgress(categoryKey) {
    const category = azkarCategories[categoryKey];

    try {
        return JSON.parse(localStorage.getItem(category.storageKey)) || {};
    } catch (error) {
        return {};
    }
}

function saveProgress() {
    const category = getCategory();
    localStorage.setItem(category.storageKey, JSON.stringify(state.progress));
}

function getCompletedCount() {
    const category = getCategory();

    return category.items.reduce(function(total, item) {
        return total + Math.min(state.progress[item.id] || 0, item.count);
    }, 0);
}

function getTotalCount() {
    return getCategory().items.reduce(function(total, item) {
        return total + item.count;
    }, 0);
}

function updateSummary() {
    const total = getTotalCount();
    const completed = getCompletedCount();
    const value = total === 0 ? 0 : Math.round((completed / total) * 100);

    title.textContent = getCategory().title;
    percent.textContent = value + "%";
    document.documentElement.style.setProperty("--progress", value + "%");
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function renderList() {
    const category = getCategory();
    list.innerHTML = "";

    category.items.forEach(function(item) {
        const done = Math.min(state.progress[item.id] || 0, item.count);
        const remaining = Math.max(item.count - done, 0);
        const complete = remaining === 0;
        const card = document.createElement("article");

        card.className = "dhikr-card" + (complete ? " complete" : "");
        card.innerHTML = [
            '<div class="card-top">',
            '<span class="counter">' + done + " / " + item.count + "</span>",
            item.note ? '<span class="note">' + escapeHtml(item.note) + "</span>" : "",
            "</div>",
            '<p class="dhikr-text">' + escapeHtml(item.text) + "</p>",
            item.fadl ? '<p class="dhikr-fadl">' + escapeHtml(item.fadl) + "</p>" : "",
            '<button class="count-button" type="button" data-id="' + item.id + '"' + (complete ? " disabled" : "") + ">",
            complete ? "تم الذكر" : "تكرار متبقّي: " + remaining,
            "</button>"
        ].join("");

        list.appendChild(card);
    });

    updateSummary();
}

function setCategory(categoryKey) {
    state.category = categoryKey;
    state.progress = loadProgress(categoryKey);

    tabs.forEach(function(tab) {
        tab.classList.toggle("active", tab.dataset.category === categoryKey);
    });

    renderList();
}

list.addEventListener("click", function(event) {
    const button = event.target.closest(".count-button");
    if (!button) return;

    const item = getCategory().items.find(function(entry) {
        return entry.id === button.dataset.id;
    });

    if (!item) return;

    state.progress[item.id] = Math.min((state.progress[item.id] || 0) + 1, item.count);
    saveProgress();
    renderList();
});

tabs.forEach(function(tab) {
    tab.addEventListener("click", function() {
        setCategory(tab.dataset.category);
    });
});

resetButton.addEventListener("click", function() {
    state.progress = {};
    saveProgress();
    renderList();
});

setCategory(state.category);
