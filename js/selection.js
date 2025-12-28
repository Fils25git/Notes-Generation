const levelSelect = document.getElementById("level");
const classSelect = document.getElementById("classSelect");
const subjectSelect = document.getElementById("subject");
const startBtn = document.getElementById("startBtn");

// Reset child dropdowns
function resetSelect(selectEl, placeholder) {
    selectEl.innerHTML = `<option value="">--Select ${placeholder}--</option>`;
    selectEl.disabled = true;
}

// Populate Class based on Level
levelSelect.addEventListener("change", () => {
    resetSelect(classSelect, "Class");
    resetSelect(subjectSelect, "Subject");

    if (levelSelect.value === "Primary") {
        ["P1","P2","P3","P4","P5","P6"].forEach(c=>{
            const opt = document.createElement("option");
            opt.value = c;
            opt.textContent = c;
            classSelect.appendChild(opt);
        });
    } else if (levelSelect.value === "Ordinary") {
        ["S1","S2","S3"].forEach(c=>{
            const opt = document.createElement("option");
            opt.value = c;
            opt.textContent = c;
            classSelect.appendChild(opt);
        });
    }

    classSelect.disabled = !levelSelect.value;
});

// Populate Subjects based on Level
classSelect.addEventListener("change", () => {
    resetSelect(subjectSelect, "Subject");

    if (!classSelect.value) return;

    let subjects = [];
    if (levelSelect.value === "Primary") {
        subjects = ["English","Kinyarwanda","Mathematics","Social and Religious Studies","Science and Elementary Technology"];
    } else if (levelSelect.value === "Ordinary") {
        subjects = ["Biology","Chemistry","Physics","English","Entrepreneurship","Kinyarwanda","History and Citizenship","Geography","Mathematics"];
    }

    subjects.forEach(s => {
        const opt = document.createElement("option");
        opt.value = s;
        opt.textContent = s;
        subjectSelect.appendChild(opt);
    });

    subjectSelect.disabled = !classSelect.value;
});

// Enable Start button only if all selections made
[levelSelect, classSelect, subjectSelect].forEach(select => {
    select.addEventListener("change", () => {
        startBtn.disabled = !(levelSelect.value && classSelect.value && subjectSelect.value);
    });
});

// On Start click: save selections & go to main page
startBtn.addEventListener("click", () => {
    localStorage.setItem("level", levelSelect.value);
    localStorage.setItem("classLevel", classSelect.value);
    localStorage.setItem("subject", subjectSelect.value);
    localStorage.setItem("selectionDone", "true");

    window.location.href = "index.html";
});
