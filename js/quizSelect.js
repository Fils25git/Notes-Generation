// ===== ELEMENTS =====
const levelSelect = document.getElementById("level");
const classSelect = document.getElementById("classSelect");
const subjectSelect = document.getElementById("subject");
const quizTypeSelect = document.getElementById("qNumber");
const numberSelect = document.getElementById("numberOfQuestions");
const sequenceSelect = document.getElementById("flow");
const marksSelect = document.getElementById("marks");
const startBtn = document.getElementById("startBtn");

// ===== HELPERS =====
function resetSelect(selectEl, placeholder) {
    selectEl.innerHTML = `<option value="">--Select ${placeholder}--</option>`;
    selectEl.disabled = true;
}

function resetFlowFrom(selectEl) {
    // Reset all dropdowns that come after this one
    const order = [classSelect, subjectSelect, quizTypeSelect, numberSelect, sequenceSelect, marksSelect];
    const index = order.indexOf(selectEl);
    for (let i = index + 1; i < order.length; i++) resetSelect(order[i], order[i].id);
    updateStartButton();
}

// ===== LEVEL → CLASS =====
levelSelect.addEventListener("change", () => {
    resetFlowFrom(levelSelect);
    if (!levelSelect.value) return;

    let classes = [];
    if (levelSelect.value === "Primary") classes = ["P1","P2","P3","P4","P5","P6"];
    else if (levelSelect.value === "Ordinary") classes = ["S1","S2","S3"];
    else if (levelSelect.value === "GE") classes = ["S4","S5","S6"];
    else if (levelSelect.value === "TTC") classes = ["Y1","Y2","Y3"];

    classes.forEach(c => classSelect.appendChild(new Option(c, c)));
    classSelect.disabled = !classes.length;
});

// ===== CLASS → SUBJECT =====
classSelect.addEventListener("change", () => {
    resetFlowFrom(classSelect);
    if (!classSelect.value) return;

    let subjects = [];
    if (levelSelect.value === "Primary") subjects = ["English","Mathematics","SRSE","SET","French"];
    else if (levelSelect.value === "Ordinary") subjects = ["English","Kinyarwanda","Mathematics","Biology","Chemistry","Physics","History","Geography","Entrepreneurship","ICT","Kiswahili","French"];
    else if (levelSelect.value === "GE") subjects = ["English","Mathematics","Biology","Chemistry","Physics","History","Geography","Entrepreneurship","ICT","Kiswahili","French","General Studies"];
    else if (levelSelect.value === "TTC") subjects = ["English","Mathematics","Biology","Chemistry","Physics","History","Geography","Entrepreneurship","ICT","Kiswahili","French","Integrated Science","Teaching Methodologies","Foundation of Education","Inclusive Education"];

    subjects.forEach(s => subjectSelect.appendChild(new Option(s, s)));
    subjectSelect.disabled = false;
});

// ===== SUBJECT → QUIZ TYPE =====
subjectSelect.addEventListener("change", () => {
    resetFlowFrom(subjectSelect);
    if (!subjectSelect.value) return;

    const mixed = new OptionGroup("Mixed Question Formats", [
        ["scenario_comprehension", "Scenario + Closed + Open"],
        ["true_false", "True/False + MCQ"],
        ["mcq", "MCQ + Open Ended"],
        ["openClosed", "Open + True/False + MCQ"]
    ]);

    const closedOnly = new OptionGroup("Single Format", [
        ["tf_only", "True / False Only"],
        ["mcq_only", "Multiple Choice Only"],
        ["openEnded", "Open Ended Only"]
    ]);

    quizTypeSelect.append(mixed.el, closedOnly.el);
    quizTypeSelect.disabled = false;
});

// ===== QUIZ TYPE → NUMBER OF QUESTIONS =====
quizTypeSelect.addEventListener("change", () => {
    resetFlowFrom(quizTypeSelect);
    if (!quizTypeSelect.value) return;

    [5,10,15,20,30,50].forEach(n => numberSelect.appendChild(new Option(`${n} Questions`, n)));
    numberSelect.disabled = false;
});

// ===== NUMBER OF QUESTIONS → SEQUENCE =====
numberSelect.addEventListener("change", () => {
    resetFlowFrom(numberSelect);
    if (!numberSelect.value) return;

    [["progressive","Easy→Medium→Hard"],["random","Random Order"],["by_type","Grouped by Type"]]
        .forEach(([v,t]) => sequenceSelect.appendChild(new Option(t,v)));

    sequenceSelect.disabled = false;
});

// ===== SEQUENCE → MARKS =====
sequenceSelect.addEventListener("change", () => {
    resetFlowFrom(sequenceSelect);
    if (!sequenceSelect.value) return;

    [5,10,15,20,30,50].forEach(m => marksSelect.appendChild(new Option(`${m} Marks`, m)));
    marksSelect.disabled = false;
});

// ===== MARKS → START BUTTON =====
marksSelect.addEventListener("change", updateStartButton);

function updateStartButton() {
    startBtn.disabled = !(
        levelSelect.value &&
        classSelect.value &&
        subjectSelect.value &&
        quizTypeSelect.value &&
        numberSelect.value &&
        sequenceSelect.value &&
        marksSelect.value
    );
}

// ===== START BUTTON CLICK =====
startBtn.addEventListener("click", () => {
    localStorage.setItem("level", levelSelect.value);
    localStorage.setItem("classLevel", classSelect.value);
    localStorage.setItem("subject", subjectSelect.value);
    localStorage.setItem("quizType", quizTypeSelect.value);
    localStorage.setItem("numberOfQuestions", numberSelect.value);
    localStorage.setItem("questionSequence", sequenceSelect.value);
    localStorage.setItem("marks", marksSelect.value);
    localStorage.setItem("selectionDone","true");
    window.location.href = "quizApp.html";
});

// ===== OPTION GROUP HELPER =====
function OptionGroup(label, options) {
    this.el = document.createElement("optgroup");
    this.el.label = label;
    options.forEach(([v,t]) => this.el.appendChild(new Option(t,v)));
                                                           }
