// ===== SELECTION.JS =====

const levelSelect = document.getElementById("level");
const classSelect = document.getElementById("classSelect");
const subjectSelect = document.getElementById("subject");
const selectNumber = document.getElementById("qNumber");
const selectMarks = document.getElementById("marks");
const selectSequence = document.getElementById("flow");


const startBtn = document.getElementById("startBtn");

// ===== Helper: Reset dropdown =====
function resetSelect(selectEl, placeholder) {
    selectEl.innerHTML = `<option value="">--Select ${placeholder}--</option>`;
    selectEl.disabled = true;
}
function resetQuizFlow() {
    resetSelect(selectNumber, "Exercises Type");
    resetSelect(selectSequence, "Question Sequences");
    resetSelect(selectMarks, "Marks weight");
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

    resetQuizFlow();

subjectSelect.addEventListener("change", () => {
    if (!subjectSelect.value) {
        resetQuizFlow();
        return;
    }

    populateQuizTypes();
});
    function populateQuizTypes() {
    selectNumber.innerHTML = `<option value="">--Select Exercises Type--</option>`;

    const mixed = document.createElement("optgroup");
    mixed.label = "Mixed Question Formats";
    mixed.innerHTML = `
        <option value="scenario_comprehension">Scenario + Comprehension</option>
        <option value="true_false">True or False</option>
        <option value="mcq">Multiple Choice</option>
        <option value="open">Open-ended Questions</option>
    `;

    const closedOnly = document.createElement("optgroup");
    closedOnly.label = "Only Closed Questions";
    closedOnly.innerHTML = `
        <option value="tf_only">True / False Only</option>
        <option value="mcq_only">Multiple Choices Questions Only</option>
    `;

    const closedOpen = document.createElement("optgroup");
    closedOpen.label = "Closed + Open-ended";
    closedOpen.innerHTML = `
        <option value="mcq_open">MCQ + Open</option>
        <option value="tf_open">T/F + Open</option>
    `;

    selectNumber.append(mixed, closedOnly, closedOpen);
    selectNumber.disabled = false;
    }

    selectNumber.addEventListener("change", () => {
    resetSelect(selectSequence, "Question Sequences");
    resetSelect(selectMarks, "Marks weight");

    if (!selectNumber.value) return;

    const numbers =
        levelSelect.value === "Primary"
            ? [5, 10, 15]
            : [10, 20, 30];

    selectSequence.innerHTML = `<option value="">--Select Number of Questions--</option>`;

    numbers.forEach(n => {
        const opt = document.createElement("option");
        opt.value = n;
        opt.textContent = `${n} Questions`;
        selectSequence.appendChild(opt);
    });

    selectSequence.disabled = false;
});
    selectSequence.addEventListener("change", () => {
    resetSelect(selectMarks, "Marks weight");

    if (!selectSequence.value) return;

    const sequences = [
        { value: "progressive", text: "Easy → Medium → Hard" },
        { value: "random", text: "Random Order" },
        { value: "by_type", text: "Grouped by Question Type" }
    ];

    selectMarks.innerHTML = `<option value="">--Select Question Sequence--</option>`;

    sequences.forEach(seq => {
        const opt = document.createElement("option");
        opt.value = seq.value;
        opt.textContent = seq.text;
        selectMarks.appendChild(opt);
    });

    selectMarks.disabled = false;
});
    selectMarks.addEventListener("change", updateStartButton);

function updateStartButton() {
    startBtn.disabled = !(
        levelSelect.value &&
        classSelect.value &&
        subjectSelect.value &&
        selectNumber.value &&
        selectSequence.value &&
        selectMarks.value
    );
}

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
    localStorage.setItem("quizType", selectNumber.value);
localStorage.setItem("questionCount", selectSequence.value);
localStorage.setItem("questionFlow", selectMarks.value);
    localStorage.setItem("selectionDone", "true");

    window.location.href = "app.html";
});
