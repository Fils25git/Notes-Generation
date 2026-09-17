```javascript
/* ============================================================
   FILA ASSISTANT - MARKS SYSTEM
   ============================================================ */

const teacherId = Number(localStorage.getItem("userId"));

if (!teacherId) {
    window.location.href = "login.html";
}


/* ============================================================
   STATE
   ============================================================ */

let selectedYear = null;
let selectedTerm = Number(localStorage.getItem("selectedTerm")) || null;
let selectedClass = Number(localStorage.getItem("selectedClass")) || null;
let selectedSubject = Number(localStorage.getItem("selectedSubject")) || null;

let currentClasses = [];
let currentSubjects = [];
let currentTerms = [];

let currentLearners = [];
let currentTests = [];
let currentMarks = {};

let editingTestId = null;


/* ============================================================
   ELEMENTS
   ============================================================ */

const classSelect = document.getElementById("classSelect");
const subjectSelect = document.getElementById("subjectSelect");
const termSelect = document.getElementById("termSelect");

const marksHead = document.getElementById("marksHead");
const marksBody = document.getElementById("marksBody");

const marksTable = document.getElementById("marksTable");
const marksLoading = document.getElementById("marksLoading");
const marksEmpty = document.getElementById("marksEmpty");

const searchInput = document.getElementById("searchInput");
const saveStatus = document.getElementById("saveStatus");

const manageTestsBtn = document.getElementById("manageTestsBtn");

const manageTestsModal = document.getElementById("manageTestsModal");
const testEditorModal = document.getElementById("testEditorModal");

const testsLoading = document.getElementById("testsLoading");
const testsEmpty = document.getElementById("testsEmpty");
const testsTable = document.getElementById("testsTable");
const testsBody = document.getElementById("testsBody");

const testForm = document.getElementById("testForm");
const testName = document.getElementById("testName");
const testMaxScore = document.getElementById("testMaxScore");
const testIsExam = document.getElementById("testIsExam");

const testEditorTitle = document.getElementById("testEditorTitle");
const testEditorSubtitle = document.getElementById("testEditorSubtitle");
const saveTestBtn = document.getElementById("saveTestBtn");
const saveTestBtnText = document.getElementById("saveTestBtnText");


/* ============================================================
   API
   ============================================================ */

async function school(action, body = {}, method = "GET") {

    let url =
        `/.netlify/functions/school?action=${encodeURIComponent(action)}` +
        `&teacher_id=${encodeURIComponent(teacherId)}`;

    const options = {
        method,
        headers: {
            "Content-Type": "application/json"
        }
    };

    if (method !== "GET") {
        options.body = JSON.stringify({
            ...body,
            teacher_id: teacherId
        });
    }

    const response = await fetch(url, options);

    let data = {};

    try {
        data = await response.json();
    } catch {
        throw new Error("The server returned an invalid response.");
    }

    if (!response.ok || data.success === false) {
        throw new Error(
            data.message ||
            `Request failed (${response.status}).`
        );
    }

    return data;
}


async function academic(action, params = {}) {

    const query = new URLSearchParams({
        action,
        ...params
    });

    const response = await fetch(
        `/.netlify/functions/academic?${query.toString()}`
    );

    let data = {};

    try {
        data = await response.json();
    } catch {
        throw new Error("The academic system returned an invalid response.");
    }

    if (!response.ok || data.success === false) {
        throw new Error(
            data.message ||
            `Academic request failed (${response.status}).`
        );
    }

    return data;
}


/* ============================================================
   TOAST
   ============================================================ */

function showToast(message, type = "success") {

    const container = document.getElementById("toastContainer");

    const toast = document.createElement("div");

    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3500);
}


/* ============================================================
   HELPERS
   ============================================================ */

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function formatDate(dateValue) {

    if (!dateValue) return "—";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}


function setSaveStatus(message = "", type = "") {

    saveStatus.textContent = message;
    saveStatus.className = "save-status";

    if (type) {
        saveStatus.classList.add(type);
    }
}


function getSelectedClassObject() {

    return currentClasses.find(
        item => Number(item.id) === Number(selectedClass)
    );
}


function getSelectedSubjectObject() {

    return currentSubjects.find(
        item => Number(item.id) === Number(selectedSubject)
    );
}


function getSelectedTermObject() {

    return currentTerms.find(
        item => Number(item.id) === Number(selectedTerm)
    );
}


/* ============================================================
   ACADEMIC CONTEXT
   ============================================================ */

async function loadAcademicContext() {

    try {

        const data = await academic("getCurrent");

        if (!data.year || !data.term) {
            throw new Error("No active academic year and term were found.");
        }

        selectedYear = Number(data.year.id);

        if (!selectedTerm) {
            selectedTerm = Number(data.term.id);
            localStorage.setItem("selectedTerm", selectedTerm);
        }

        localStorage.setItem(
            "selectedYear",
            selectedYear
        );

        return true;

    } catch (error) {

        console.error(error);

        showToast(
            error.message || "Could not load academic context.",
            "error"
        );

        return false;
    }
}


/* ============================================================
   LOAD TERMS
   ============================================================ */

async function loadTerms() {

    termSelect.disabled = true;

    termSelect.innerHTML =
        `<option value="">Loading terms...</option>`;

    try {

        const data = await academic(
            "getTerms",
            {
                academic_year_id: selectedYear
            }
        );

        /*
         * academic.js returns:
         *
         * {
         *   success: true,
         *   terms: [...]
         * }
         */

        currentTerms = Array.isArray(data.terms)
            ? data.terms
            : [];

        termSelect.innerHTML =
            `<option value="">Select term</option>`;

        currentTerms.forEach(term => {

            const option = document.createElement("option");

            option.value = term.id;
            option.textContent = term.term_name;

            termSelect.appendChild(option);
        });


        /*
         * Try to keep previously selected term.
         * Otherwise select the current term.
         */

        let termToUse = currentTerms.find(
            term =>
                Number(term.id) === Number(selectedTerm)
        );

        if (!termToUse) {

            const currentTerm = currentTerms.find(
                term => term.is_current === true
            );

            termToUse = currentTerm || currentTerms[0];
        }

        if (termToUse) {

            selectedTerm = Number(termToUse.id);

            termSelect.value = selectedTerm;

            localStorage.setItem(
                "selectedTerm",
                selectedTerm
            );

            termSelect.disabled = false;

        } else {

            termSelect.innerHTML =
                `<option value="">No terms found</option>`;
        }

    } catch (error) {

        console.error(error);

        termSelect.innerHTML =
            `<option value="">Unable to load terms</option>`;

        showToast(
            error.message || "Could not load terms.",
            "error"
        );
    }
}


/* ============================================================
   LOAD CLASSES
   ============================================================ */

async function loadClasses() {

    classSelect.disabled = true;

    classSelect.innerHTML =
        `<option value="">Loading classes...</option>`;

    subjectSelect.disabled = true;

    subjectSelect.innerHTML =
        `<option value="">Select a class first</option>`;

    try {

        const data = await school(
            "getClasses",
            {
                academic_year_id: selectedYear
            }
        );

        currentClasses = Array.isArray(data.classes)
            ? data.classes
            : Array.isArray(data)
                ? data
                : [];

        classSelect.innerHTML =
            `<option value="">Select class</option>`;

        currentClasses.forEach(item => {

            const option = document.createElement("option");

            option.value = item.id;
            option.textContent = item.class_name;

            classSelect.appendChild(option);
        });


        if (!currentClasses.length) {

            classSelect.innerHTML =
                `<option value="">No teaching classes found</option>`;

            selectedClass = null;
            selectedSubject = null;

            manageTestsBtn.disabled = true;

            showMarksEmpty(
                "No teaching classes found",
                "Create a class and assign a subject to it before recording marks."
            );

            return;
        }


        let classToUse = currentClasses.find(
            item =>
                Number(item.id) === Number(selectedClass)
        );

        if (!classToUse) {
            classToUse = currentClasses[0];
        }

        selectedClass = Number(classToUse.id);

        classSelect.value = selectedClass;

        localStorage.setItem(
            "selectedClass",
            selectedClass
        );

        classSelect.disabled = false;

        await loadSubjects();

    } catch (error) {

        console.error(error);

        classSelect.innerHTML =
            `<option value="">Unable to load classes</option>`;

        manageTestsBtn.disabled = true;

        showToast(
            error.message || "Could not load teaching classes.",
            "error"
        );
    }
}


/* ============================================================
   LOAD SUBJECTS FOR SELECTED CLASS
   ============================================================ */

async function loadSubjects() {

    subjectSelect.disabled = true;

    subjectSelect.innerHTML =
        `<option value="">Loading subjects...</option>`;

    selectedSubject = null;

    localStorage.removeItem("selectedSubject");

    try {

        const data = await school(
            "getSubjectsForClass",
            {
                class_id: selectedClass,
                academic_year_id: selectedYear
            }
        );

        currentSubjects = Array.isArray(data.subjects)
            ? data.subjects
            : Array.isArray(data)
                ? data
                : [];

        subjectSelect.innerHTML =
            `<option value="">Select subject</option>`;


        if (!currentSubjects.length) {

            subjectSelect.innerHTML =
                `<option value="">No subjects assigned</option>`;

            manageTestsBtn.disabled = true;

            showMarksEmpty(
                "No subject assigned",
                "This class does not have a subject assigned to you for this academic year."
            );

            return;
        }


        currentSubjects.forEach(subject => {

            const option = document.createElement("option");

            option.value = subject.id;
            option.textContent = subject.subject_name;

            subjectSelect.appendChild(option);
        });


        const savedSubjectId = Number(
            localStorage.getItem("selectedSubject")
        );

        let subjectToUse = currentSubjects.find(
            subject =>
                Number(subject.id) === savedSubjectId
        );

        if (!subjectToUse) {
            subjectToUse = currentSubjects[0];
        }

        selectedSubject = Number(subjectToUse.id);

        subjectSelect.value = selectedSubject;

        localStorage.setItem(
            "selectedSubject",
            selectedSubject
        );

        subjectSelect.disabled = false;

        manageTestsBtn.disabled = false;

        await loadMarks();

    } catch (error) {

        console.error(error);

        subjectSelect.innerHTML =
            `<option value="">Unable to load subjects</option>`;

        manageTestsBtn.disabled = true;

        showToast(
            error.message || "Could not load subjects.",
            "error"
        );
    }
}


/* ============================================================
   SHOW EMPTY
   ============================================================ */

function showMarksEmpty(title, message) {

    marksLoading.style.display = "none";
    marksTable.style.display = "none";

    marksEmpty.style.display = "block";

    marksEmpty.innerHTML = `
        <i class="fa-solid fa-clipboard-list"></i>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(message)}</p>
    `;
}


/* ============================================================
   LOAD MARKS
   ============================================================ */

async function loadMarks() {

    if (
        !selectedYear ||
        !selectedClass ||
        !selectedSubject ||
        !selectedTerm
    ) {

        showMarksEmpty(
            "Select your teaching context",
            "Please select a class, subject and term first."
        );

        manageTestsBtn.disabled = true;

        return;
    }

    marksLoading.style.display = "block";
    marksEmpty.style.display = "none";
    marksTable.style.display = "none";

    setSaveStatus("");

    try {

        const data = await school(
            "getMarks",
            {
                class_id: selectedClass,
                subject_id: selectedSubject,
                academic_year_id: selectedYear,
                term_id: selectedTerm
            }
        );

        currentLearners = Array.isArray(data.learners)
            ? data.learners
            : [];

        currentTests = Array.isArray(data.tests)
            ? data.tests
            : [];

        currentMarks = data.marks || {};

        renderMarksTable();

        manageTestsBtn.disabled = false;

    } catch (error) {

        console.error(error);

        showMarksEmpty(
            "Unable to load marks",
            error.message || "Please try again."
        );

        showToast(
            error.message || "Could not load marks.",
            "error"
        );
    }
}


/* ============================================================
   RENDER MARKS TABLE
   ============================================================ */

function renderMarksTable() {

    marksLoading.style.display = "none";

    if (!currentLearners.length) {

        showMarksEmpty(
            "No learners found",
            "Add learners to this class before recording marks."
        );

        return;
    }

    marksEmpty.style.display = "none";
    marksTable.style.display = "table";


    let headHtml = `
        <tr>
            <th>#</th>
            <th>Pupil Name</th>
    `;


    currentTests.forEach(test => {

        headHtml += `
            <th>
                ${escapeHtml(test.test_name)}
                <br>
                ${
                    test.is_exam
                        ? `<span class="exam-badge">Exam / ${escapeHtml(test.max_score)}</span>`
                        : `<span class="test-badge">Test / ${escapeHtml(test.max_score)}</span>`
                }
            </th>
        `;
    });


    headHtml += `
            <th>Total</th>
            <th>Percentage</th>
        </tr>
    `;

    marksHead.innerHTML = headHtml;


    marksBody.innerHTML = "";


    currentLearners.forEach((learner, index) => {

        const learnerMarks =
            currentMarks[String(learner.id)] || {};

        let rowTotal = 0;
        let rowMax = 0;

        let rowHtml = `
            <tr
                data-learner-name="${escapeHtml(
                    learner.full_name
                ).toLowerCase()}"
            >

                <td>${index + 1}</td>

                <td>
                    <strong>
                        ${escapeHtml(learner.full_name)}
                    </strong>
                </td>
        `;


        currentTests.forEach(test => {

            const savedMark =
                learnerMarks[String(test.id)];

            const score =
                savedMark !== undefined &&
                savedMark !== null
                    ? savedMark
                    : "";

            if (score !== "") {
                rowTotal += Number(score);
            }

            rowMax += Number(test.max_score || 0);


            rowHtml += `
                <td>

                    <input
                        type="number"
                        class="mark-input"
                        min="0"
                        max="${escapeHtml(test.max_score)}"
                        step="0.01"
                        value="${escapeHtml(score)}"
                        data-learner-id="${learner.id}"
                        data-test-id="${test.id}"
                        data-max="${escapeHtml(test.max_score)}"
                        onchange="saveMark(this)"
                        oninput="validateMarkInput(this)"
                    >

                </td>
            `;
        });


        const percentage =
            rowMax > 0
                ? ((rowTotal / rowMax) * 100).toFixed(2)
                : "0.00";


        rowHtml += `
                <td class="readonly-score">
                    ${rowTotal.toFixed(2)}
                </td>

                <td class="percentage">
                    ${percentage}%
                </td>

            </tr>
        `;


        marksBody.insertAdjacentHTML(
            "beforeend",
            rowHtml
        );
    });


    applySearch();
}


/* ============================================================
   VALIDATE MARK INPUT
   ============================================================ */

function validateMarkInput(input) {

    const value = Number(input.value);
    const max = Number(input.dataset.max);

    input.classList.remove("invalid");

    if (
        input.value !== "" &&
        (
            Number.isNaN(value) ||
            value < 0 ||
            value > max
        )
    ) {

        input.classList.add("invalid");

        return false;
    }

    return true;
}


/* ============================================================
   SAVE MARK
   ============================================================ */

async function saveMark(input) {

    if (!validateMarkInput(input)) {

        showToast(
            `Mark must be between 0 and ${input.dataset.max}.`,
            "error"
        );

        return;
    }


    const learnerId = Number(
        input.dataset.learnerId
    );

    const testId = Number(
        input.dataset.testId
    );

    const value =
        input.value === ""
            ? null
            : Number(input.value);


    input.disabled = true;

    setSaveStatus(
        "Saving...",
        ""
    );


    try {

        await school(
            "saveMark",
            {
                learner_id: learnerId,
                test_id: testId,
                score: value,
                class_id: selectedClass,
                subject_id: selectedSubject,
                academic_year_id: selectedYear,
                term_id: selectedTerm
            },
            "POST"
        );


        setSaveStatus(
            "Mark saved.",
            "success"
        );

        await loadMarks();

    } catch (error) {

        console.error(error);

        setSaveStatus(
            error.message || "Could not save mark.",
            "error"
        );

        showToast(
            error.message || "Could not save mark.",
            "error"
        );

    } finally {

        input.disabled = false;
    }
}


/* ============================================================
   SEARCH
   ============================================================ */

function applySearch() {

    const search =
        searchInput.value
            .trim()
            .toLowerCase();

    const rows =
        marksBody.querySelectorAll("tr");

    rows.forEach(row => {

        const name =
            row.dataset.learnerName || "";

        row.style.display =
            !search || name.includes(search)
                ? ""
                : "none";
    });
}


searchInput.addEventListener(
    "input",
    applySearch
);


/* ============================================================
   CLASS CHANGE
   ============================================================ */

classSelect.addEventListener(
    "change",
    async () => {

        selectedClass =
            Number(classSelect.value) || null;

        localStorage.setItem(
            "selectedClass",
            selectedClass || ""
        );

        selectedSubject = null;

        localStorage.removeItem(
            "selectedSubject"
        );

        manageTestsBtn.disabled = true;

        await loadSubjects();
    }
);


/* ============================================================
   SUBJECT CHANGE
   ============================================================ */

subjectSelect.addEventListener(
    "change",
    async () => {

        selectedSubject =
            Number(subjectSelect.value) || null;

        localStorage.setItem(
            "selectedSubject",
            selectedSubject || ""
        );

        manageTestsBtn.disabled =
            !selectedSubject;

        await loadMarks();
    }
);


/* ============================================================
   TERM CHANGE
   ============================================================ */

termSelect.addEventListener(
    "change",
    async () => {

        selectedTerm =
            Number(termSelect.value) || null;

        localStorage.setItem(
            "selectedTerm",
            selectedTerm || ""
        );

        await loadMarks();
    }
);


/* ============================================================
   MANAGE TESTS
   ============================================================ */

async function openManageTests() {

    if (
        !selectedYear ||
        !selectedClass ||
        !selectedSubject ||
        !selectedTerm
    ) {

        showToast(
            "Select a class, subject and term first.",
            "error"
        );

        return;
    }


    const classObject =
        getSelectedClassObject();

    const subjectObject =
        getSelectedSubjectObject();

    const termObject =
        getSelectedTermObject();


    document.getElementById(
        "modalClassName"
    ).textContent =
        classObject?.class_name || "—";

    document.getElementById(
        "modalSubjectName"
    ).textContent =
        subjectObject?.subject_name || "—";

    document.getElementById(
        "modalTermName"
    ).textContent =
        termObject?.term_name || "—";

    document.getElementById(
        "modalYearName"
    ).textContent =
        localStorage.getItem("selectedYearName") || "Current academic year";


    manageTestsModal.classList.add("show");

    await loadTestsForModal();
}


/* ============================================================
   LOAD TESTS
   ============================================================ */

async function loadTestsForModal() {

    testsLoading.style.display = "block";
    testsEmpty.style.display = "none";
    testsTable.style.display = "none";

    try {

        const data = await school(
            "getTests",
            {
                class_id: selectedClass,
                subject_id: selectedSubject,
                academic_year_id: selectedYear,
                term_id: selectedTerm
            }
        );

        currentTests = Array.isArray(data.tests)
            ? data.tests
            : [];

        renderTests();

    } catch (error) {

        console.error(error);

        testsLoading.style.display = "none";

        testsEmpty.style.display = "block";

        testsEmpty.innerHTML = `
            <i class="fa-solid fa-triangle-exclamation"></i>
            <h3>Unable to load tests</h3>
            <p>${escapeHtml(error.message)}</p>
        `;

        showToast(
            error.message || "Could not load tests.",
            "error"
        );
    }
}


/* ============================================================
   RENDER TESTS
   ============================================================ */

function renderTests() {

    testsLoading.style.display = "none";

    if (!currentTests.length) {

        testsTable.style.display = "none";
        testsEmpty.style.display = "block";

        return;
    }


    testsEmpty.style.display = "none";
    testsTable.style.display = "table";

    testsBody.innerHTML = "";


    currentTests.forEach((test, index) => {

        const typeBadge =
            test.is_exam
                ? `<span class="exam-badge">Exam</span>`
                : `<span class="test-badge">Test</span>`;


        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${index + 1}</td>

            <td>
                <strong>
                    ${escapeHtml(test.test_name)}
                </strong>
            </td>

            <td>
                ${typeBadge}
            </td>

            <td>
                ${escapeHtml(test.max_score)}
            </td>

            <td>
                ${formatDate(test.created_at)}
            </td>

            <td>

                <div class="actions">

                    <button
                        type="button"
                        class="icon-btn edit"
                        title="Edit test"
                        onclick="openEditTestModal(${test.id})"
                    >
                        <i class="fa-solid fa-pen"></i>
                    </button>

                    <button
                        type="button"
                        class="icon-btn delete"
                        title="Delete test"
                        onclick="deleteTest(${test.id})"
                    >
                        <i class="fa-solid fa-trash"></i>
                    </button>

                </div>

            </td>
        `;

        testsBody.appendChild(row);
    });
}


