/* ===============================
   FILA ASSISTANT - REFINED MAIN.JS
   TXT, DOCX, PDF EXPORTS ONLY
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
        currentSelectionEl.textContent = `${level} | ${classLevel} | ${subject}`;
    }

    /* ===============================
       NOTES FILE MAP (Partial example)
       Add all subjects as needed
    ================================ */
    
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

    let currentNotesHTML = "";

    /* ===============================
       SYSTEM BUBBLE FUNCTION
    ================================ */
    function systemBubble(text, delay = 80) {
        const div = document.createElement("div");
        div.className = "bubble warning";
        outputArea.appendChild(div);
        typeWriterSimple(div, text, 0, delay);
        outputArea.scrollTop = outputArea.scrollHeight;
    }

    function typeWriterSimple(element, text, index = 0, delay = 80) {
        if (index < text.length) {
            element.innerHTML += text.charAt(index);
            setTimeout(() => typeWriterSimple(element, text, index + 1, delay), delay);
        }
    }

    function userBubble(text) {
        const div = document.createElement("div");
        div.className = "bubble user";
        div.textContent = text;
        outputArea.appendChild(div);
        outputArea.scrollTop = outputArea.scrollHeight;
    }
/* ===============================
       FETCH NOTES
    ================================ */
    function fetchNotes() {
        const files = notesFileMap[level]?.[classLevel]?.[subject];
        if (!files || files.length === 0) {
            return systemBubble(`⚠ Error fetching notes of ${classLevel} ${subject}!`);
        }

        const randomFile = files[Math.floor(Math.random() * files.length)];
        systemBubble(`⏳ Loading your notes of ${subject} ${classLevel}, please wait...`);

        fetch(`https://raw.githubusercontent.com/Fils25git/Notes-Generation/main/${randomFile}`)
            .then(r => r.ok ? r.text() : Promise.reject())
            .then(html => {
                currentNotesHTML = html;
                systemBubble(`Hello 👋, I have these Notes of <b>${subject}</b> in <b>${classLevel}</b> ready for you.<br>
                Give me a <b>lesson</b> or <b>unit title</b> to display it.<br>
                🔄 Tap above to change selections if needed.`);
            })
            .catch(() =>
                systemBubble(`Sorry‼️, I don't have notes of ${subject} for ${classLevel} yet. Tap 🔄 to change selection.`)
            );
    }

    /* ===============================
       SEARCH NOTES
    ================================ */
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

        // Include parent headings
        for (let i = headings.indexOf(targetHeading) - 1; i >= 0; i--) {
            const h = headings[i];
            const level = parseInt(h.tagName.replace("H", ""));
            if (level < startLevel) {
                result = h.outerHTML + result;
            }
            if (level === 1) break;
        }

        result += targetHeading.outerHTML;

        let node = targetHeading.nextSibling;
        while (node) {
            if (node.nodeType === 1 && /^H[1-6]$/i.test(node.tagName)) {
                const lvl = parseInt(node.tagName.replace("H", ""));
                if (lvl <= startLevel) break;
            }
            if (node.nodeType === 1) result += node.outerHTML;
            node = node.nextSibling;
        }

        return result;
    }

    /* ===============================
       TYPEWRITER EFFECT FOR NOTES
    ================================ */
    function typeWriter(element, fullText, index = 0, delay = 50) {
        if (index < fullText.length) {
            element.innerHTML += fullText.charAt(index);
            element.scrollTop = element.scrollHeight;
            setTimeout(() => typeWriter(element, fullText, index + 1, delay), delay);
        } else {
            element.parentElement.querySelector('.bubble-actions')?.classList.add('show');
        }
    }

    /* ===============================
       CREATE NOTE BUBBLE
    ================================ */
    function createNoteBubble(result) {
        const div = document.createElement("div");
        div.className = "bubble system";

        const content = document.createElement("div");
        content.className = "bubble-content";
        content.style.borderRight = "2px solid #00AF00";
        content.style.paddingRight = "5px";

        const actions = document.createElement("div");
        actions.className = "bubble-actions";

        div.appendChild(content);
        div.appendChild(actions);
        outputArea.appendChild(div);
        outputArea.scrollTop = outputArea.scrollHeight;

        typeWriter(content, result);

        setTimeout(() => {
            actions.innerHTML = `
                <button onclick="copyBubble(this.parentElement.parentElement)">
                    <i class="fas fa-copy"></i> Copy
                </button>
                <button onclick="toggleEdit(this.parentElement.parentElement)">
                    <i class="fas fa-edit"></i> Edit
                </button>
            `;
        }, 500);

        return div;
    }
