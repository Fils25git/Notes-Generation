// ===== ELEMENTS =====
const levelSelect = document.getElementById("level");
const classSelect = document.getElementById("classSelect");
const subjectSelect = document.getElementById("subject");
const quizTypeSelect = document.getElementById("qNumber");
const sequenceSelect = document.getElementById("flow");
const marksSelect = document.getElementById("marks");
const startBtn = document.getElementById("startBtn");

// ===== HELPERS =====
function resetSelect(selectEl, placeholder) {
    selectEl.innerHTML = `<option value="">--Select ${placeholder}--</option>`;
    selectEl.disabled = true;
}

function resetQuizFlow() {
    resetSelect(quizTypeSelect, "Exercises Type");
    resetSelect(sequenceSelect, "Question Sequence");
    resetSelect(marksSelect, "Marks Weight");
}

// ===== LEVEL → CLASS =====
levelSelect.addEventListener("change", () => {
    resetSelect(classSelect, "Class");
    resetSelect(subjectSelect, "Subject");
    resetQuizFlow();

    let classes = [];
    if (levelSelect.value === "Primary") classes = ["P1","P2","P3","P4","P5","P6"];
    else if (levelSelect.value === "Ordinary") classes = ["S1","S2","S3"];
    else if (levelSelect.value === "GE") classes = ["S4","S5","S6"];
    else if (levelSelect.value === "TTC") classes = ["Y1","Y2","Y3"];

    classes.forEach(c => {
        classSelect.appendChild(new Option(c, c));
    });

    classSelect.disabled = !classes.length;
    updateStartButton();
});

// ===== CLASS → SUBJECT =====
classSelect.addEventListener("change", () => {
    resetSelect(subjectSelect, "Subject");
    resetQuizFlow();

    if (!classSelect.value) return;

    let subjects = [];
    if (levelSelect.value === "Primary")
        subjects = ["English","Mathematics","SRSE","SET","French"];
    else if (levelSelect.value === "Ordinary")
        subjects = ["English","Kinyarwanda","Mathematics","Biology","Chemistry","Physics","History","Geography","Entrepreneurship","ICT","Kiswahili","French"];
    else if (levelSelect.value === "GE")
        subjects = ["English","Mathematics","Biology","Chemistry","Physics","History","Geography","Entrepreneurship","ICT","Kiswahili","French","General Studies"];
    else if (levelSelect.value === "TTC")
        subjects = ["English","Mathematics","Biology","Chemistry","Physics","History","Geography","Entrepreneurship","ICT","Kiswahili","French","Integrated Science","Teaching Methodologies","Foundation of Education","Inclusive Education"];

    subjects.forEach(s => {
        subjectSelect.appendChild(new Option(s, s));
    });

    subjectSelect.disabled = false;
});

// ===== SUBJECT → QUIZ TYPES =====
subjectSelect.addEventListener("change", () => {
    resetQuizFlow();
    if (!subjectSelect.value) return;

    quizTypeSelect.innerHTML = `<option value="">--Select Exercises Type--</option>`;

    const mixed = new OptionGroup("Mixed Question Formats", [
        ["scenario_comprehension", "Scenario + Comprehension"],
        ["true_false", "True or False"],
        ["mcq", "Multiple Choice"],
        ["open", "Open-ended"]
    ]);

    const closedOnly = new OptionGroup("Only Closed Questions", [
        ["tf_only", "True / False Only"],
        ["mcq_only", "MCQs Only"]
    ]);

    const closedOpen = new OptionGroup("Closed + Open-ended", [
        ["mcq_open", "MCQ + Open"],
        ["tf_open", "T/F + Open"]
    ]);

    quizTypeSelect.append(mixed.el, closedOnly.el, closedOpen.el);
    quizTypeSelect.disabled = false;
});

// ===== QUIZ TYPE → SEQUENCE =====
quizTypeSelect.addEventListener("change", () => {
    resetSelect(sequenceSelect, "Question Sequence");
    resetSelect(marksSelect, "Marks Weight");

    if (!quizTypeSelect.value) return;

    [
        ["progressive", "Easy → Medium → Hard"],
        ["random", "Random Order"],
        ["by_type", "Grouped by Question Type"]
    ].forEach(([v, t]) => {
        sequenceSelect.appendChild(new Option(t, v));
    });

    sequenceSelect.disabled = false;
});

// ===== SEQUENCE → MARKS =====
sequenceSelect.addEventListener("change", () => {
    resetSelect(marksSelect, "Marks Weight");
    if (!sequenceSelect.value) return;

    [10, 20, 30, 50].forEach(m => {
        marksSelect.appendChild(new Option(`${m} Marks`, m));
    });

    marksSelect.disabled = false;
});

// ===== FINAL VALIDATION =====
marksSelect.addEventListener("change", updateStartButton);

function updateStartButton() {
    startBtn.disabled = !(
        levelSelect.value &&
        classSelect.value &&
        subjectSelect.value &&
        quizTypeSelect.value &&
        sequenceSelect.value &&
        marksSelect.value
    );
}

// ===== START =====
startBtn.addEventListener("click", () => {
    localStorage.setItem("level", levelSelect.value);
    localStorage.setItem("classLevel", classSelect.value);
    localStorage.setItem("subject", subjectSelect.value);
    localStorage.setItem("quizType", quizTypeSelect.value);
    localStorage.setItem("questionSequence", sequenceSelect.value);
    localStorage.setItem("marks", marksSelect.value);
    localStorage.setItem("selectionDone", "true");

    window.location.href = "app.html";
});

// ===== SMALL HELPER CLASS =====
function OptionGroup(label, options) {
    this.el = document.createElement("optgroup");
    this.el.label = label;
    options.forEach(([v, t]) => {
        this.el.appendChild(new Option(t, v));
    });
                             }