/* ============================================================
   ADD TEST MODAL
   ============================================================ */

function openAddTestModal() {

    editingTestId = null;

    testEditorTitle.textContent =
        "Add New Test";

    testEditorSubtitle.textContent =
        "Create an assessment for the selected class.";

    saveTestBtnText.textContent =
        "Create Test";

    testName.value = "";
    testMaxScore.value = "";
    testIsExam.checked = false;

    testEditorModal.classList.add("show");

    setTimeout(() => {
        testName.focus();
    }, 100);
}


/* ============================================================
   EDIT TEST MODAL
   ============================================================ */

function openEditTestModal(testId) {

    const test = currentTests.find(
        item => Number(item.id) === Number(testId)
    );

    if (!test) {

        showToast(
            "Test could not be found.",
            "error"
        );

        return;
    }


    editingTestId = Number(test.id);

    testEditorTitle.textContent =
        "Edit Test";

    testEditorSubtitle.textContent =
        "Update this assessment.";

    saveTestBtnText.textContent =
        "Save Changes";

    testName.value =
        test.test_name || "";

    testMaxScore.value =
        test.max_score || "";

    testIsExam.checked =
        Boolean(test.is_exam);


    testEditorModal.classList.add("show");

    setTimeout(() => {
        testName.focus();
    }, 100);
}


