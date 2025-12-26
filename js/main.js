const requiredKeys = ["level", "class", "subject", "unit"];

for (let key of requiredKeys) {
    if (!localStorage.getItem(key)) {
        window.location.href = "html/selection.html";
        break;
    }
}

let notesDatabase = {};
const outputArea = document.getElementById("outputArea");
const input = document.getElementById("noteInput");
const sendBtn = document.getElementById("sendBtn");
const copyBtn = document.getElementById("copyBtn");
const saveBtn = document.getElementById("saveBtn");
const editBtn = document.getElementById("editBtn");

// Load JSON notes
const level = localStorage.getItem("level") || "Primary";
const className = localStorage.getItem("class") || "P1";
const subject = localStorage.getItem("subject") || "English";
const unit = localStorage.getItem("unit") || "Unit 1 - Greetings";

// Example JSON path pattern
const jsonPath = `notes/${subject.replace(" ","")}${className}.json`;

fetch(`https://raw.githubusercontent.com/Fils25git/Notes-Generation/main/${unit}.json`)
    .then(res => res.json())
    .then(data => notesDatabase = data)
    .catch(err => console.log("Error loading notes:", err));

// Fuse.js setup
function searchNotes(topic) {
    let searchList = [];
    Object.keys(notesDatabase).forEach(key => {
        notesDatabase[key].keywords.forEach(word => {
            searchList.push({topic: key, keyword: word});
        });
    });
    const fuse = new Fuse(searchList, { keys: ["keyword"], threshold: 0.4 });
    return fuse.search(topic);
}

// Word-by-word effect
async function generateWordByWord(text) {
    const div = document.createElement("div");
    div.classList.add("note");
    outputArea.appendChild(div);
    outputArea.scrollTop = outputArea.scrollHeight;

    const words = text.split(" ");
    for (let i = 0; i < words.length; i++) {
        div.textContent += words[i] + " ";
        await new Promise(r => setTimeout(r, 80));
        outputArea.scrollTop = outputArea.scrollHeight;
    }
}

sendBtn.addEventListener("click", () => {
    const topic = input.value.trim().toLowerCase();
    if (!topic) return;

    const results = searchNotes(topic);
    if (results.length > 0) {
        const matched = results[0].item.topic;
        const notesArray = notesDatabase[matched].content;
        const randomIndex = Math.floor(Math.random() * notesArray.length);
        generateWordByWord(notesArray[randomIndex]);
    } else {
        generateWordByWord("No notes found for this topic yet. AI can generate a draft later.");
    }

    input.value = "";
});

// Copy Notes
copyBtn.addEventListener("click", () => {
    const allText = Array.from(document.querySelectorAll(".note"))
        .map(div => div.textContent).join("\n\n");
    navigator.clipboard.writeText(allText).then(() => alert("Copied to clipboard!"));
});

// Save as Word
saveBtn.addEventListener("click", () => {
    const { Document, Packer, Paragraph } = window.docx;
    const allText = Array.from(document.querySelectorAll(".note"))
        .map(div => div.textContent);
    if (!allText.length) return alert("No notes to save!");

    const doc = new Document({
        sections: [{ children: allText.map(line => new Paragraph({ text: line })) }]
    });
    Packer.toBlob(doc).then(blob => saveAs(blob, "Notes.docx"));
});

// Edit toggle
editBtn.addEventListener("click", () => {
    const notes = document.querySelectorAll(".note");
    notes.forEach(n => {
        n.contentEditable = n.contentEditable !== "true";
        n.style.border = n.contentEditable === "true" ? "1px solid #00AF00" : "none";
    });
});
