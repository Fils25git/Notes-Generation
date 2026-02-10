document.addEventListener("DOMContentLoaded", () => {

    const outputArea = document.getElementById("outputArea");
    const input = document.getElementById("noteInput");
    const sendBtn = document.getElementById("sendBtn");
    sendBtn.disabled = true;
    const changeBtn = document.getElementById("changeSelectionBtn");
    const currentSelectionEl = document.getElementById("currentSelection");

    function requireAuth(actionName = "this action") {
        const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
        if (!isLoggedIn) {
            systemBubble(`🔒 Sign in first to ${actionName}.`);
            return false;
        }
        return true;
    }

    function disableSend(reason = "") {
        sendBtn.disabled = true;
        sendBtn.title = reason;
    }

    function enableSend() {
        sendBtn.disabled = false;
        sendBtn.title = "";
    }

    // --- Check selection
    let numberOfQuestions;
    const isNotesPage = location.pathname.endsWith("app.html");
    if (isNotesPage) {
        const level = localStorage.getItem("level");
const classLevel = localStorage.getItem("classLevel");
const subject = localStorage.getItem("subject");
const quizType = localStorage.getItem("quizType");
const questionSequence = localStorage.getItem("questionSequence");
const marks = localStorage.getItem("marks");
        // --- Calculate number of questions from marks
let numberOfQuestions;
const safeMarks = Number(marks);

if (safeMarks <= 10) numberOfQuestions = 5;
else if (safeMarks <= 20) numberOfQuestions = 10;
else if (safeMarks <= 30) numberOfQuestions = 15;
else numberOfQuestions = 20;

        if (!level || !classLevel || !subject || !quizType || !questionSequence || !marks) {
    window.location.href = "quizSelect.html";
    return;
}
        if (currentSelectionEl) {
            currentSelectionEl.textContent = `${classLevel} | ${subject}`;
        }
    }

    let currentNotesHTML = "";

    function systemBubble(text) {
        const div = document.createElement("div");
        div.className = "bubble warning";
        div.innerHTML = text;
        outputArea.appendChild(div);
        outputArea.scrollTop = outputArea.scrollHeight;
    }

    function userBubble(text) {
        const div = document.createElement("div");
        div.className = "bubble user";
        div.textContent = text;
        outputArea.appendChild(div);
        outputArea.scrollTop = outputArea.scrollHeight;
    }

    // --- TYPEWRITER SAFE
    function typeWriterPreserveHTML(element, html, delay = 20) {
        element.innerHTML = html;
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
            acceptNode(node) {
                return node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
            }
        });
        const textNodes = [];
        while (walker.nextNode()) textNodes.push(walker.currentNode);

        const originals = textNodes.map(n => n.nodeValue);
        textNodes.forEach(n => n.nodeValue = "");

        let nodeIndex = 0, wordIndex = 0;
        function typeNext() {
            if (nodeIndex >= textNodes.length) {
                element.parentElement?.querySelector('.bubble-actions')?.classList.add('show');
                return;
            }
            const words = originals[nodeIndex].split(/(\s+)/);
            if (wordIndex < words.length) {
                textNodes[nodeIndex].nodeValue += words[wordIndex++];
                element.scrollTop = element.scrollHeight;
                setTimeout(typeNext, delay);
            } else {
                nodeIndex++;
                wordIndex = 0;
                setTimeout(typeNext, delay);
            }
        }
        typeNext();
    }

    // --- SEND MESSAGE
    async function sendMessage() {
        const text = input.value.trim();
        if (!text) return systemBubble("⚠ Type a lesson or unit title.");
        const email = localStorage.getItem("user_email");

        userBubble(text);

        systemBubble(`⏳ Generating Quiz for <b>${text}</b>...`);

        try {
            const level = localStorage.getItem("level");
const classLevel = localStorage.getItem("classLevel");
const subject = localStorage.getItem("subject");
const quizType = localStorage.getItem("quizType");
const questionSequence = localStorage.getItem("questionSequence");
const marks = localStorage.getItem("marks");
            if (!numberOfQuestions) {
    systemBubble("❌ Question count not set. Please reselect quiz settings.");
    return;
}

            // Call your Netlify AI function
            const res = await fetch("/.netlify/functions/quiz-generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
    title: text, 
    level, 
    classLevel, 
    subject,
    quizType,
    questionSequence,
    marks,
    numberOfQuestions, // ✅ ADD THIS LINE
    email
})
            });

            const data = await res.json();

