
// ============================================================
// MARKS SYSTEM
// ============================================================

const teacherId =
    Number(localStorage.getItem("userId"));


// ============================================================
// AUTHENTICATION
// ============================================================

if (!teacherId) {

    window.location.href = "../login.html";

}


// ============================================================
// STATE
// ============================================================

let selectedSubject =
    localStorage.getItem("selectedSubject") || null;

let selectedClass =
    localStorage.getItem("selectedClass") || null;

let selectedTerm =
    localStorage.getItem("selectedTerm") || null;

let selectedYear = null;

let editingTestId = null;

let deleteTimer = null;


// ============================================================
// API
// ============================================================

async function school(
    action,
    body = {},
    method = "GET"
) {

    try {

        const currentTeacherId =
            Number(localStorage.getItem("userId"));

        if (!currentTeacherId) {

            window.location.href = "../login.html";

            return null;

        }


        let url =
            `/.netlify/functions/school?action=${encodeURIComponent(action)}`;


        const options = {

            method,

            headers: {

                "Content-Type":
                    "application/json"

            }

        };


        if (method === "GET") {

            const params =
                new URLSearchParams({

                    ...body,

                    teacher_id:
                        currentTeacherId

                });


            url += "&" + params.toString();

        } else {

            options.body =
                JSON.stringify({

                    ...body,

                    teacher_id:
                        currentTeacherId

                });

        }


        const response =
            await fetch(url, options);


        const data =
            await response.json()
                .catch(() => null);


        if (!response.ok) {

            showToast(
                data?.message ||
                data?.error ||
                "Request failed.",
                "error"
            );

            return null;

        }


        return data;

    }

    catch (error) {

        console.error(error);

        showToast(
            "Unable to connect to the server.",
            "error"
        );

        return null;

    }

}


// ============================================================
// ACADEMIC CONTEXT
// ============================================================

async function loadAcademicContext() {

    try {

        const response =
            await fetch(
                "/.netlify/functions/academic?action=getCurrent"
            );


        const data =
            await response.json();


        if (!data.success) {

            showToast(
                data.message ||
                "Unable to load academic system.",
                "error"
            );

            return;

        }


        selectedYear =
            data.year?.id || null;


        /*
         * If the previously selected term does not exist,
         * use the current term.
         */

        if (!selectedTerm) {

            selectedTerm =
                data.term?.id || null;

            if (selectedTerm) {

                localStorage.setItem(
                    "selectedTerm",
                    selectedTerm
                );

            }

        }

    }

    catch (error) {

        console.error(error);

        showToast(
            "Unable to load academic information.",
            "error"
        );

    }

}


// ============================================================
// TERMS
// ============================================================

async function loadTerms() {

    const container =
        document.getElementById(
            "termContainer"
        );


    container.innerHTML =
        `<span class="empty-filter">
            Loading terms...
        </span>`;


    if (!selectedYear) {

        container.innerHTML =
            `<span class="empty-filter">
                No academic year selected.
            </span>`;

        return;

    }


    try {

        const response =
            await fetch(
                `/.netlify/functions/academic?action=getTerms&academic_year_id=${selectedYear}`
            );


        const data =
            await response.json();


        const terms =
            Array.isArray(data)
                ? data
                : (data.terms || []);


        container.innerHTML = "";


        if (!terms.length) {

            container.innerHTML =
                `<span class="empty-filter">
                    No terms available.
                </span>`;

            return;

        }


        /*
         * Make sure selected term belongs to this year.
         */

        const selectedStillExists =
            terms.some(
                term =>
                    Number(term.id) ===
                    Number(selectedTerm)
            );


        if (!selectedStillExists) {

            const currentTerm =
                terms.find(
                    term =>
                        term.is_current === true
                );


            selectedTerm =
                currentTerm?.id ||
                terms[0]?.id ||
                null;


            if (selectedTerm) {

                localStorage.setItem(
                    "selectedTerm",
                    selectedTerm
                );

            }

        }


        terms.forEach(term => {

            const active =
                Number(selectedTerm) ===
                Number(term.id);


            const button =
                document.createElement("button");


            button.type = "button";

            button.className =
                `class-btn ${active ? "active" : ""}`;


            button.textContent =
                term.term_name;


            button.addEventListener(
                "click",
                () => selectTerm(term.id)
            );


            container.appendChild(button);

        });

    }

    catch (error) {

        console.error(error);

        container.innerHTML =
            `<span class="empty-filter">
                Failed to load terms.
            </span>`;

    }

}


