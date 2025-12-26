document.addEventListener("DOMContentLoaded", () => {

    /* ===============================
       FORCE SELECTION FIRST
    ================================ */
    const requiredKeys = ["level", "classLevel", "subject", "unit"];
    for (let key of requiredKeys) {
        if (!localStorage.getItem(key)) {
            window.location.replace("selection.html");
            return;
        }
    }

    /* ===============================
       GET SELECTION
    ================================ */
    const level = localStorage.getItem("level");
    const classLevel = localStorage.getItem("classLevel");
    const subject = localStorage.getItem("subject");
    const unit = localStorage.getItem("unit");

    document.getElementById("currentSelection").textContent =
        `${level} | ${classLevel} | ${subject} | ${unit}`;

    /* ===============================
       ELEMENTS
    ================================ */
    const outputArea = document.getElementById("outputArea");
    const input = document.getElementById("noteInput");
    const sendBtn = document.getElementById("sendBtn");
    const copyBtn = document.getElementById("copyBtn");
    const saveBtn = document.getElementById("saveBtn");
    const editBtn = document.getElementById("editBtn");
    const changeBtn = document.getElementById("changeSelectionBtn");

    /* ===============================
       CHANGE SELECTION ICON
    ================================ */
    changeBtn.addEventListener("click", () => {
        localStorage.clear();
        window.location.href = "selection.html";
    });

    /* ===============================
       NOTES DATABASE
    ================================ */
    let notesDatabase = {};

    fetch(`https://raw.githubusercontent.com/Fils25git/Notes-Generation/main/${unit}.json`)
        .then(res => res.json())
        .then(data => notesDatabase = data)
        .catch(() => {
            systemBubble("Notes not found for this unit.");
        });

    /* ===============================
       CHAT BUBBLES
    ================================ */
    function userBubble(text) {
        const div = document.createElement("div");
        div.className = "bubble user";
        div.textContent = text;
        outputArea.appendChild(div);
        scrollDown();
    }

    function systemBubble(text) {
        const div = document.createElement("div");
        div.className = "bubble system";
        outputArea.appendChild(div);
        wordByWord(div, text);
    }

    function scrollDown() {
        outputArea.scrollTop = outputArea.scrollHeight;
    }

    /* ===============================
       WORD BY WORD EFFECT
    ================================ */
    async function wordByWord(element, text) {
        const words = text.split(" ");
        for (let word of words) {
            element.textContent += word + " ";
            scrollDown();
            await new Promise(r => setTimeout(r, 60));
        }
    }

    /* ===============================
       SEARCH NOTES
    ================================ */
    function searchNotes(query) {
        query = query.toLowerCase();
        for (let topic in notesDatabase) {
            if (topic.toLowerCase().includes(query)) {
                return notesDatabase[topic].content.join("\n\n");
            }
        }
        return null;
    }

    /* ===============================
       SEND MESSAGE
    ================================ */
    sendBtn.addEventListener("click", sendMessage);
    input.addEventListener("keydown", e => {
        if (e.key === "Enter") sendMessage();
    });

    function sendMessage() {
        const text = input.value.trim();
        if (!text) return;

        userBubble(text); // 👈 user message recorded

        const response = searchNotes(text);
        if (response) {
            systemBubble(response);
        } else {
            systemBubble("No notes found yet. AI-generated notes will be added soon.");
        }

        input.value = "";
    }

    /* ===============================
       COPY
    ================================ */
    copyBtn.addEventListener("click", () => {
        const text = [...document.querySelectorAll(".system")]
            .map(d => d.textContent).join("\n\n");
        navigator.clipboard.writeText(text);
        alert("Copied!");
    });

    /* ===============================
       EDIT MODE
    ================================ */
    editBtn.addEventListener("click", () => {
        document.querySelectorAll(".system").forEach(n => {
            n.contentEditable = n.contentEditable !== "true";
            n.style.border = n.contentEditable === "true"
                ? "1px dashed #00AF00"
                : "none";
        });
    });

});