if (!res.ok) {
    systemBubble(`❌ ${data.error || "Server error"}`);
    return;
}
            const notes = data.notes || "AI returned empty response";

            createNoteBubble(notes);

        } catch (err) {
            systemBubble(`❌ Error: ${err.message}`);
        }

        input.value = "";
    }

    function createNoteBubble(html) {
        const bubble = document.createElement("div");
        bubble.className = "bubble system";

        const content = document.createElement("div");
        content.className = "bubble-content";

        const actions = document.createElement("div");
        actions.className = "bubble-actions";

        bubble.appendChild(content);
        bubble.appendChild(actions);
        outputArea.appendChild(bubble);
        outputArea.scrollTop = outputArea.scrollHeight;

        typeWriterPreserveHTML(content, html);

        actions.innerHTML = `
            <button class="copy-btn" style="background:green; margin-top:8px;" onclick="copyBubble(this.closest('.bubble'))">📋 Copy</button>
            <button class="edit-btn" style="background:green; margin-top:8px;" onclick="toggleEdit(this.closest('.bubble'))">✏ Edit</button>
        `;
    }

    window.copyBubble = bubble => {
        const text = bubble.querySelector('.bubble-content').innerText;
        navigator.clipboard.writeText(text);
    };

    window.toggleEdit = bubble => {
        const content = bubble.querySelector('.bubble-content');
        const actions = bubble.querySelector('.bubble-actions');
        if (content.isContentEditable) {
            content.contentEditable = false;
            actions.innerHTML = `
                <button onclick="copyBubble(this.closest('.bubble'))">📋 Copy</button>
                <button onclick="toggleEdit(this.closest('.bubble'))">✏ Edit</button>
            `;
        } else {
            content.contentEditable = true;
            content.focus();
            actions.innerHTML = `<button onclick="toggleEdit(this.closest('.bubble'))">💾 Save</button>`;
        }
    };

    sendBtn.onclick = () => sendMessageWithAuth();

input.addEventListener("keydown", e => {
    if (e.key === "Enter") {
        e.preventDefault();
        sendMessageWithAuth();
    }
});

async function sendMessageWithAuth() {

    if (!requireAuth("send a note")) return;

    const userEmail = localStorage.getItem("user_email");
    if (!userEmail) {
        systemBubble("❌ Please login again.");
        return;
    }

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 7000);

        const res = await fetch(`/.netlify/functions/get-balance?email=${userEmail}`, {
            signal: controller.signal,
            cache: "no-store"
        });

        clearTimeout(timeout);

        if (res.ok) {
            const data = await res.json();

            // ONLY block if server CONFIRMS low balance
            if (data.balance <= 4) {
                showFloatingMessage("❌ You must have at least 5 lesson plans remaining on your balance.");
                return;
            }
        }

    } catch (err) {
        // Important: DO NOT block user
        console.warn("Balance check skipped:", err);
    }

    // Always continue — backend enforces real limits
    sendMessage();
}
    input.addEventListener("input", () => {});

    changeBtn.onclick = () => {
        localStorage.removeItem("level");
        localStorage.removeItem("classLevel");
        localStorage.removeItem("subject");
        localStorage.removeItem("quizType");
localStorage.removeItem("questionSequence");
localStorage.removeItem("marks");
        location.href = "quizSelect.html";
    };

    enableSend(); // ready to send immediately, AI will generate on demand
});
