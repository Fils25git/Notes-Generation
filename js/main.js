document.addEventListener("DOMContentLoaded", () => {

    /* ===============================
       RETRIEVE SELECTION & FORCE SELECTION FIRST
    ================================ */
    const level = localStorage.getItem("level");
    const classLevel = localStorage.getItem("classLevel");
    const subject = localStorage.getItem("subject");
    const unit = localStorage.getItem("unit");

    if (!level || !classLevel || !subject || !unit) {
        window.location.replace("selection.html");
        return; // stop further execution
    }

    /* ===============================
       DOM ELEMENTS
    ================================ */
    const outputArea = document.getElementById("outputArea");
    const input = document.getElementById("noteInput");
    const sendBtn = document.getElementById("sendBtn");
    const copyBtn = document.getElementById("copyBtn");
    const saveBtn = document.getElementById("saveBtn");
    const editBtn = document.getElementById("editBtn");
    const changeBtn = document.getElementById("changeSelectionBtn");

    const currentSelectionEl = document.getElementById("currentSelection");
if (currentSelectionEl) {
    currentSelectionEl.textContent = `${level} | ${classLevel} | ${subject} | ${unit}`;
}

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
        .catch(() => systemBubble("Notes not found for this unit."));

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
   WARNING BUBBLE
=============================== */
function warningBubble(text) {
    const div = document.createElement("div");
    div.className = "bubble warning";  // New CSS class for warning
    div.textContent = text;
    outputArea.appendChild(div);
    scrollDown();
}

    /* ===============================
       WORD-BY-WORD EFFECT
    ================================ */
    async function wordByWord(element, text) {
        const words = text.split(" ");
        for (let word of words) {
            element.textContent += word + " ";
            scrollDown();
            await new Promise(r => setTimeout(r, 50));
        }
    }

    /* ===============================
       SEARCH NOTES WITH FUSE.JS
    ================================ */
    function searchNotes(query) {
        if (!notesDatabase || Object.keys(notesDatabase).length === 0) return null;

        const searchList = [];
        Object.keys(notesDatabase).forEach(topic => {
            notesDatabase[topic].keywords.forEach(word => {
                searchList.push({ topic, keyword: word });
            });
        });

        const fuse = new Fuse(searchList, { keys: ["keyword"], threshold: 0.4 });
        const result = fuse.search(query);

        if (result.length > 0) {
            const matchedTopic = result[0].item.topic;
            return notesDatabase[matchedTopic].content.join("\n\n");
        }

        return null;
    }

    /* ===============================
       SEND MESSAGE
    ================================ */
    function sendMessage() {
        const text = input.value.trim();
        if (!text) {
    warningBubble("⚠ Please type in a Lesson title first!");
    return;
        }
        // Show user message
        userBubble(text);

        // Search notes
        const response = searchNotes(text);
        if (response) {
            systemBubble(response);
        } else {
            systemBubble("No notes found yet. AI-generated notes will be added soon.");
        }

        input.value = "";
        input.focus();
    }

    sendBtn.addEventListener("click", sendMessage);
    input.addEventListener("keydown", e => {
        if (e.key === "Enter") sendMessage();
    });

    /* ===============================
       COPY NOTES
    ================================ */
    copyBtn.addEventListener("click", () => {
        const text = [...document.querySelectorAll(".bubble")]
            .map(d => d.textContent)
            .join("\n\n");
        navigator.clipboard.writeText(text).then(() => alert("Copied to clipboard!"));
    });

    /* ===============================
       SAVE AS WORD
    ================================ */
    saveBtn.addEventListener("click", () => {
        const { Document, Packer, Paragraph } = window.docx;

        const allText = [...document.querySelectorAll(".bubble")]
            .map(d => d.textContent);

        if (!allText.length) return alert("No notes to save!");

        const doc = new Document({
            sections: [{
                children: allText.map(line => new Paragraph({ text: line }))
            }]
        });

        Packer.toBlob(doc).then(blob => saveAs(blob, "Notes.docx"));
    });

    /* ===============================
       EDIT MODE
    ================================ */
    editBtn.addEventListener("click", () => {
        document.querySelectorAll(".system").forEach(n => {
            n.contentEditable = n.contentEditable !== "true";
            n.style.border = n.contentEditable === "true" ? "1px dashed #00AF00" : "none";
        });
    });

});
