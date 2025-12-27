document.addEventListener("DOMContentLoaded", () => {
let currentNotesHTML = ""; // store HTML notes for searching
    /* ==============================
       RETRIEVE SELECTION & FORCE SELECTION FIRST
    ================================ */
    const level = localStorage.getItem("level");
    const classLevel = localStorage.getItem("classLevel");
    const subject = localStorage.getItem("subject");
    
    if (!level || !classLevel || !subject) {
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
        currentSelectionEl.textContent = `${level} | ${classLevel} | ${subject}`;
    }

    /* ===============================
       CHANGE SELECTION ICON
    ================================ */
    changeBtn.addEventListener("click", () => {
        localStorage.clear();
        window.location.href = "selection.html";
    });

    /* ===============================
       NOTES DATABASE MAPPING
    ================================ */
    let notesDatabase = {};
const notesFileMap = {
    "Primary": {
        "P1": {
            "English": "primary/p1/english.html",
            "Kinyarwanda": "primary/p1/kinyarwanda.html",
            "Mathematics": "primary/p1/mathematics.html",
            "Social and Religious Studies": "primary/p1/srs.html",
            "Science and Elementary Technology": "primary/p1/science.html"
        },
        "P2": {
            "English": "primary/p2/english.html",
            "Kinyarwanda": "primary/p2/kinyarwanda.html",
            "Mathematics": "primary/p2/mathematics.html",
            "Social and Religious Studies": "primary/p2/srs.html",
            "Science and Elementary Technology": "primary/p2/science.html"
        },
        "P3": {
            "English": "primary/p3/english.html",
            "Kinyarwanda": "primary/p3/kinyarwanda.html",
            "Mathematics": "primary/p3/mathematics.html",
            "Social and Religious Studies": "primary/p3/srs.html",
            "Science and Elementary Technology": "primary/p3/science.html"
        },
        "P4": {
            "English": "primary/p4/english.html",
            "Kinyarwanda": "primary/p4/kinyarwanda.html",
            "Mathematics": "primary/p4/mathematics.html",
            "Social and Religious Studies": "primary/p4/srs.html",
            "Science and Elementary Technology": "primary/p4/science.html"
        },
        "P5": {
            "English": "primary/p5/english.html",
            "Kinyarwanda": "primary/p5/kinyarwanda.html",
            "Mathematics": "primary/p5/mathematics.html",
            "Social and Religious Studies": "primary/p5/srs.html",
            "Science and Elementary Technology": "primary/p5/science.html"
        },
        "P6": {
            "English": "primary/p6/english.html",
            "Kinyarwanda": "primary/p6/kinyarwanda.html",
            "Mathematics": "primary/p6/mathematics.html",
            "Social and Religious Studies": "primary/p6/srs.html",
            "Science and Elementary Technology": "primary/p6/science.html"
        }
    },
    "Ordinary": {
        "S1": {
            "English": "ordinary/s1/english.html",
            "Biology": "ordinary/s1/biology.html",
            "Chemistry": "ordinary/s1/chemistry.html",
            "Physics": "ordinary/s1/physics.html",
            "Entrepreneurship": "ordinary/s1/entrepreneurship.html",
            "Kinyarwanda": "ordinary/s1/kinyarwanda.html",
            "History and Citizenship": "ordinary/s1/history.html",
            "Geography": "ordinary/s1/geography.html",
            "Mathematics": "ordinary/s1/mathematics.html"
        },
        "S2": {
            "English": "ordinary/s2/english.html",
            "Biology": "ordinary/s2/biology.html",
            "Chemistry": "ordinary/s2/chemistry.html",
            "Physics": "ordinary/s2/physics.html",
            "Entrepreneurship": "ordinary/s2/entrepreneurship.html",
            "Kinyarwanda": "ordinary/s2/kinyarwanda.html",
            "History and Citizenship": "ordinary/s2/history.html",
            "Geography": "ordinary/s2/geography.html",
            "Mathematics": "ordinary/s2/mathematics.html"
        },
        "S3": {
            "English": "ordinary/s3/english.html",
            "Biology": "ordinary/s3/biology.html",
            "Chemistry": "ordinary/s3/chemistry.html",
            "Physics": "ordinary/s3/physics.html",
            "Entrepreneurship": "ordinary/s3/entrepreneurship.html",
            "Kinyarwanda": "ordinary/s3/kinyarwanda.html",
            "History and Citizenship": "ordinary/s3/history.html",
            "Geography": "ordinary/s3/geography.html",
            "Mathematics": "ordinary/s3/mathematics.html"
        }
    }
};
    /* ===============================
       FETCH NOTES BASED ON SELECTION
    ================================ */
    const unitFilePath = notesFileMap[level]?.[classLevel]?.[subject]?.[unit];

if (unitFilePath) {
    fetch(`https://raw.githubusercontent.com/Fils25git/Notes-Generation/main/${unitFilePath}`)
        .then(res => {
            if (!res.ok) throw new Error("Not found");
            return res.text(); // fetch as HTML/text
        })
        .then(html => {
            currentNotesHTML = html; // store HTML notes
            systemBubble("Notes loaded! You can now search for a lesson.");
        })
        .catch(() => {
            currentNotesHTML = ""; // clear previous notes
            systemBubble("Notes not found for this unit.");
        });
} else {
    currentNotesHTML = "";
    systemBubble("Notes not found for this unit.");
        }


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
    if (!currentNotesHTML) return null;

    const container = document.createElement("div");
    container.innerHTML = currentNotesHTML;

    const headings = container.querySelectorAll("h1, h2, h3, h4, h5, h6");
    let results = "";

    for (let i = 0; i < headings.length; i++) {
        const heading = headings[i];

        if (heading.textContent.toLowerCase().includes(query.toLowerCase())) {
            let headingStack = [];
            let currentLevel = parseInt(heading.tagName.substring(1));

            // collect parent headings
            for (let j = i - 1; j >= 0; j--) {
                const prev = headings[j];
                const prevLevel = parseInt(prev.tagName.substring(1));
                if (prevLevel < currentLevel) {
                    headingStack.unshift(prev.outerHTML);
                    currentLevel = prevLevel;
                }
            }

            headingStack.push(heading.outerHTML);

            // collect content until next heading of same or higher level
            let contentHTML = "";
            let sibling = heading.nextElementSibling;
            const matchLevel = parseInt(heading.tagName.substring(1));

            while (sibling) {
                if (sibling.tagName && sibling.tagName.match(/^H[1-6]$/)) {
                    let siblingLevel = parseInt(sibling.tagName.substring(1));
                    if (siblingLevel <= matchLevel) break;
                }
                contentHTML += sibling.outerHTML;
                sibling = sibling.nextElementSibling;
            }

            results += headingStack.join("\n") + contentHTML;
            break; // only first match
        }
    }

    return results || null;
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

    userBubble(text);

    const response = searchNotes(text);
    if (response) {
        const div = document.createElement("div");
        div.className = "bubble system";
        div.innerHTML = response; // headings + content under matched heading
        outputArea.appendChild(div);
        scrollDown();
    } else {
        systemBubble("No notes found for this heading.");
    }

    input.value = "";
    input.focus();
        
        }
sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keydown", e => {
    if (e.key === "Enter") sendMessage();
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
