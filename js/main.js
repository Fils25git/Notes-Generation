let notesDatabase = {};
const outputEl = document.getElementById("output");

// Load unit notes based on selection
const level = localStorage.getItem("level");
const className = localStorage.getItem("class");
const subject = localStorage.getItem("subject");
const unitName = localStorage.getItem("unit");

// Example: fetch notes JSON per unit
fetch(`notes/${unitName.replace(/\s/g, "")}.json`)
    .then(res => res.json())
    .then(data => notesDatabase = data)
    .catch(err => console.log("Error loading notes:", err));

function generateNotes() {
    const topic = document.getElementById("topicInput").value.trim().toLowerCase();
    if(!topic) return;

    let searchList = [];
    Object.keys(notesDatabase).forEach(key => {
        notesDatabase[key].keywords.forEach(word => searchList.push({topic: key, keyword: word}));
    });

    const fuse = new Fuse(searchList, { keys: ["keyword"], threshold: 0.4 });
    const result = fuse.search(topic);

    if(result.length>0){
        const matched = result[0].item.topic;
        const content = notesDatabase[matched].content;
        const randomIndex = Math.floor(Math.random()*content.length);
        outputEl.innerText = content[randomIndex];
    } else {
        outputEl.innerText = "No notes found for this topic yet.";
    }
}

function copyNotes() {
    if(!outputEl.innerText.trim()) return alert("No notes to copy!");
    const range = document.createRange();
    range.selectNodeContents(outputEl);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    document.execCommand("copy");
    sel.removeAllRanges();
    alert("Notes copied!");
}

function saveAsWord() {
    const text = outputEl.innerText;
    if(!text.trim()) return alert("No notes to save!");
    const { Document, Packer, Paragraph } = window.docx;
    const doc = new Document({
        sections:[{children: text.split("\n").map(line => new Paragraph({text: line}))}]
    });
    Packer.toBlob(doc).then(blob => saveAs(blob, "My_Notes.docx"));
}

function enableEdit() {
    outputEl.contentEditable = true;
    outputEl.focus();
      }
