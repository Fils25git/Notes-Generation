// ===== SELECTION.JS =====

const levelSelect = document.getElementById("level");
const classSelect = document.getElementById("classSelect");
const subjectSelect = document.getElementById("subject");
const startBtn = document.getElementById("startBtn");

// ===== Helper: Reset dropdown =====
function resetSelect(selectEl, placeholder) {
    selectEl.innerHTML = `<option value="">--Select ${placeholder}--</option>`;
    selectEl.disabled = true;
}

// ===== Populate Class options based on Level =====
levelSelect.addEventListener("change", () => {
    resetSelect(classSelect, "Class");
    resetSelect(subjectSelect, "Subject");

    let classes = [];
    if (levelSelect.value === "Primary") {
        classes = ["P1","P2","P3","P4","P5","P6"];
    } if (levelSelect.value === "Ordinary") {
        classes = ["S1","S2","S3"];
    }if(levelSelect.value==="GE"){
        classes =["S4" , "S5", "S6"];
    } else if(levelSelect.value==="TTC") {
        classes= ["Y1", "Y2", "Y3"];
    }

    classes.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c;
        opt.textContent = c;
        classSelect.appendChild(opt);
    });

    classSelect.disabled = !classes.length;
    updateStartButton();
});

// ===== Populate Subject options based on Class =====
classSelect.addEventListener("change", () => {
    resetSelect(subjectSelect, "Subject");

    if (!classSelect.value) {
        updateStartButton();
        return;
    }

    let subjects = [];
    if (levelSelect.value === "Primary") {
        subjects = ["English","Mathematics","SRSE","SET", "French"];
    } if (levelSelect.value === "Ordinary") {
        subjects = ["English","Kinyarwanda","Mathematics","Biology","Chemistry","Physics","History","Geography","Entrepreneurship", "ICT", "Kiswahili", "French"];
    } if (levelSelect.value==="GE") {
        subjects = 
            ["English","Mathematics","Biology","Chemistry","Physics","History","Geography","Entrepreneurship", "ICT", "Kiswahili", "French", "General Studies"];
    } else if (levelSelect.value==="TTC") {
        subjects=
            
["English","Mathematics","Biology","Chemistry","Physics","History","Geography","Entrepreneurship", "ICT", "Kiswahili", "French", "Integrated Science", "Teaching Methodologies", "Foundation of Education", "Inclusive Education"];
    }
    subjects.forEach(s => {
        const opt = document.createElement("option");
        opt.value = s;
        opt.textContent = s;
        subjectSelect.appendChild(opt);
    });

    subjectSelect.disabled = !subjects.length;
    updateStartButton();
});

// ===== Enable Start button only when all selections are made =====
function updateStartButton() {
    startBtn.disabled = !(levelSelect.value && classSelect.value && subjectSelect.value);
}

// Also run update on subject select
subjectSelect.addEventListener("change", updateStartButton);

// ===== On Start click: save selections & redirect =====
startBtn.addEventListener("click", () => {
    localStorage.setItem("level", levelSelect.value);
    localStorage.setItem("classLevel", classSelect.value);
    localStorage.setItem("subject", subjectSelect.value);
    localStorage.setItem("selectionDone", "true");

    window.location.href = "app.html";
});
