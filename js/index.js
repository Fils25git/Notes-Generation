const menuToggle = document.getElementById("menuToggle");
const appMenu = document.getElementById("appMenu");
const authBtn = document.getElementById("authBtn");
const accountBtn = document.getElementById("accountBtn");
const historySection = document.getElementById("historySection");
const historyList = document.getElementById("historyList");
const historySearch = document.getElementById("historySearch");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");

let historyData = [];
let fuse;

// Create overlay dynamically
let overlay = document.createElement("div");
overlay.className = "menu-overlay";
document.body.appendChild(overlay);

// Menu toggle
function openMenu() {
    if (window.innerWidth <= 768) {
        appMenu.classList.add("active");
        overlay.classList.add("active");
    } else {
        appMenu.classList.toggle("hidden");
    }
}

function closeMenu() {
    if (window.innerWidth <= 768) {
        appMenu.classList.remove("active");
        overlay.classList.remove("active");
    } else {
        appMenu.classList.add("hidden");
    }
}

menuToggle.addEventListener("click", openMenu);
overlay.addEventListener("click", closeMenu);

window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
        appMenu.classList.remove("active");
        overlay.classList.remove("active");
    }
});

// Fuse.js for history search
function initFuse() {
    fuse = new Fuse(historyData, { keys: ['text'], threshold: 0.4 });
}

function renderHistory(data) {
    historyList.innerHTML = "";
    data.forEach(item => {
        const li = document.createElement("li");
        li.innerHTML = `<i class="fas fa-clock"></i> ${item.text}`;
        historyList.appendChild(li);
    });
}

function addHistory(text) {
    const item = { text };
    historyData.unshift(item);
    renderHistory(historyData);
    initFuse();
    saveHistory(text);
}

function saveHistory(text) {
    let history = JSON.parse(localStorage.getItem("history")) || [];
    history.unshift(text);
    localStorage.setItem("history", JSON.stringify(history));
}

function loadHistory() {
    const stored = JSON.parse(localStorage.getItem("history")) || [];
    historyData = stored.map(text => ({ text }));
    renderHistory(historyData);
    initFuse();
}

// Observe user questions
const outputArea = document.getElementById("outputArea");
const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
            if (node.classList && node.classList.contains("bubble") && node.classList.contains("user")) {
                saveHistory(node.innerText.trim());
            }
        });
    });
});
observer.observe(outputArea, { childList: true });

// History search
historySearch.addEventListener("input", () => {
    const query = historySearch.value.trim();
    if (!query) {
        renderHistory(historyData);
        return;
    }
    const results = fuse.search(query).map(r => r.item);
    renderHistory(results);
});

// Clear history
clearHistoryBtn.onclick = () => {
    if (confirm("Are you sure you want to clear all history?")) {
        localStorage.removeItem("history");
        historyData = [];
        renderHistory(historyData);
        initFuse();
    }
};

// Tap history to re-run
historyList.addEventListener("click", (e) => {
    const li = e.target.closest("li");
    if (li) {
        const text = li.textContent.trim();
        const bubble = document.createElement("div");
        bubble.className = "bubble user";
        bubble.textContent = text;
        outputArea.appendChild(bubble);
        // Optional: trigger main processing function
        // processUserInput(text);
    }
});

// Menu buttons
document.getElementById("lessonPlanBtn").onclick = () => alert("Generate Lesson Plan clicked");
document.getElementById("termsBtn").onclick = () => alert("Terms & Privacy");
document.getElementById("privacyBtn").onclick = () => alert("Privacy Policy");

// Auth UI
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

// Netlify Identity hooks
netlifyIdentity.on("init", user => updateAuthUI(user));
netlifyIdentity.on("login", user => updateAuthUI(user));
netlifyIdentity.on("logout", () => updateAuthUI(null));