// ============================================================
// SELECT TERM
// ============================================================

async function selectTerm(id) {

    selectedTerm = id;

    localStorage.setItem(
        "selectedTerm",
        id
    );


    document
        .querySelectorAll(
            "#termContainer button"
        )
        .forEach(button =>
            button.classList.remove("active")
        );


    event?.target?.classList.add("active");


    await loadMarks();

}


// ============================================================
// CLASSES
// ============================================================

async function loadClasses() {

    const container =
        document.getElementById(
            "classContainer"
        );


    container.innerHTML =
        `<span class="empty-filter">
            Loading classes...
        </span>`;


    const data =
        await school(
            "getClasses",
            {
                academic_year_id:
                    selectedYear
            }
        );


    const classes =
        Array.isArray(data)
            ? data
            : (data?.classes || []);


    container.innerHTML = "";


    if (!classes.length) {

        selectedClass = null;
        selectedSubject = null;

        localStorage.removeItem(
            "selectedClass"
        );

        localStorage.removeItem(
            "selectedSubject"
        );


        container.innerHTML =
            `<span class="empty-filter">
                No teaching classes found for this academic year.
            </span>`;


        document.getElementById(
            "subjectContainer"
        ).innerHTML =
            `<span class="empty-filter">
                Select a class first.
            </span>`;

        return;

    }


    /*
     * Make sure selected class still exists.
     */

    const exists =
        classes.some(
            c =>
                Number(c.id) ===
                Number(selectedClass)
        );


    if (!exists) {

        selectedClass =
            classes[0].id;

        localStorage.setItem(
            "selectedClass",
            selectedClass
        );

    }


    classes.forEach(c => {

        const active =
            Number(selectedClass) ===
            Number(c.id);


        const button =
            document.createElement("button");


        button.type = "button";

        button.className =
            `class-btn ${active ? "active" : ""}`;


        button.textContent =
            c.class_name;


        button.addEventListener(
            "click",
            () => selectClass(c.id)
        );


        container.appendChild(button);

    });


    await loadSubjects();

}


// ============================================================
// SELECT CLASS
// ============================================================

async function selectClass(id) {

    selectedClass = id;

    localStorage.setItem(
        "selectedClass",
        id
    );


    document
        .querySelectorAll(
            "#classContainer button"
        )
        .forEach(button =>
            button.classList.remove("active")
        );


    const buttons =
        document.querySelectorAll(
            "#classContainer button"
        );


    buttons.forEach(button => {

        if (
            Number(button.dataset.classId) ===
            Number(id)
        ) {

            button.classList.add("active");

        }

    });


    /*
     * Re-render classes so active state is guaranteed.
     */

    await loadClasses();

    await loadMarks();

}


// ============================================================
// SUBJECTS FOR SELECTED CLASS
// ============================================================

async function loadSubjects() {

    const container =
        document.getElementById(
            "subjectContainer"
        );


    container.innerHTML =
        `<span class="empty-filter">
            Loading subjects...
        </span>`;


    if (!selectedClass || !selectedYear) {

        container.innerHTML =
            `<span class="empty-filter">
                Select a class first.
            </span>`;

        return;

    }


    const data =
        await school(
            "getSubjectsForClass",
            {
                class_id:
                    selectedClass,

                academic_year_id:
                    selectedYear
            }
        );


    const subjects =
        Array.isArray(data)
            ? data
            : (data?.subjects || []);


    container.innerHTML = "";


    if (!subjects.length) {

        selectedSubject = null;

        localStorage.removeItem(
            "selectedSubject"
        );


        container.innerHTML =
            `<span class="empty-filter">
                No subjects have been assigned to this class.
            </span>`;

        return;

    }


    const exists =
        subjects.some(
            subject =>
                Number(subject.id) ===
                Number(selectedSubject)
        );


    if (!exists) {

        selectedSubject =
            subjects[0].id;

        localStorage.setItem(
            "selectedSubject",
            selectedSubject
        );

    }


    subjects.forEach(subject => {

        const active =
            Number(selectedSubject) ===
            Number(subject.id);


        const button =
            document.createElement("button");


        button.type = "button";

        button.className =
            `subject-btn ${active ? "active" : ""}`;


        button.textContent =
            subject.subject_name;


        button.addEventListener(
            "click",
            () => selectSubject(subject.id)
        );


        container.appendChild(button);

    });

}


