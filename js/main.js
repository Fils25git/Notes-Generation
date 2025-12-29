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
            "English": [
                "primary/p1/englishp1v1.html",
                "primary/p1/englishp1v2.html",
                "primary/p1/englishp1v3.html",
                "primary/p1/englishp1v4.html",
                "primary/p1/englishp1v5.html"
            ],
            "Kinyarwanda": [
                "primary/p1/kinyarwandap1v1.html",
                "primary/p1/kinyarwandap1v2.html",
                "primary/p1/kinyarwandap1v3.html",
                "primary/p1/kinyarwandap1v4.html",
                "primary/p1/kinyarwandap1v5.html"
            ],
            "Mathematics": [
                "primary/p1/mathematicsp1v1.html",
                "primary/p1/mathematicsp1v2.html",
                "primary/p1/mathematicsp1v3.html",
                "primary/p1/mathematicsp1v4.html",
                "primary/p1/mathematicsp1v5.html"
            ],
            "Social and Religious Studies": [
                "primary/p1/srsp1v1.html",
                "primary/p1/srsp1v2.html",
                "primary/p1/srsp1v3.html",
                "primary/p1/srsp1v4.html",
                "primary/p1/srsp1v5.html"
            ],
            "Science and Elementary Technology": [
                "primary/p1/sciencep1v1.html",
                "primary/p1/sciencep1v2.html",
                "primary/p1/sciencep1v3.html",
                "primary/p1/sciencep1v4.html",
                "primary/p1/sciencep1v5.html"
            ]
        },

        "P2": {
            "English": [
                "primary/p2/englishp2v1.html",
                "primary/p2/englishp2v2.html",
                "primary/p2/englishp2v3.html",
                "primary/p2/englishp2v4.html",
                "primary/p2/englishp2v5.html"
            ],
            "Kinyarwanda": [
                "primary/p2/kinyarwandap2v1.html",
                "primary/p2/kinyarwandap2v2.html",
                "primary/p2/kinyarwandap2v3.html",
                "primary/p2/kinyarwandap2v4.html",
                "primary/p2/kinyarwandap2v5.html"
            ],
            "Mathematics": [
                "primary/p2/mathematicsp2v1.html",
                "primary/p2/mathematicsp2v2.html",
                "primary/p2/mathematicsp2v3.html",
                "primary/p2/mathematicsp2v4.html",
                "primary/p2/mathematicsp2v5.html"
            ],
            "Social and Religious Studies": [
                "primary/p2/srsp2v1.html",
                "primary/p2/srsp2v2.html",
                "primary/p2/srsp2v3.html",
                "primary/p2/srsp2v4.html",
                "primary/p2/srsp2v5.html"
            ],
            "Science and Elementary Technology": [
                "primary/p2/sciencep2v1.html",
                "primary/p2/sciencep2v2.html",
                "primary/p2/sciencep2v3.html",
                "primary/p2/sciencep2v4.html",
                "primary/p2/sciencep2v5.html"
            ]
        },

        "P3": {
            "English": [
                "primary/p3/englishp3v1.html",
                "primary/p3/englishp3v2.html",
                "primary/p3/englishp3v3.html",
                "primary/p3/englishp3v4.html",
                "primary/p3/englishp3v5.html"
            ],
            "Kinyarwanda": [
                "primary/p3/kinyarwandap3v1.html",
                "primary/p3/kinyarwandap3v2.html",
                "primary/p3/kinyarwandap3v3.html",
                "primary/p3/kinyarwandap3v4.html",
                "primary/p3/kinyarwandap3v5.html"
            ],
            "Mathematics": [
                "primary/p3/mathematicsp3v1.html",
                "primary/p3/mathematicsp3v2.html",
                "primary/p3/mathematicsp3v3.html",
                "primary/p3/mathematicsp3v4.html",
                "primary/p3/mathematicsp3v5.html"
            ],
            "Social and Religious Studies": [
                "primary/p3/srsp3v1.html",
                "primary/p3/srsp3v2.html",
                "primary/p3/srsp3v3.html",
                "primary/p3/srsp3v4.html",
                "primary/p3/srsp3v5.html"
            ],
            "Science and Elementary Technology": [
                "primary/p3/sciencep3v1.html",
                "primary/p3/sciencep3v2.html",
                "primary/p3/sciencep3v3.html",
                "primary/p3/sciencep3v4.html",
                "primary/p3/sciencep3v5.html"
            ]
        },

        "P4": {
            "English": [
                "primary/p4/englishp4v1.html",
                "primary/p4/englishp4v2.html",
                "primary/p4/englishp4v3.html",
                "primary/p4/englishp4v4.html",
                "primary/p4/englishp4v5.html"
            ],
            "Kinyarwanda": [
                "primary/p4/kinyarwandap4v1.html",
                "primary/p4/kinyarwandap4v2.html",
                "primary/p4/kinyarwandap4v3.html",
                "primary/p4/kinyarwandap4v4.html",
                "primary/p4/kinyarwandap4v5.html"
            ],
            "Mathematics": [
                "primary/p4/mathematicsp4v1.html",
                "primary/p4/mathematicsp4v2.html",
                "primary/p4/mathematicsp4v3.html",
                "primary/p4/mathematicsp4v4.html",
                "primary/p4/mathematicsp4v5.html"
            ],
            "Social and Religious Studies": [
                "primary/p4/srsp4v1.html",
                "primary/p4/srsp4v2.html",
                "primary/p4/srsp4v3.html",
                "primary/p4/srsp4v4.html",
                "primary/p4/srsp4v5.html"
            ],
            "Science and Elementary Technology": [
                "primary/p4/sciencep4v1.html",
                "primary/p4/sciencep4v2.html",
                "primary/p4/sciencep4v3.html",
                "primary/p4/sciencep4v4.html",
                "primary/p4/sciencep4v5.html"
            ]
        },

        "P5": {
            "English": [
                "primary/p5/englishp5v1.html",
                "primary/p5/englishp5v2.html",
                "primary/p5/englishp5v3.html",
                "primary/p5/englishp5v4.html",
                "primary/p5/englishp5v5.html"
            ],
            "Kinyarwanda": [
                "primary/p5/kinyarwandap5v1.html",
                "primary/p5/kinyarwandap5v2.html",
                "primary/p5/kinyarwandap5v3.html",
                "primary/p5/kinyarwandap5v4.html",
                "primary/p5/kinyarwandap5v5.html"
            ],
            "Mathematics": [
                "primary/p5/mathematicsp5v1.html",
                "primary/p5/mathematicsp5v2.html",
                "primary/p5/mathematicsp5v3.html",
                "primary/p5/mathematicsp5v4.html",
                "primary/p5/mathematicsp5v5.html"
            ],
            "Social and Religious Studies": [
                "primary/p5/srsp5v1.html",
                "primary/p5/srsp5v2.html",
                "primary/p5/srsp5v3.html",
                "primary/p5/srsp5v4.html",
                "primary/p5/srsp5v5.html"
            ],
            "Science and Elementary Technology": [
                "primary/p5/sciencep5v1.html",
                "primary/p5/sciencep5v2.html",
                "primary/p5/sciencep5v3.html",
                "primary/p5/sciencep5v4.html",
                "primary/p5/sciencep5v5.html"
            ]
        },

        "P6": {
            "English": [
                "primary/p6/englishp6v1.html",
                "primary/p6/englishp6v2.html",
                "primary/p6/englishp6v3.html",
                "primary/p6/englishp6v4.html",
                "primary/p6/englishp6v5.html"
            ],
            "Kinyarwanda": [
                "primary/p6/kinyarwandap6v1.html",
                "primary/p6/kinyarwandap6v2.html",
                "primary/p6/kinyarwandap6v3.html",
                "primary/p6/kinyarwandap6v4.html",
                "primary/p6/kinyarwandap6v5.html"
            ],
            "Mathematics": [
                "primary/p6/mathematicsp6v1.html",
                "primary/p6/mathematicsp6v2.html",
                "primary/p6/mathematicsp6v3.html",
                "primary/p6/mathematicsp6v4.html",
                "primary/p6/mathematicsp6v5.html"
            ],
            "Social and Religious Studies": [
                "primary/p6/srsp6v1.html",
                "primary/p6/srsp6v2.html",
                "primary/p6/srsp6v3.html",
                "primary/p6/srsp6v4.html",
                "primary/p6/srsp6v5.html"
            ],
            "Science and Elementary Technology": [
                "primary/p6/sciencep6v1.html",
                "primary/p6/sciencep6v2.html",
                "primary/p6/sciencep6v3.html",
                "primary/p6/sciencep6v4.html",
                "primary/p6/sciencep6v5.html"
            ]
        }
    },

    "Ordinary": {
        "S1": {
            "English": [
                "ordinary/s1/englishs1v1.html",
                "ordinary/s1/englishs1v2.html",
                "ordinary/s1/englishs1v3.html",
                "ordinary/s1/englishs1v4.html",
                "ordinary/s1/englishs1v5.html"
            ],
            "Biology": [
                "ordinary/s1/biologys1v1.html",
                "ordinary/s1/biologys1v2.html",
                "ordinary/s1/biologys1v3.html",
                "ordinary/s1/biologys1v4.html",
                "ordinary/s1/biologys1v5.html"
            ],
            "Chemistry": [
                "ordinary/s1/chemistrys1v1.html",
                "ordinary/s1/chemistrys1v2.html",
                "ordinary/s1/chemistrys1v3.html",
                "ordinary/s1/chemistrys1v4.html",
                "ordinary/s1/chemistrys1v5.html"
            ],
            "Physics": [
                "ordinary/s1/physicss1v1.html",
                "ordinary/s1/physicss1v2.html",
                "ordinary/s1/physicss1v3.html",
                "ordinary/s1/physicss1v4.html",
                "ordinary/s1/physicss1v5.html"
            ],
            "Entrepreneurship": [
                "ordinary/s1/entrepreneurships1v1.html",
                "ordinary/s1/entrepreneurships1v2.html",
                "ordinary/s1/entrepreneurships1v3.html",
                "ordinary/s1/entrepreneurships1v4.html",
                "ordinary/s1/entrepreneurships1v5.html"
            ],
            "Kinyarwanda": [
                "ordinary/s1/kinyarwandas1v1.html",
                "ordinary/s1/kinyarwandas1v2.html",
                "ordinary/s1/kinyarwandas1v3.html",
                "ordinary/s1/kinyarwandas1v4.html",
                "ordinary/s1/kinyarwandas1v5.html"
            ],
            "History and Citizenship": [
                "ordinary/s1/historys1v1.html",
                "ordinary/s1/historys1v2.html",
                "ordinary/s1/historys1v3.html",
                "ordinary/s1/historys1v4.html",
                "ordinary/s1/historys1v5.html"
            ],
            "Geography": [
                "ordinary/s1/geographys1v1.html",
                "ordinary/s1/geographys1v2.html",
                "ordinary/s1/geographys1v3.html",
                "ordinary/s1/geographys1v4.html",
                "ordinary/s1/geographys1v5.html"
            ],
            "Mathematics": [
                "ordinary/s1/mathematicss1v1.html",
                "ordinary/s1/mathematicss1v2.html",
                "ordinary/s1/mathematicss1v3.html",
                "ordinary/s1/mathematicss1v4.html",
                "ordinary/s1/mathematicss1v5.html"
            ]
        }
    }
};
   /* ===============================
       LOAD NOTES WITH LOADING MESSAGE
=============================== */
    let currentNotesHTML = "";

    function fetchNotes(level, classLevel, subject) {
    const files = notesFileMap[level]?.[classLevel]?.[subject];
    if (!files || files.length === 0) {
        return systemBubble(`⚠ Error fetching notes of ${classLevel} ${subject}!`);
    }

    // 🎲 pick random file
    const randomFile = files[Math.floor(Math.random() * files.length)];

    systemBubble(`⏳I am  loading your notes of ${subject} ${classLevel}, please wait...`);

    fetch(`https://raw.githubusercontent.com/Fils25git/Notes-Generation/main/${randomFile}`)
        .then(r => r.ok ? r.text() : Promise.reject())
        .then(html => {
            currentNotesHTML = html;
            systemBubble(`Hello and Welcome 👋 <br>
            I have these Notes of <b>${subject}</b> in <b>${classLevel}</b> for sure 😛
            and I am ready to pour them 🥰 <br>
            Just give me a <b>lesson</b> or <b>unit title</b>, <br><br>
            <b>N.B:</b> remember I don't intend to discuss, I only need lesson title.
           <br> if you need To change selections tap 🔁`);
        })
        .catch(() =>
            systemBubble(`Sorry‼️, I don't have notes of ${subject} for ${classLevel} Yet,<br><br>
            You can explore other notes by tapping 🔁 above to change selection.`)
        );
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

    const targetHeading = headings.find(h =>
        h.textContent.trim().toLowerCase().includes(query.toLowerCase())
    );

    if (!targetHeading) return null;

    const startLevel = parseInt(targetHeading.tagName.replace("H", ""));
    let result = "";

    /* 🔼 ADD PARENT HEADINGS (Unit / Topic context) */
    for (let i = headings.indexOf(targetHeading) - 1; i >= 0; i--) {
        const h = headings[i];
        const level = parseInt(h.tagName.replace("H", ""));
        if (level < startLevel) {
            result = h.outerHTML + result;
        }
        if (level === 1) break;
    }

    /* 🔽 ADD TARGET HEADING */
    result += targetHeading.outerHTML;

    /* 🔽 ADD ALL CONTENT UNTIL NEXT SAME OR HIGHER HEADING */
    let node = targetHeading.nextSibling;

    while (node) {
        // Stop if we hit another heading of same or higher level
        if (
            node.nodeType === 1 &&
            /^H[1-6]$/i.test(node.tagName)
        ) {
            const lvl = parseInt(node.tagName.replace("H", ""));
            if (lvl <= startLevel) break;
        }

        // Add EVERYTHING (divs, tables, images, exercises)
        if (node.nodeType === 1) {
            result += node.outerHTML;
        }

        node = node.nextSibling;
    }

    return result;
           }
                                            }

    /* ===============================
       SEND MESSAGE (SAFE)
=============================== */
    function sendMessage() {
    const text = input.value.trim();
    if (!text) {
        systemBubble("⚠ What❗😫, You can't give me empty. <br>Type a lesson title first!");
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
        systemBubble(`❌ Oooh Sorry, <br><br>No <b>lesson or <b>unit</b> title called ${text} in ${classLevel} ${subject} notes i have.<br> <br>Give me correct lesson or unit title and i give you what you want. <br> <br>OR if i told you that I have not given these notes yet, <br? And if you want Tap 🔁 to change selection and access other notes`);
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