/* ============================================================
   SUBMIT TEST FORM
   ============================================================ */

testForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        const name =
            testName.value.trim();

        const maxScore =
            Number(testMaxScore.value);

        const isExam =
            testIsExam.checked;


        if (!name) {

            showToast(
                "Please enter a test name.",
                "error"
            );

            testName.focus();

            return;
        }


        if (
            !Number.isFinite(maxScore) ||
            maxScore <= 0
        ) {

            showToast(
                "Maximum marks must be greater than 0.",
                "error"
            );

            testMaxScore.focus();

            return;
        }


        saveTestBtn.disabled = true;

        saveTestBtnText.textContent =
            editingTestId
                ? "Saving..."
                : "Creating...";


        try {

            if (editingTestId) {

                await school(
                    "updateTest",
                    {
                        id: editingTestId,
                        test_name: name,
                        max_score: maxScore,
                        is_exam: isExam
                    },
                    "POST"
                );

                showToast(
                    "Test updated successfully."
                );

            } else {

                await school(
                    "addTest",
                    {
                        test_name: name,
                        max_score: maxScore,
                        is_exam: isExam,
                        class_id: selectedClass,
                        subject_id: selectedSubject,
                        academic_year_id: selectedYear,
                        term_id: selectedTerm
                    },
                    "POST"
                );

                showToast(
                    "Test created successfully."
                );
            }


            closeModal("testEditorModal");

            await loadTestsForModal();

            await loadMarks();

        } catch (error) {

            console.error(error);

            showToast(
                error.message ||
                "Could not save test.",
                "error"
            );

        } finally {

            saveTestBtn.disabled = false;

            saveTestBtnText.textContent =
                editingTestId
                    ? "Save Changes"
                    : "Create Test";
        }
    }
);