// ============================================================
// SELECT SUBJECT
// ============================================================

async function selectSubject(id) {

    selectedSubject = id;

    localStorage.setItem(
        "selectedSubject",
        id
    );


    document
        .querySelectorAll(
            ".subject-btn"
        )
        .forEach(button =>
            button.classList.remove("active")
        );


    const buttons =
        document.querySelectorAll(
            ".subject-btn"
        );


    const subjects =
        await school(
            "getSubjectsForClass",
            {
                class_id:
                    selectedClass,

                academic_year_id:
                    selectedYear
            }
        );


    const list =
        Array.isArray(subjects)
            ? subjects
            : (subjects?.subjects || []);


    list.forEach(subject => {

        if (
            Number(subject.id) ===
            Number(id)
        ) {

            buttons[
                list.indexOf(subject)
            ]?.classList.add("active");

        }

    });


    await loadMarks();

}


// ============================================================
// LOAD MARKS
// ============================================================

async function loadMarks() {

    if (
        !selectedYear ||
        !selectedTerm ||
        !selectedClass ||
        !selectedSubject
    ) {

        return;

    }


    const data =
        await school(
            "getMarks",
            {

                class_id:
                    selectedClass,

                subject_id:
                    selectedSubject,

                academic_year_id:
                    selectedYear,

                term_id:
                    selectedTerm

            }
        );


    if (!Array.isArray(data)) {

        return;

    }


    const settings =
        await school(
            "getGradingSettings",
            {

                subject_id:
                    selectedSubject,

                class_id:
                    selectedClass,

                academic_year_id:
                    selectedYear,

                term_id:
                    selectedTerm

            }
        ) || {};


    const overallTestMax =
        Number(
            settings.overall_test_max || 100
        );


    const overallExamMax =
        Number(
            settings.overall_exam_max || 100
        );


    renderMarksTable(
        data,
        overallTestMax,
        overallExamMax
    );

}


// ============================================================
// RENDER MARKS TABLE
// ============================================================