/* ===============================
       COPY SINGLE BUBBLE
    ================================ */
    window.copyBubble = function(bubble) {
        const content = bubble.querySelector('.bubble-content').innerText;
        navigator.clipboard.writeText(content).then(() => {
            const btn = bubble.querySelector('.bubble-actions button:first-child');
            const original = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            setTimeout(() => btn.innerHTML = original, 1500);
        }).catch(() => {
            const textarea = document.createElement('textarea');
            textarea.value = content;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        });
    };

    /* ===============================
       TOGGLE EDIT MODE + SAVE
    ================================ */
    window.toggleEdit = function(bubble) {
        const content = bubble.querySelector('.bubble-content');
        const actions = bubble.querySelector('.bubble-actions');

        if (content.contentEditable === true) {
            // SAVE MODE
            const formatSelect = actions.querySelector('select');
            const filenameInput = actions.querySelector('input');
            const format = formatSelect ? formatSelect.value : 'txt';
            let filename = filenameInput ? filenameInput.value.trim() : 'notes';
            filename = filename.replace(/[^a-zA-Z0-9_-]/g, '').replace(/\s+/g, '_');
            if (!filename.endsWith('.' + format)) filename += '.' + format;

            if (format === 'txt') {
                const blob = new Blob([content.innerText], { type: 'text/plain;charset=utf-8' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = filename;
                a.click();
                URL.revokeObjectURL(a.href);
            } else if (format === 'docx') {
                const blob = new Blob([content.innerText], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = filename;
                a.click();
                URL.revokeObjectURL(a.href);
            } else if (format === 'pdf') {
                const printWin = window.open('', '_blank');
                printWin.document.write(`<html><head><meta charset="UTF-8"></head><body>${content.innerHTML}</body></html>`);
                printWin.document.close();
                printWin.print();
            }

            // Restore bubble to normal
            content.contentEditable = false;
            content.style.border = 'none';
            content.style.padding = '0';
            actions.innerHTML = `
                <button onclick="copyBubble(this.parentElement.parentElement)">
                    <i class="fas fa-copy"></i> Copy
                </button>
                <button onclick="toggleEdit(this.parentElement.parentElement)">
                    <i class="fas fa-edit"></i> Edit
                </button>
            `;
        } else {
            // EDIT MODE
            content.contentEditable = true;
            content.style.border = '2px dashed #00AF00';
            content.style.padding = '10px';
            bubble.dataset.editId = Date.now();
            actions.innerHTML = `
                <select id="format-${bubble.dataset.editId}">
                    <option value="txt">📄 TXT</option>
                    <option value="docx">📄 DOCX</option>
                    <option value="pdf">📑 PDF</option>
                </select>
                <input id="filename-${bubble.dataset.editId}" placeholder="notes" value="${subject}_${classLevel}" style="flex:1">
                <button onclick="toggleEdit(this.parentElement.parentElement)">💾 Save</button>
            `;
            content.focus();
        }
    };

    /* ===============================
       GLOBAL COPY ALL BUBBLES
    ================================ */
    if (globalCopyBtn) {
        globalCopyBtn.onclick = () => {
            const allContent = Array.from(document.querySelectorAll('.bubble.system .bubble-content'))
                .map(el => el.innerText).join('\n=== ' + subject + ' ' + classLevel + ' ===\n');
            navigator.clipboard.writeText(allContent).then(() => {
                globalCopyBtn.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => globalCopyBtn.innerHTML = '<i class="fas fa-copy"></i>', 1500);
            });
        };
    }

    /* ===============================
       SEND MESSAGE FUNCTION
    ================================ */
    function sendMessage() {
        const text = input.value.trim();
        if (!text) {
            systemBubble("⚠ You can't send empty. Type a lesson title first!");
            return;
        }

        userBubble(text);
        const result = searchNotes(text);

        if (result) {
            createNoteBubble(result);
        } else {
            systemBubble(`❌ No lesson or unit called "${text}" found in ${classLevel} ${subject} notes. <br>
            Please check spelling or tap 🔄 to change selection.`);
        }

        input.value = "";
    }

    /* ===============================
       EVENT LISTENERS
    ================================ */
    if (changeBtn) {
        changeBtn.onclick = () => {
            localStorage.clear();
            window.location.href = "selection.html";
        };
    }

    if (sendBtn) {
        sendBtn.addEventListener("click", sendMessage);
    }

    if (input) {
        input.addEventListener("keydown", e => {
            if (e.key === "Enter") {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    /* ===============================
       START APP
    ================================ */
    fetchNotes();

});
