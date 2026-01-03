let currentUser = null;

const menuToggle = document.getElementById("menuToggle");
const appMenu = document.getElementById("appMenu");
const authBtn = document.getElementById("authBtn");
const accountBtn = document.getElementById("accountBtn");
const historySection = document.getElementById("historySection");
const historyList = document.getElementById("historyList");
const historySearch = document.getElementById("historySearch");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");
const outputArea = document.getElementById("outputArea");

let historyData = [];
let fuse;
let pendingUserText = null;

// -------------------------
// Overlay for mobile menu
// -------------------------
const overlay = document.createElement("div");
overlay.className = "menu-overlay";
document.body.appendChild(overlay);

// -------------------------
// Auth guard
// -------------------------
function requireAuth(actionName = "this action") {
    if (!currentUser) {
        showSystemMessage(`Please sign in first to ${actionName}.`);
        return false;
    }
    return true;
}

// -------------------------
// History key per user
// -------------------------
function getHistoryKey() {
    if (!currentUser?.email) return null;
    return `history_${currentUser.email}`;
}

// -------------------------
// System bubble
// -------------------------
function showSystemMessage(text) {
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = text;
    outputArea.appendChild(bubble);
    outputArea.scrollTop = outputArea.scrollHeight;

    saveConversation(pendingUserText, text);
    pendingUserText = null;
}

// -------------------------
// Save conversation (user + system)
// -------------------------
function saveConversation(userText, systemText) {
    const key = getHistoryKey();
    if (!key || !userText || !systemText) return;

    let history = JSON.parse(localStorage.getItem(key)) || [];

    history.unshift({
        user: userText,
        system: systemText
    });

    history = history.slice(0, 7);
    localStorage.setItem(key, JSON.stringify(history));

    loadHistory();
}

// -------------------------
// Load history
// -------------------------
function loadHistory() {
    const key = getHistoryKey();
    if (!key) return;

    historyData = JSON.parse(localStorage.getItem(key)) || [];
    renderHistory(historyData);
    initFuse();
}

// -------------------------
// Render history list
// -------------------------
function renderHistory(data) {
    historyList.innerHTML = "";
    data.forEach(item => {
        const li = document.createElement("li");
        li.innerHTML = `<i class="fas fa-clock"></i> ${item.user}`;
        historyList.appendChild(li);
    });
}

// -------------------------
// Fuse.js
// -------------------------
function initFuse() {
    fuse = new Fuse(historyData, {
        keys: ["user"],
        threshold: 0.4
    });
}

// -------------------------
// Observe bubbles
// -------------------------
const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
            if (node.classList?.contains("bubble") && node.classList.contains("user")) {
                pendingUserText = node.innerText.trim();
            }
        });
    });
});
observer.observe(outputArea, { childList: true });

// -------------------------
// History search
// -------------------------
historySearch.addEventListener("input", () => {
    const q = historySearch.value.trim();
    if (!q) return renderHistory(historyData);
    renderHistory(fuse.search(q).map(r => r.item));
});

// -------------------------
// Clear history
// -------------------------
clearHistoryBtn.onclick = () => {
    if (!currentUser) return;
    if (!confirm("Clear your history?")) return;

    localStorage.removeItem(getHistoryKey());
    historyData = [];
    renderHistory(historyData);
};

// -------------------------
// Click history → restore full conversation
// -------------------------
historyList.addEventListener("click", e => {
    if (!requireAuth("re-run history")) return;

    const li = e.target.closest("li");
    if (!li) return;

    const index = [...historyList.children].indexOf(li);
    const item = historyData[index];
    if (!item) return;

    const userBubble = document.createElement("div");
    userBubble.className = "bubble user";
    userBubble.textContent = item.user;

    const systemBubble = document.createElement("div");
    systemBubble.className = "bubble";
    systemBubble.textContent = item.system;

    outputArea.append(userBubble, systemBubble);
    outputArea.scrollTop = outputArea.scrollHeight;
});

// -------------------------
// Menu toggle
// -------------------------
function openMenu() {
    if (window.innerWidth <= 768) {
        appMenu.classList.add("active");
        overlay.classList.add("active");
    } else appMenu.classList.toggle("hidden");
}

function closeMenu() {
    appMenu.classList.remove("active", "hidden");
    overlay.classList.remove("active");
}

menuToggle.onclick = openMenu;
overlay.onclick = closeMenu;

// -------------------------
// Menu buttons → REDIRECT
// -------------------------
document.getElementById("lessonPlanBtn").onclick = () => {
    if (!requireAuth("generate a lesson plan")) return;
    window.location.href = "lesson_plan/index.html";
};

document.getElementById("termsBtn").onclick = () => {
    window.location.href = "terms.html";
};

document.getElementById("privacyBtn").onclick = () => {
    window.location.href = "privacy.html";
};

// -------------------------
// Auth UI
// -------------------------
function updateAuthUI(user) {
    const authIcon = authBtn.querySelector("i");
    const authText = authBtn.querySelector("span");
    const accountIcon = accountBtn.querySelector("i");
    const accountText = accountBtn.querySelector("span");

    if (user) {
        historySection.classList.remove("hidden");
        authIcon.className = "fas fa-sign-out-alt";
        authText.textContent = "Sign Out";
        accountIcon.className = "fas fa-wallet";
        accountText.textContent = "My Balance / Billing";
        authBtn.onclick = () => netlifyIdentity.logout();
        loadHistory();
    } else {
        historySection.classList.add("hidden");
        authIcon.className = "fas fa-sign-in-alt";
        authText.textContent = "Sign In";
        accountIcon.className = "fas fa-user-plus";
        accountText.textContent = "Create Account";
        authBtn.onclick = () => netlifyIdentity.open("login");
        accountBtn.onclick = () => netlifyIdentity.open("signup");
    }
}

// -------------------------
// Netlify Identity
// -------------------------
netlifyIdentity.on("init", user => {
    currentUser = user;
    updateAuthUI(user);
});

netlifyIdentity.on("login", user => {
    currentUser = user;
    updateAuthUI(user);
    showSystemMessage("You are now signed in. You can continue.");
});

netlifyIdentity.on("logout", () => {
    currentUser = null;
    updateAuthUI(null);
    showSystemMessage("You signed out. Please sign in to continue.");
});