function renderMarksTable(
    data,
    overallTestMax,
    overallExamMax
) {

    const header =
        document.getElementById(
            "marksHeader"
        );


    const table =
        document.getElementById(
            "marksTable"
        );


    header.innerHTML = `
        <th>#</th>
        <th>Pupil Name</th>
    `;


    table.innerHTML = "";


    if (!data.length) {

        table.innerHTML = `
            <tr>
                <td colspan="2"
                    style="text-align:center;padding:30px;">
                    No learners found for this class.
                </td>
            </tr>
        `;

        return;

    }


    /*
     * TEST HEADERS
     */

    const tests =
        data[0]?.marks || [];


    let totalTestsMax = 0;

    let examMax = 0;


    tests.forEach(mark => {

        const max =
            Number(mark.max_score || 0);


        if (mark.is_exam) {

            examMax += max;

        } else {

            totalTestsMax += max;

        }


        header.innerHTML += `

            <th
                style="
                    cursor:pointer;
                    user-select:none;
                "
                onclick="
                    editManagedTest(
                        ${mark.test_id},
                        '${escapeJs(mark.assessment_type)}',
                        ${max}
                    )
                "
                title="Click to edit this test"
            >

                ${escapeHtml(mark.assessment_type)}

                <br>

                /${max}

            </th>

        `;

    });


    const headerMaxPossible =
        totalTestsMax + examMax;


    header.innerHTML += `

        <th>
            Total Tests
            <br>
            /${totalTestsMax}
        </th>

        <th
            style="cursor:pointer;"
            onclick="editOverallTest()"
            title="Edit overall test maximum"
        >
            Overall Test
            <br>
            /${overallTestMax}
        </th>

        <th>
            Exam
            <br>
            /${examMax}
        </th>

        <th
            style="cursor:pointer;"
            onclick="editOverallExam()"
            title="Edit overall exam maximum"
        >
            Overall Exam
            <br>
            /${overallExamMax}
        </th>

        <th>
            Total
            <br>
            /${headerMaxPossible}
        </th>

        <th>%</th>

    `;


    /*
     * LEARNERS
     */

    data.forEach((learner, index) => {

        let totalTests = 0;

        let totalTestsMax = 0;

        let totalExam = 0;

        let totalExamMax = 0;


        const cells =
            learner.marks
                .map(mark => {

                    const score =
                        mark.score === "" ||
                        mark.score === null ||
                        mark.score === undefined
                            ? ""
                            : Number(mark.score);


                    const max =
                        Number(
                            mark.max_score || 0
                        );


                    if (mark.is_exam) {

                        if (score !== "") {

                            totalExam += score;

                            totalExamMax += max;

                        }

                    } else {

                        if (score !== "") {

                            totalTests += score;

                            totalTestsMax += max;

                        }

                    }


                    return `

                        <td>

                            <input
                                type="number"
                                value="${score}"
                                min="0"
                                max="${max}"
                                step="0.1"

                                oninput="
                                    validateMarkInput(
                                        this,
                                        ${max}
                                    )
                                "

                                onchange="
                                    saveMark(
                                        ${learner.id},
                                        ${mark.test_id},
                                        this.value,
                                        ${max}
                                    )
                                "

                            >

                        </td>

                    `;

                })
                .join("");


        /*
         * Overall test
         */

        let overallTest = 0;


        if (totalTestsMax > 0) {

            overallTest =
                (
                    totalTests /
                    totalTestsMax
                ) *
                overallTestMax;

        }


        /*
         * Overall exam
         */

        let overallExam = 0;


        if (totalExamMax > 0) {

            overallExam =
                (
                    totalExam /
                    totalExamMax
                ) *
                overallExamMax;

        }


        const total =
            totalTests +
            totalExam;


        const maxPossible =
            totalTestsMax +
            totalExamMax;


        const percentage =
            maxPossible > 0
                ? (
                    total /
                    maxPossible
                ) * 100
                : 0;


        table.innerHTML += `

            <tr>

                <td>
                    ${index + 1}
                </td>


                <td>
                    ${escapeHtml(learner.full_name)}
                </td>


                ${cells}


                <td>
                    ${formatNumber(totalTests)}
                </td>


                <td>
                    ${formatNumber(overallTest)}
                </td>


                <td>
                    ${formatNumber(totalExam)}
                </td>


                <td>
                    ${formatNumber(overallExam)}
                </td>


                <td>
                    ${formatNumber(total)}
                </td>


                <td>
                    ${formatNumber(percentage)}%
                </td>

            </tr>

        `;

    });

}


// ============================================================
// MARK VALIDATION
// ============================================================

function validateMarkInput(
    input,
    max
) {

    const value =
        Number(input.value);


    if (
        input.value !== "" &&
        (
            value < 0 ||
            value > max
        )
    ) {

        input.style.border =
            "2px solid #dc2626";

    } else {

        input.style.border = "";

    }

}


// ============================================================
// SAVE MARK
// ============================================================

