/* ===============================
   FILA ASSISTANT - MAIN.JS
   HTML SAFE • TABLE SAFE • IMAGE SAFE
   EXPORT: TXT, DOCX, PDF
=============================== */

document.addEventListener("DOMContentLoaded", () => {

    /* ===============================
       DOM ELEMENTS
    ================================ */
    const outputArea = document.getElementById("outputArea");
    const input = document.getElementById("noteInput");
    const sendBtn = document.getElementById("sendBtn");
    const changeBtn = document.getElementById("changeSelectionBtn");
    const currentSelectionEl = document.getElementById("currentSelection");
    const globalCopyBtn = document.getElementById("globalCopyBtn");

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

    if (currentSelectionEl) {
        currentSelectionEl.textContent =` ${classLevel} | ${subject}`;
    }

    let currentNotesHTML = "";

    /* ===============================
       SYSTEM & USER BUBBLES
    ================================ */
    function systemBubble(text) {
        const div = document.createElement("div");
        div.className = "bubble warning";
        div.innerHTML = text; // system messages render instantly (NO typing)
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
            "Kinyarwanda": [
                "ordinary/s1/kinyarwandas1v1.html",
                "ordinary/s1/kinyarwandas1v2.html",
                "ordinary/s1/kinyarwandas1v3.html",
                "ordinary/s1/kinyarwandas1v4.html",
                "ordinary/s1/kinyarwandas1v5.html"
            ],
            "Mathematics": [
                "ordinary/s1/mathematicss1v1.html",
                "ordinary/s1/mathematicss1v2.html",
                "ordinary/s1/mathematicss1v3.html",
                "ordinary/s1/mathematicss1v4.html",
                "ordinary/s1/mathematicss1v5.html"
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
            "Entrepreneurship": [
                "ordinary/s1/entrepreneurships1v1.html",
                "ordinary/s1/entrepreneurships1v2.html",
                "ordinary/s1/entrepreneurships1v3.html",
                "ordinary/s1/entrepreneurships1v4.html",
                "ordinary/s1/entrepreneurships1v5.html"
            ]
        },
        "S2": {
            "English": [
                "ordinary/s2/englishs2v1.html",
                "ordinary/s2/englishs2v2.html",
                "ordinary/s2/englishs2v3.html",
                "ordinary/s2/englishs2v4.html",
                "ordinary/s2/englishs2v5.html"
            ],
            "Mathematics": [
                "ordinary/s2/mathematicss2v1.html",
                "ordinary/s2/mathematicss2v2.html",
                "ordinary/s2/mathematicss2v3.html",
                "ordinary/s2/mathematicss2v4.html",
                "ordinary/s2/mathematicss2v5.html"
            ],
            "Biology": [
                "ordinary/s2/biologys2v1.html",
                "ordinary/s2/biologys2v2.html",
                "ordinary/s2/biologys2v3.html",
                "ordinary/s2/biologys2v4.html",
                "ordinary/s2/biologys2v5.html"
            ],
            "Chemistry": [
                "ordinary/s2/chemistrys2v1.html",
                "ordinary/s2/chemistrys2v2.html",
                "ordinary/s2/chemistrys2v3.html",
                "ordinary/s2/chemistrys2v4.html",
                "ordinary/s2/chemistrys2v5.html"
            ],
            "Physics": [
                "ordinary/s2/physicss2v1.html",
                "ordinary/s2/physicss2v2.html",
                "ordinary/s2/physicss2v3.html",
                "ordinary/s2/physicss2v4.html",
                "ordinary/s2/physicss2v5.html"
            ]
        },
        "S3": {
            "English": [
                "ordinary/s3/englishs3v1.html",
                "ordinary/s3/englishs3v2.html",
                "ordinary/s3/englishs3v3.html",
                "ordinary/s3/englishs3v4.html",
                "ordinary/s3/englishs3v5.html"
            ],
            "Mathematics": [
                "ordinary/s3/mathematicss3v1.html",
                "ordinary/s3/mathematicss3v2.html",
                "ordinary/s3/mathematicss3v3.html",
                "ordinary/s3/mathematicss3v4.html",
                "ordinary/s3/mathematicss3v5.html"
            ],
            "Biology": [
                "ordinary/s3/biologys3v1.html",
                "ordinary/s3/biologys3v2.html",
                "ordinary/s3/biologys3v3.html",
                "ordinary/s3/biologys3v4.html",
                "ordinary/s3/biologys3v5.html"
            ],
            "Chemistry": [
                "ordinary/s3/chemistrys3v1.html",
                "ordinary/s3/chemistrys3v2.html",
                "ordinary/s3/chemistrys3v3.html",
                "ordinary/s3/chemistrys3v4.html",
                "ordinary/s3/chemistrys3v5.html"
            ],
            "Physics": [
                "ordinary/s3/physicss3v1.html",
                "ordinary/s3/physicss3v2.html",
                "ordinary/s3/physicss3v3.html",
                "ordinary/s3/physicss3v4.html",
                "ordinary/s3/physicss3v5.html"
            ]
        }
    }
};
/* ===============================
       SAFE WORD-BY-WORD TYPEWRITER
       (HTML / TABLE / IMAGE SAFE)
    ================================ */
    function typeWriterPreserveHTML(element, html, delay = 120) {

        element.innerHTML = html;

        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode(node) {
                    return node.nodeValue.trim()
                        ? NodeFilter.FILTER_ACCEPT
                        : NodeFilter.FILTER_REJECT;
                }
            }
        );

        const textNodes = [];
        while (walker.nextNode()) textNodes.push(walker.currentNode);

        const originals = textNodes.map(n => n.nodeValue);
        textNodes.forEach(n => n.nodeValue = "");

        let nodeIndex = 0;
        let wordIndex = 0;

        function typeNext() {
            if (nodeIndex >= textNodes.length) {
                element.parentElement
                    ?.querySelector('.bubble-actions')
                    ?.classList.add('show');
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

    /* ===============================
       FETCH NOTES
    ================================ */
    function fetchNotes() {
        const files = notesFileMap[level]?.[classLevel]?.[subject];

        if (!files || !files.length) {
            systemBubble(`❌ No notes found for ${classLevel} ${subject}`);
            return;
        }

        const file = files[Math.floor(Math.random() * files.length)];
        systemBubble(`⏳ Loading ${subject} ${classLevel} notes...`);

        fetch(`https://raw.githubusercontent.com/Fils25git/Notes-Generation/main/${file}`)
            .then(r => r.ok ? r.text() : Promise.reject())
            .then(html => {
                currentNotesHTML = html;
                systemBubble(
                    `👋 Notes ready for <b>${subject}</b> (${classLevel}).<br>
                     Type a <b>unit</b> or <b>lesson title</b>.`
                );
            })
            .catch(() =>
                systemBubble(`❌ Failed to load notes. Please change selection.`)
            );
    }

    /* ===============================
       SEARCH NOTES BY HEADING
    ================================ */
    function searchNotes(query) {
        if (!currentNotesHTML) return null;

        const container = document.createElement("div");
        container.innerHTML = currentNotesHTML;

        const headings = [...container.querySelectorAll("h1,h2,h3,h4,h5,h6")];
        const target = headings.find(h =>
            h.textContent.toLowerCase().includes(query.toLowerCase())
        );

        if (!target) return null;

        const level = parseInt(target.tagName[1]);
        let html = target.outerHTML;

        let node = target.nextSibling;
        while (node) {
            if (node.nodeType === 1 && /^H[1-6]$/.test(node.tagName)) {
                if (parseInt(node.tagName[1]) <= level) break;
            }
            if (node.nodeType === 1) html += node.outerHTML;
            node = node.nextSibling;
        }

        return html;
    }

    /* ===============================
       CREATE NOTE BUBBLE
    ================================ */
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
            <button onclick="copyBubble(this.closest('.bubble'))">📋 Copy</button>
            <button onclick="toggleEdit(this.closest('.bubble'))">✏ Edit</button>
        `;
    }

    /* ===============================
       COPY / EDIT / SAVE
    ================================ */
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
            actions.innerHTML = `
                <select>
                    <option value="txt">TXT</option>
                    <option value="docx">DOCX</option>
                    <option value="pdf">PDF</option>
                </select>
                <input placeholder="filename">
                <button onclick="toggleEdit(this.closest('.bubble'))">💾 Save</button>
            `;
        }
    };

    /* ===============================
       SEND MESSAGE
    ================================ */
    function sendMessage() {
        const text = input.value.trim();
        if (!text) return systemBubble("⚠ Type a lesson or unit title.");

        userBubble(text);
        const result = searchNotes(text);

        result
            ? createNoteBubble(result)
            : systemBubble(`❌ "${text}" not found.`);

        input.value = "";
    }

    /* ===============================
       EVENTS
    ================================ */
    sendBtn.onclick = sendMessage;

input.addEventListener("keydown", e => {
    if (e.key === "Enter") {
        e.preventDefault();
        sendMessage();
    }
});

input.addEventListener("input", () => {
    // safe place for word-by-word logic
});

changeBtn.onclick = () => {
    localStorage.clear();
    location.href = "selection.html";
};

    /* ===============================
       START
    ================================ */
    fetchNotes();

});
