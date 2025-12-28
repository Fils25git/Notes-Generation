/* ===============================
   DOM CONTENT LOADED
=============================== */
document.addEventListener("DOMContentLoaded", () => {

    /* ===============================
       SYSTEM BUBBLE (SAFETY VERSION)
    ================================ */
    function systemBubble(text, delay = 150) {
        const outputArea = document.getElementById("outputArea");
        if (!outputArea) return;
        const div = document.createElement("div");
        div.className = "bubble system";
        outputArea.appendChild(div);
        wordByWord(div, text, delay);
    }

    async function wordByWord(element, text, delay = 150) {
        const words = text.split(" ");
        for (let w of words) {
            element.innerHTML += w + " ";
            element.scrollTop = element.scrollHeight;
            await new Promise(res => setTimeout(res, delay));
        }
    }

    /* ===============================
       LOCAL STORAGE CHECK
    ================================ */
    const level = localStorage.getItem("level");
    const classLevel = localStorage.getItem("classLevel");
    const subject = localStorage.getItem("subject");

    if (!level || !classLevel || !subject) {
        window.location.replace("selection.html");
        return;
    }

    /* ===============================
       DISPLAY CURRENT SELECTION
    ================================ */
    const currentSelectionEl = document.getElementById("currentSelection");
    if (currentSelectionEl) {
        currentSelectionEl.textContent = `${level} | ${classLevel} | ${subject}`;
    }

    /* ===============================
       DOM ELEMENTS (SAFE VERSION)
    ================================ */
    const outputArea = document.getElementById("outputArea");
    const input = document.getElementById("noteInput");
    const sendBtn = document.getElementById("sendBtn");
    const copyBtn = document.getElementById("copyBtn");
    const saveBtn = document.getElementById("saveBtn");
    const editBtn = document.getElementById("editBtn");
    const changeBtn = document.getElementById("changeSelectionBtn");

    /* ===============================
       CHANGE SELECTION SAFELY
    ================================ */
    if (changeBtn) {
        changeBtn.onclick = () => {
            localStorage.clear();
            window.location.href = "selection.html";
        };
    }

    /* ===============================
       NOTES FILE MAP (KEPT SAME)
=============================== */
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
       LOAD NOTES WITH LOADING MESSAGE
=============================== */
    let currentNotesHTML = "";

    function fetchNotes(level, classLevel, subject) {
        const unitFilePath = notesFileMap[level]?.[classLevel]?.[subject];
        if (!unitFilePath) return systemBubble("⚠ Error fetching notes!");

        systemBubble(`⏳I am  loading your notes of ${subject} ${classLevel}, please wait...`);

        fetch(`https://raw.githubusercontent.com/Fils25git/Notes-Generation/main/${unitFilePath}`)
            .then(r => r.ok ? r.text() : Promise.reject())
            .then(html => {
                currentNotesHTML = html;
                systemBubble(`Hello and Welcome 👋 <br>I have these Notes of <b>${subject} in ${classLevel}</b> for sure😛 and i am ready to pour them🥰 <br>Just give me a <b>lesson or unit title</b>, <br><b>N.B:</b>remember i don't intend to discuss i only need lesson title. to change selections tap 🔁`);
            })
            .catch(() => systemBubble(`Sorry‼️, I don't have notes of ${subject} for ${classLevel} Yet,<br> you can explore other notes by tapping 🔁 above to change selection.`));
    }

    /* ===============================
       UTILITIES
=============================== */
    function userBubble(text) {
        const div = document.createElement("div");
        div.className = "bubble user";
        div.textContent = text;
        outputArea.appendChild(div);
        outputArea.scrollTop = outputArea.scrollHeight;
    }

     function searchNotes(query) {
    if (!currentNotesHTML) return null;

    const container = document.createElement("div");
    container.innerHTML = currentNotesHTML;
    const headings = [...container.querySelectorAll("h1,h2,h3,h4,h5,h6")];

    // Find the heading the user is searching for
    let startIndex = headings.findIndex(h =>
        h.textContent.trim().toLowerCase().includes(query.toLowerCase())
    );
    if (startIndex === -1) return null; // Not found

    const startHeading = headings[startIndex];
    const startLevel = parseInt(startHeading.tagName.replace("H", ""));

    let content = "";

    // 🔼 Collect parent headings above it
    for (let i = startIndex - 1; i >= 0; i--) {
        const h = headings[i];
        const level = parseInt(h.tagName.replace("H", ""));
        if (level < startLevel) {
            content = h.outerHTML + content; 
            // keep adding until we hit top-level or no more parents
        }
        if (level === 1) break; // Stop at Unit or H1 top root
    }

    // Add the searched heading itself
    content += startHeading.outerHTML;

    // 🔽 Collect content below it until same or higher heading appears
    let node = startHeading.nextElementSibling;
    while (node) {
        // If next heading is same or higher level → stop
        if (node.tagName && /^H[1-6]$/i.test(node.tagName)) {
            const level = parseInt(node.tagName.replace("H",""));
            if (level <= startLevel) break;
        }
        content += node.outerHTML;
        node = node.nextElementSibling;
    }

    return content;
                                            }

    /* ===============================
       SEND MESSAGE (SAFE)
=============================== */
    function sendMessage() {
    const text = input.value.trim();
    if (!text) {
        systemBubble("⚠ Type a lesson title first!");
        return;
    }

    userBubble(text);
    const result = searchNotes(text);

    if (result) {
        const div = document.createElement("div");
        div.className = "bubble system";
        div.innerHTML = result;
        outputArea.appendChild(div);
        outputArea.scrollTop = outputArea.scrollHeight;
    } else {
        systemBubble("❌ No matching section found.");
    }

    input.value = "";
}

/* SEND BUTTON */
if (sendBtn) {
    sendBtn.addEventListener("click", sendMessage);
}

/* ENTER KEY — MOBILE SAFE */
if (input) {
    input.addEventListener("keydown", e => {
        if (e.key === "Enter") {
            e.preventDefault();   // block Enter only
            sendMessage();
        }
    });
    }
                        
    /* ===============================
       SAVE AS WORD (PROTECTED)
=============================== */
    if (saveBtn) {
        saveBtn.onclick = () => {
            if (!window.docx) return alert("❌ docx library missing!");
            const { Document, Packer, Paragraph } = window.docx;
            const bubbles = [...document.querySelectorAll(".bubble")].map(x => x.textContent);

            if (!bubbles.length) return alert("⚠ Nothing to save!");

            const doc = new Document({
                sections: [{ children: bubbles.map(t => new Paragraph({ text: t })) }]
            });

            Packer.toBlob(doc).then(blob => saveAs(blob, "Notes.docx"));
        };
    }

    /* ===============================
       EDIT MODE (SAFE)
=============================== */
    if (editBtn) {
        editBtn.onclick = () => {
            document.querySelectorAll(".system").forEach(n => {
                const editing = n.isContentEditable ? false : true;
                n.contentEditable = editing;
                n.style.border = editing ? "1px dashed #00AF00" : "none";
            });
        };
    }

    /* ===============================
       START
=============================== */
    fetchNotes(level, classLevel, subject);

});