async function saveMark(
    learner_id,
    test_id,
    score,
    max_score
) {

    if (score === "") {

        return;

    }


    const numericScore =
        Number(score);


    if (
        Number.isNaN(numericScore) ||
        numericScore < 0 ||
        numericScore > Number(max_score)
    ) {

        showToast(
            `Mark must be between 0 and ${max_score}.`,
            "error"
        );

        return;

    }


    document.getElementById(
        "saveStatus"
    ).innerHTML =
        "Saving...";


    const result =
        await school(
            "saveMark",
            {

                learner_id,

                subject_id:
                    selectedSubject,

                class_id:
                    selectedClass,

                academic_year_id:
                    selectedYear,

                term_id:
                    selectedTerm,

                test_id,

                score:
                    numericScore,

                max_score:
                    Number(max_score)

            },
            "POST"
        );


    if (
        result &&
        result.success === false
    ) {

        document.getElementById(
            "saveStatus"
        ).innerHTML = "";

        return;

    }


    document.getElementById(
        "saveStatus"
    ).innerHTML =
        "✓ Saved";


    setTimeout(() => {

        document.getElementById(
            "saveStatus"
        ).innerHTML = "";

    }, 1800);

}


// ============================================================
// MANAGE TESTS MODAL
// ============================================================

async function openTestModal() {

    if (
        !selectedClass ||
        !selectedSubject ||
        !selectedYear ||
        !selectedTerm
    ) {

        showToast(
            "Please select a class, subject and term first.",
            "error"
        );

        return;

    }


    document
        .getElementById("testModal")
        .classList.add("active");


    updateTestModalSubtitle();

    closeTestForm();

    await loadTests();

}


function closeTestModal() {

    document
        .getElementById("testModal")
        .classList.remove("active");

    closeTestForm();

}


// Close when clicking outside modal

document
    .getElementById("testModal")
    ?.addEventListener(
        "click",
        event => {

            if (
                event.target.id ===
                "testModal"
            ) {

                closeTestModal();

            }

        }
    );


// Close with Escape

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            document
                .getElementById("testModal")
                ?.classList.contains("active")
        ) {

            closeTestModal();

        }

    }
);


// ============================================================
// MODAL TITLE
// ============================================================

function updateTestModalSubtitle() {

    const subtitle =
        document.getElementById(
            "testModalSubtitle"
        );


    subtitle.textContent =
        "Tests for the selected class, subject and term.";

}


// ============================================================
// LOAD TESTS
// ============================================================

async function loadTests() {

    const loading =
        document.getElementById(
            "testsLoading"
        );

    const empty =
        document.getElementById(
            "noTestsMessage"
        );

    const tableContainer =
        document.getElementById(
            "testsTableContainer"
        );

    const table =
        document.getElementById(
            "testsTable"
        );

    const count =
        document.getElementById(
            "testsCount"
        );


    loading.style.display = "block";

    empty.style.display = "none";

    tableContainer.style.display = "none";

    table.innerHTML = "";

    count.textContent =
        "Loading...";


    const data =
        await school(
            "getTests",
            {

                class_id:
                    selectedClass,

                subject_id:
                    selectedSubject,

                academic_year_id:
                    selectedYear,

                term_id:
                    selectedTerm

            }
        );


    loading.style.display = "none";


    if (!Array.isArray(data) || !data.length) {

        count.textContent =
            "0 tests";


        empty.style.display =
            "block";

        return;

    }


    count.textContent =
        `${data.length} test${data.length === 1 ? "" : "s"}`;


    tableContainer.style.display =
        "block";


    data.forEach((test, index) => {

        const type =
            test.is_exam
                ? "Exam"
                : "Test";


        const created =
            test.created_at
                ? new Date(
                    test.created_at
                ).toLocaleDateString()
                : "—";


        table.innerHTML += `

            <tr>

                <td>
                    ${index + 1}
                </td>


                <td>
                    <strong>
                        ${escapeHtml(test.test_name)}
                    </strong>
                </td>


                <td>

                    <span
                        class="
                            test-type
                            ${test.is_exam ? "exam" : ""}
                        "
                    >

                        ${type}

                    </span>

                </td>


                <td>
                    <strong>
                        /${Number(test.max_score)}
                    </strong>
                </td>


                <td>
                    ${created}
                </td>


                <td>

                    <div class="test-actions">

                        <button
                            type="button"
                            class="test-action edit"
                            onclick="
                                editManagedTest(
                                    ${test.id},
                                    '${escapeJs(test.test_name)}',
                                    ${Number(test.max_score)},
                                    ${test.is_exam ? "true" : "false"}
                                )
                            "
                        >

                            <i class="fa-solid fa-pen"></i>

                            Edit

                        </button>


                        <button
                            type="button"
                            class="test-action delete"
                            onclick="
                                deleteManagedTest(
                                    ${test.id},
                                    '${escapeJs(test.test_name)}'
                                )
                            "
                        >

                            <i class="fa-solid fa-trash"></i>

                            Delete

                        </button>

                    </div>

                </td>

            </tr>

        `;

    });

}


