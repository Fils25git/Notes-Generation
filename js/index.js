/* =========================
   AUTH STATE (OWN SYSTEM)
========================= */
function getCurrentUser() {
    const token = localStorage.getItem("auth_token");
    const email = localStorage.getItem("user_email");
    if (!token || !email) return null;
    return { email, token };
}

let currentUser = getCurrentUser();

/* =========================
   ELEMENTS
========================= */
const menuToggle = document.getElementById("menuToggle");
const appMenu = document.getElementById("appMenu");
const authBtn = document.getElementById("authBtn");
const accountBtn = document.getElementById("accountBtn");
const outputArea = document.getElementById("outputArea");

/* =========================
   OVERLAY (MOBILE)
========================= */
const overlay = document.createElement("div");
overlay.className = "menu-overlay";
document.body.appendChild(overlay);

/* =========================
   AUTH GUARD
========================= */
function requireAuth(action = "continue") {
    if (!currentUser) {
        showSystemMessage(`Please sign in to ${action}.`);
        return false;
    }
    return true;
}

/* =========================
   SYSTEM MESSAGE
========================= */
function showSystemMessage(text) {
    const bubble = document.createElement("div");
    bubble.className = "bubble system";
    bubble.textContent = text;
    outputArea.appendChild(bubble);
    outputArea.scrollTop = outputArea.scrollHeight;
}

/* =========================
   MENU CONTROL
========================= */
function openMenu() {
    if (window.innerWidth <= 768) {
        appMenu.classList.add("active");
        overlay.classList.add("active");
    } else {
        appMenu.classList.toggle("hidden");
    }
}

function closeMenu() {
    appMenu.classList.remove("active", "hidden");
    overlay.classList.remove("active");
}

menuToggle.onclick = openMenu;
overlay.onclick = closeMenu;

/* =========================
   SAFE REDIRECT (CLOSE MENU FIRST)
========================= */
function closeMenuAndRedirect(url) {
    closeMenu();
    setTimeout(() => {
        window.location.href = url;
    }, 150);
}

/* =========================
   MENU BUTTONS
========================= */
document.getElementById("lessonPlanBtn").onclick = () => {
    if (!requireAuth("generate a lesson plan")) return;
    closeMenuAndRedirect("lesson_plan/index.html");
};

document.getElementById("termsBtn").onclick = () => {
    closeMenuAndRedirect("terms.html");
};

document.getElementById("privacyBtn").onclick = () => {
    closeMenuAndRedirect("privacy.html");
};

/* =========================
   AUTH UI
========================= */
function updateAuthUI() {
    const authIcon = authBtn.querySelector("i");
    const authText = authBtn.querySelector("span");
    const accountIcon = accountBtn.querySelector("i");
    const accountText = accountBtn.querySelector("span");

    if (currentUser) {
        authIcon.className = "fas fa-sign-out-alt";
        authText.textContent = "Sign Out";

        accountIcon.className = "fas fa-wallet";
        accountText.textContent = "My Balance / Billing";

        authBtn.onclick = () => {
            localStorage.clear();
            currentUser = null;
            updateAuthUI();
            showSystemMessage("You signed out.");
            closeMenu();
        };

        accountBtn.onclick = () => {
            closeMenuAndRedirect("balance.html");
        };

    } else {
        authIcon.className = "fas fa-sign-in-alt";
        authText.textContent = "Sign In";

        accountIcon.className = "fas fa-user-plus";
        accountText.textContent = "Create Account";

        authBtn.onclick = () => {
            closeMenuAndRedirect("login.html");
        };

        accountBtn.onclick = () => {
            closeMenuAndRedirect("create.html");
        };
    }
}

updateAuthUI();
