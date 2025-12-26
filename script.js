let htmlNote = "";

// Fetch HTML note
fetch("https://raw.githubusercontent.com/Fils25git/Notes-Generation/main/ENGnotesS3.html")
  .then(res => res.text())
  .then(data => htmlNote = data)
  .catch(err => console.log("Error loading HTML note:", err));

function normalize(text) {
    return text.toLowerCase().replace(/[^\w\s]/g, "").trim();
}

function stripNumbers(text) {
    return text.replace(/^\d+(\.\d+)*\s*/, "");
}

function isHeader(el) {
    return /^H[1-6]$/.test(el.tagName);
}

function generateNotes() {
    const input = normalize(document.getElementById("topicInput").value);
    const output = document.getElementById("output");
    output.value = "";

    if (!htmlNote) {
        output.value = "Notes are still loading...";
        return;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlNote, "text/html");
    const headers = Array.from(doc.querySelectorAll("h1,h2,h3,h4,h5,h6"));
    let foundHeader = null;
    let headerLevel = 0;

    for (const h of headers) {
        if (normalize(h.textContent) === input) {
            foundHeader = h;
            headerLevel = parseInt(h.tagName.charAt(1));
            break;
        }
    }

    if (!foundHeader) {
        output.value = `No lesson named "${input}" found.\nTip: Use exact header title.`;
        return;
    }

    // Collect content until next same/higher level header
    let content = stripNumbers(foundHeader.textContent) + " ";
    let next = foundHeader.nextElementSibling;
    while (next) {
        const nextTag = next.tagName;
        if (/H[1-6]/.test(nextTag) && parseInt(nextTag.charAt(1)) <= headerLevel) break;

        if (next.tagName === "P" || next.tagName === "LI") {
            content += stripNumbers(next.textContent) + " ";
        }
        next = next.nextElementSibling;
    }

    // Word-by-word typing effect
    const words = content.split(/\s+/);
    let i = 0;
    function typeWord() {
        if (i < words.length) {
            output.value += words[i] + " ";
            output.scrollTop = output.scrollHeight;
            let delay = /[.!?]$/.test(words[i]) ? 300 : 80;
            i++;
            setTimeout(typeWord, delay);
        }
    }
    typeWord();
}

function copyNotes() {
    const textarea = document.getElementById("output");
    textarea.select();
    document.execCommand("copy");
    alert("Notes copied!");
}

function saveAsWord() {
    const text = document.getElementById("output").value;
    const input = document.getElementById("topicInput").value || "Lesson";

    if (!text.trim()) {
        alert("No notes to save!");
        return;
    }

    const fileName = `Notes_of_${input.replace(/\s+/g,"_")}.docx`;
    const { Document, Packer, Paragraph } = window.docx;

    const parser = new DOMParser();
    const docHTML = parser.parseFromString(htmlNote, "text/html");
    const allElements = Array.from(docHTML.querySelectorAll("h1,h2,h3,h4,h5,h6,p,li"));

    const children = allElements.map(el => {
        const line = stripNumbers(el.textContent);
        if(!line.trim()) return new Paragraph(""); 
        if(isHeader(el)) {
            return new Paragraph({ text: line, bold: true });
        }
        return new Paragraph(line);
    });

    const docxDoc = new Document({ sections:[{ children }] });
    Packer.toBlob(docxDoc).then(blob => saveAs(blob, fileName));
}