// ============================================================
// OPEN ADD TEST FORM
// ============================================================

function openAddTestForm() {

    editingTestId = null;


    document.getElementById(
        "testFormTitle"
    ).textContent =
        "Add New Test";


    document.getElementById(
        "saveTestButton"
    ).innerHTML =
        `<i class="fa-solid fa-check"></i>
         Create Test`;


    document.getElementById(
        "testName"
    ).value = "";


    document.getElementById(
        "testMax"
    ).value = "";


    document.getElementById(
        "isExam"
    ).checked = false;


    document
        .getElementById("testForm")
        .classList.add("active");


    document.getElementById(
        "testName"
    ).focus();

}


// ============================================================
// CLOSE TEST FORM
// ============================================================

function closeTestForm() {

    document
        .getElementById("testForm")
        .classList.remove("active");

    editingTestId = null;

}


// ============================================================
// SAVE TEST FORM
// ============================================================

async function saveTestForm() {

    const name =
        document
            .getElementById("testName")
            .value
            .trim();


    const max =
        Number(
            document
                .getElementById("testMax")
                .value
        );


    const isExam =
        document
            .getElementById("isExam")
            .checked;


    if (!name) {

        showToast(
            "Please enter the test name.",
            "error"
        );

        return;

    }


    if (
        !Number.isFinite(max) ||
        max <= 0
    ) {

        showToast(
            "Maximum marks must be greater than 0.",
            "error"
        );

        return;

    }


    let result;


    if (editingTestId) {

        result =
            await school(
                "updateTest",
                {

                    id:
                        editingTestId,

                    test_name:
                        name,

                    max_score:
                        max

                },
                "POST"
            );

    } else {

        result =
            await school(
                "addTest",
                {

                    subject_id:
                        selectedSubject,

                    class_id:
                        selectedClass,

                    academic_year_id:
                        selectedYear,

                    term_id:
                        selectedTerm,

                    test_name:
                        name,

                    max_score:
                        max,

                    is_exam:
                        isExam

                },
                "POST"
            );

    }


    if (
        !result ||
        result.success === false
    ) {

        return;

    }


    showToast(
        editingTestId
            ? "Test updated successfully."
            : "Test created successfully.",
        "success"
    );


    closeTestForm();


    await loadTests();

    await loadMarks();

}


// ============================================================
// EDIT TEST
// ============================================================

function editManagedTest(
    id,
    name,
    max,
    isExam
) {

    editingTestId = id;


    document.getElementById(
        "testFormTitle"
    ).textContent =
        "Edit Test";


    document.getElementById(
        "saveTestButton"
    ).innerHTML =
        `<i class="fa-solid fa-save"></i>
         Save Changes`;


    document.getElementById(
        "testName"
    ).value =
        name;


    document.getElementById(
        "testMax"
    ).value =
        max;


    document.getElementById(
        "isExam"
    ).checked =
        Boolean(isExam);


    document
        .getElementById("testForm")
        .classList.add("active");


    document.getElementById(
        "testName"
    ).focus();

}


// ============================================================
// DELETE TEST
// ============================================================

async function deleteManagedTest(
    id,
    testName
) {

    const confirmed =
        confirm(
            `Delete "${testName}"?\n\nAll marks recorded for this test will also be deleted.`
        );


    if (!confirmed) {

        return;

    }


    const result =
        await school(
            "deleteTest",
            {
                test_id: id
            },
            "POST"
        );


    if (
        !result ||
        result.success === false
    ) {

        return;

    }


    showToast(
        "Test deleted successfully.",
        "success"
    );


    await loadTests();

    await loadMarks();

}