/* ============================================================
   DELETE TEST
   ============================================================ */

async function deleteTest(testId) {

    const test =
        currentTests.find(
            item =>
                Number(item.id) === Number(testId)
        );

    if (!test) {
        return;
    }


    const confirmed =
        confirm(
            `Delete "${test.test_name}"?\n\n` +
            `All marks recorded for this assessment will also be deleted.`
        );


    if (!confirmed) {
        return;
    }


    try {

        await school(
            "deleteTest",
            {
                id: testId
            },
            "POST"
        );


        showToast(
            "Test deleted successfully."
        );


        await loadTestsForModal();

        await loadMarks();

    } catch (error) {

        console.error(error);

        showToast(
            error.message ||
            "Could not delete test.",
            "error"
        );
    }
}


/* ============================================================
   MODAL HELPERS
   ============================================================ */

function closeModal(id) {

    const modal =
        document.getElementById(id);

    if (modal) {
        modal.classList.remove("show");
    }
}


function handleModalBackdrop(event, id) {

    if (event.target.id === id) {
        closeModal(id);
    }
}


document.addEventListener(
    "keydown",
    event => {

        if (event.key !== "Escape") {
            return;
        }

        closeModal("manageTestsModal");
        closeModal("testEditorModal");
    }
);


/* ============================================================
   LOGOUT
   ============================================================ */

function logout() {

    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_email");
    localStorage.removeItem("userId");

    localStorage.removeItem("selectedYear");
    localStorage.removeItem("selectedYearName");
    localStorage.removeItem("selectedClass");
    localStorage.removeItem("selectedSubject");
    localStorage.removeItem("selectedTerm");
}


/* ============================================================
   INITIALIZATION
   ============================================================ */

async function initMarksPage() {

    const academicLoaded =
        await loadAcademicContext();

    if (!academicLoaded) {
        return;
    }


    await loadTerms();

    await loadClasses();
}


initMarksPage();
```