// ============================================================
// OVERALL TEST
// ============================================================

async function editOverallTest() {

    const current =
        await school(
            "getGradingSettings",
            {

                subject_id:
                    selectedSubject,

                class_id:
                    selectedClass,

                academic_year_id:
                    selectedYear,

                term_id:
                    selectedTerm

            }
        );


    const value =
        prompt(
            "Set overall test maximum:",
            current?.overall_test_max || 100
        );


    if (value === null) {

        return;

    }


    const max =
        Number(value);


    if (
        !Number.isFinite(max) ||
        max <= 0
    ) {

        showToast(
            "Enter a valid maximum.",
            "error"
        );

        return;

    }


    await school(
        "saveGradingSettings",
        {

            subject_id:
                selectedSubject,

            class_id:
                selectedClass,

            academic_year_id:
                selectedYear,

            term_id:
                selectedTerm,

            overall_test_max:
                max,

            overall_exam_max:
                Number(
                    current?.overall_exam_max || 100
                )

        },
        "POST"
    );


    await loadMarks();

}


// ============================================================
// OVERALL EXAM
// ============================================================

async function editOverallExam() {

    const current =
        await school(
            "getGradingSettings",
            {

                subject_id:
                    selectedSubject,

                class_id:
                    selectedClass,

                academic_year_id:
                    selectedYear,

                term_id:
                    selectedTerm

            }
        );


    const value =
        prompt(
            "Set overall exam maximum:",
            current?.overall_exam_max || 100
        );


    if (value === null) {

        return;

    }


    const max =
        Number(value);


    if (
        !Number.isFinite(max) ||
        max <= 0
    ) {

        showToast(
            "Enter a valid maximum.",
            "error"
        );

        return;

    }


    await school(
        "saveGradingSettings",
        {

            subject_id:
                selectedSubject,

            class_id:
                selectedClass,

            academic_year_id:
                selectedYear,

            term_id:
                selectedTerm,

            overall_test_max:
                Number(
                    current?.overall_test_max || 100
                ),

            overall_exam_max:
                max

        },
        "POST"
    );


    await loadMarks();

}


// ============================================================
// SEARCH
// ============================================================

document
    .getElementById("searchInput")
    .addEventListener(
        "input",
        searchLearners
    );


function searchLearners() {

    const value =
        document
            .getElementById("searchInput")
            .value
            .toLowerCase()
            .trim();


    document
        .querySelectorAll(
            "#marksTable tr"
        )
        .forEach(row => {

            row.style.display =
                row.innerText
                    .toLowerCase()
                    .includes(value)
                    ? ""
                    : "none";

        });

}


// ============================================================
// TOAST
// ============================================================

function showToast(
    message,
    type = "success"
) {

    const container =
        document.getElementById(
            "toastContainer"
        );


    const toast =
        document.createElement("div");


    toast.className =
        `toast ${type}`;


    toast.textContent =
        message;


    container.appendChild(toast);


    setTimeout(() => {

        toast.remove();

    }, 3500);

}


// ============================================================
// HELPERS
// ============================================================

function formatNumber(value) {

    const number =
        Number(value || 0);


    return Number.isInteger(number)
        ? number
        : number.toFixed(1);

}


function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function escapeJs(value) {

    return String(value)
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r");

}


// ============================================================
// LOGOUT
// ============================================================

function logout() {

    localStorage.removeItem("isLoggedIn");

    localStorage.removeItem("auth_token");

    localStorage.removeItem("user_email");

    localStorage.removeItem("userId");

    localStorage.removeItem("selectedSubject");

    localStorage.removeItem("selectedClass");

    localStorage.removeItem("selectedTerm");

}


// ============================================================
// INITIALIZE
// ============================================================

async function init() {

    await loadAcademicContext();

    await loadTerms();

    await loadClasses();

    await loadMarks();

}


init();
