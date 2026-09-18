const teacherId =
Number(localStorage.getItem("userId"));

if (!teacherId) {
window.location.href = "login.html";
}

/* ====================================================
STATE
==================================================== */

let selectedSubject =
Number(localStorage.getItem("selectedSubject")) || null;

let selectedClass =
Number(localStorage.getItem("selectedClass")) || null;

let selectedTerm =
Number(localStorage.getItem("selectedTerm")) || null;

let selectedYear =
Number(localStorage.getItem("selectedYear")) || null;

/* ====================================================
API
==================================================== */

async function school(
action,
params = {},
method = "GET"
) {


const urlParams = new URLSearchParams();

urlParams.set(
    "teacher_id",
    teacherId
);


Object.entries(params).forEach(
    ([key, value]) => {

        if (
            value !== null &&
            value !== undefined &&
            value !== ""
        ) {

            urlParams.set(
                key,
                value
            );

        }

    }
);


let url =
    `/.netlify/functions/school?action=${encodeURIComponent(action)}`;

const options = {

    method,

    headers: {
        "Content-Type": "application/json"
    }

};


if (method === "GET") {

    const query =
        urlParams.toString();

    if (query) {
        url += `&${query}`;
    }

} else {

    options.body =
        JSON.stringify({
            teacher_id: teacherId,
            ...params
        });

}


const response =
    await fetch(
        url,
        options
    );


if (!response.ok) {

    throw new Error(
        `Request failed: ${response.status}`
    );

}


const data =
    await response.json();


if (data.success === false) {

    throw new Error(
        data.message ||
        "Request failed"
    );

}


return data;


}

/* ====================================================
CATEGORY
==================================================== */

function getCategory(
percentage
) {


percentage =
    Number(percentage);


if (percentage >= 80) {

    return {
        grade: "A",
        text: "Excellent"
    };

}


if (percentage >= 75) {

    return {
        grade: "B",
        text: "Very Good"
    };

}


if (percentage >= 70) {

    return {
        grade: "C",
        text: "Good"
    };

}


if (percentage >= 65) {

    return {
        grade: "D",
        text: "Fair"
    };

}


if (percentage >= 60) {

    return {
        grade: "E",
        text: "Satisfactory"
    };

}


if (percentage >= 50) {

    return {
        grade: "S",
        text: "Minimum Pass"
    };

}


return {
    grade: "F",
    text: "Fail"
};


}

/* ====================================================
ACADEMIC YEAR
==================================================== */

async function loadAcademicYear() {


const response =
    await fetch(
        "/.netlify/functions/academic?action=getCurrent"
    );


if (!response.ok) {

    throw new Error(
        "Unable to load academic year."
    );

}


const context =
    await response.json();


if (
    !context.year ||
    !Number.isInteger(
        Number(context.year.id)
    )
) {

    throw new Error(
        "No valid current academic year found."
    );

}


selectedYear =
    Number(context.year.id);


localStorage.setItem(
    "selectedYear",
    selectedYear
);


localStorage.setItem(
    "selectedYearName",
    context.year.year_name || ""
);


}

/* ====================================================
SUBJECTS
==================================================== */

async function loadSubjects() {


const data =
    await school(
        "getSubjects",
        {
            academic_year_id:
                selectedYear
        }
    );


const subjects =
    Array.isArray(data)
        ? data
        : data.subjects || [];


const container =
    document.getElementById(
        "subjectContainer"
    );


container.innerHTML = "";


if (!subjects.length) {

    selectedSubject = null;

    container.innerHTML =
        `<p class="empty-state">
            No subjects assigned.
         </p>`;

    return;

}


const savedSubject =
    subjects.find(
        s =>
            Number(s.id) ===
            Number(selectedSubject)
    );


if (savedSubject) {

    selectedSubject =
        Number(savedSubject.id);

} else {

    selectedSubject =
        Number(subjects[0].id);

    localStorage.setItem(
        "selectedSubject",
        selectedSubject
    );

}


subjects.forEach(
    subject => {

        const active =
            Number(selectedSubject) ===
            Number(subject.id);


        container.innerHTML += `

            <button
                type="button"
                class="subject-btn ${active ? "active" : ""}"
                onclick="selectSubject(${Number(subject.id)}, event)">

                ${subject.subject_name}

            </button>

        `;

    }
);

}

/* ====================================================
SELECT SUBJECT
==================================================== */

function selectSubject(
id,
event
) {


selectedSubject =
    Number(id);


localStorage.setItem(
    "selectedSubject",
    selectedSubject
);


document
    .querySelectorAll(
        ".subject-btn"
    )
    .forEach(
        button =>
            button.classList.remove(
                "active"
            )
    );


if (event?.currentTarget) {

    event.currentTarget.classList.add(
        "active"
    );

}


loadResults();


}

/* ====================================================
CLASSES
==================================================== */

async function loadClasses() {


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
        : data.classes || [];


const container =
    document.getElementById(
        "classContainer"
    );


container.innerHTML = "";


if (!classes.length) {

    selectedClass = null;

    container.innerHTML =
        `<p class="empty-state">
            No classes found.
         </p>`;

    return;

}


const savedClass =
    classes.find(
        c =>
            Number(c.id) ===
            Number(selectedClass)
    );


if (savedClass) {

    selectedClass =
        Number(savedClass.id);

} else {

    selectedClass =
        Number(classes[0].id);

    localStorage.setItem(
        "selectedClass",
        selectedClass
    );

}


classes.forEach(
    c => {

        const active =
            Number(selectedClass) ===
            Number(c.id);


        container.innerHTML += `

            <button
                type="button"
                class="class-btn ${active ? "active" : ""}"
                onclick="selectClass(${Number(c.id)}, event)">

                ${c.class_name}

            </button>

        `;

    }
);


}

/* ====================================================
SELECT CLASS
==================================================== */

function selectClass(
id,
event
) {


selectedClass =
    Number(id);


localStorage.setItem(
    "selectedClass",
    selectedClass
);


document
    .querySelectorAll(
        ".class-btn"
    )
    .forEach(
        button =>
            button.classList.remove(
                "active"
            )
    );


if (event?.currentTarget) {

    event.currentTarget.classList.add(
        "active"
    );

}


loadResults();


}

/* ====================================================
TERMS
==================================================== */

async function loadTerms() {


if (!selectedYear) {
    return;
}


const response =
    await fetch(
        `/.netlify/functions/academic?action=getTerms&academic_year_id=${encodeURIComponent(selectedYear)}`
    );


if (!response.ok) {

    throw new Error(
        "Unable to load terms."
    );

}


const result =
    await response.json();


const terms =
    Array.isArray(result)
        ? result
        : result.terms || [];


const container =
    document.getElementById(
        "termContainer"
    );


container.innerHTML = "";


if (!terms.length) {

    selectedTerm = null;

    container.innerHTML =
        `<p class="empty-state">
            No terms found.
         </p>`;

    return;

}


const savedTerm =
    terms.find(
        term =>
            Number(term.id) ===
            Number(selectedTerm)
    );


if (savedTerm) {

    selectedTerm =
        Number(savedTerm.id);

} else {

    const currentTerm =
        terms.find(
            term =>
                term.is_current === true
        );


    selectedTerm =
        Number(
            currentTerm?.id ||
            terms[0].id
        );


    localStorage.setItem(
        "selectedTerm",
        selectedTerm
    );

}


terms.forEach(
    term => {

        const active =
            Number(selectedTerm) ===
            Number(term.id);


        container.innerHTML += `

            <button
                type="button"
                class="class-btn ${active ? "active" : ""}"
                onclick="selectTerm(${Number(term.id)}, event)">

                ${term.term_name}

            </button>

        `;

    }
);


}

/* ====================================================
SELECT TERM
==================================================== */

function selectTerm(
id,
event
) {


selectedTerm =
    Number(id);


localStorage.setItem(
    "selectedTerm",
    selectedTerm
);


document
    .querySelectorAll(
        "#termContainer button"
    )
    .forEach(
        button =>
            button.classList.remove(
                "active"
            )
    );


if (event?.currentTarget) {

    event.currentTarget.classList.add(
        "active"
    );

}


loadResults();


}

/* ====================================================
LOAD RESULTS
==================================================== */

async function loadResults() {


if (
    !Number.isInteger(selectedYear) ||
    selectedYear <= 0 ||

    !Number.isInteger(selectedClass) ||
    selectedClass <= 0 ||

    !Number.isInteger(selectedSubject) ||
    selectedSubject <= 0 ||

    !Number.isInteger(selectedTerm) ||
    selectedTerm <= 0
) {

    document.getElementById(
        "resultsTable"
    ).innerHTML = `

        <tr>
            <td colspan="20"
                style="text-align:center;">
                Select a class, subject and term.
            </td>
        </tr>

    `;

    return;

}


try {

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


    const learners =
        Array.isArray(data)
            ? data
            : data.marks || data.learners || [];


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
        );


    console.log(
        "Selected year:",
        selectedYear
    );

    console.log(
        "Selected class:",
        selectedClass
    );

    console.log(
        "Selected subject:",
        selectedSubject
    );

    console.log(
        "Selected term:",
        selectedTerm
    );

    console.log(
        "Returned settings:",
        settings
    );


    const overallTestMax =
        Number(
            settings.overall_test_max
        ) || 90;


    const overallExamMax =
        Number(
            settings.overall_exam_max
        ) || 90;


    const classButton =
        document.querySelector(
            "#classContainer .class-btn.active"
        );


    const termButton =
        document.querySelector(
            "#termContainer .class-btn.active"
        );


    const subjectButton =
        document.querySelector(
            ".subject-btn.active"
        );


    const className =
        classButton?.innerText?.trim()
        || "Class";


    const termName =
        termButton?.innerText?.trim()
        || "Term";


    const subjectName =
        subjectButton?.innerText?.trim()
        || "Subject";


    document.getElementById(
        "reportTitle"
    ).innerHTML =
        `Students Marksheet for ${className} in ${termName}`;


    /* ====================================================
       HEADER
       ==================================================== */

    const header =
        document.getElementById(
            "resultsHeader"
        );


    header.innerHTML = `

        <th>#</th>

        <th>Pupil Name</th>

    `;


    let headerTotalTestsMax = 0;
    let headerExamMax = 0;


    if (learners.length) {

        const firstMarks =
            Array.isArray(
                learners[0].marks
            )
                ? learners[0].marks
                : [];


        firstMarks.forEach(
            mark => {

                const max =
                    Number(
                        mark.max_score
                    ) || 0;


                if (mark.is_exam) {

                    headerExamMax +=
                        max;

                } else {

                    headerTotalTestsMax +=
                        max;

                }


                header.innerHTML += `

                    <th>
                        ${mark.assessment_type || "Assessment"}
                        <br>
                        /${max}
                    </th>

                `;

            }
        );

    }


    const headerMaxPossible =
        headerTotalTestsMax +
        headerExamMax;


    header.innerHTML += `

        <th>
            Total Tests
            <br>
            /${headerTotalTestsMax}
        </th>

        <th>
            Overall Test
            <br>
            /${overallTestMax}
        </th>

        <th>
            Exam
            <br>
            /${headerExamMax}
        </th>

        <th>
            Overall Exam
            <br>
            /${overallExamMax}
        </th>

        <th>
            Total
            <br>
            /${overallTestMax + overallExamMax}
        </th>

        <th>%</th>

        <th>Category</th>

    `;


    /* ====================================================
       TABLE
       ==================================================== */

    const table =
        document.getElementById(
            "resultsTable"
        );


    table.innerHTML = "";


    if (!learners.length) {

        table.innerHTML = `

            <tr>

                <td
                    colspan="20"
                    style="text-align:center;">

                    No learners or marks found.

                </td>

            </tr>

        `;


        document.getElementById(
            "analysisTable"
        ).innerHTML = `

            <tr>

                <td colspan="7"
                    style="text-align:center;">

                    No results available.

                </td>

            </tr>

        `;


        return;

    }


    let classTotalPercentage = 0;

    let highest = -Infinity;

    let lowest = Infinity;

    let passed = 0;


    learners.forEach(
        (learner, index) => {

            let totalTests = 0;
            let totalTestsMax = 0;

            let totalExam = 0;
            let totalExamMax = 0;


            const marks =
                Array.isArray(
                    learner.marks
                )
                    ? learner.marks
                    : [];


            const cells =
                marks.map(
                    mark => {

                        const score =
                            Number(
                                mark.score
                            ) || 0;


                        const max =
                            Number(
                                mark.max_score
                            ) || 0;


                        if (mark.is_exam) {

                            totalExam +=
                                score;

                            totalExamMax +=
                                max;

                        } else {

                            totalTests +=
                                score;

                            totalTestsMax +=
                                max;

                        }


                        return `

                            <td>
                                ${score}
                            </td>

                        `;

                    }
                ).join("");


            /* ============================================
               NORMALIZED SCORES
               ============================================ */

            let overallTest = 0;

            if (totalTestsMax > 0) {

                overallTest =
                    (
                        totalTests /
                        totalTestsMax
                    ) *
                    overallTestMax;

            }


            let overallExam = 0;

            if (totalExamMax > 0) {

                overallExam =
                    (
                        totalExam /
                        totalExamMax
                    ) *
                    overallExamMax;

            }


            /* ============================================
               FINAL TOTAL
               ============================================ */

            const total =
                overallTest +
                overallExam;


            const maximum =
                overallTestMax +
                overallExamMax;


            let percentage = 0;


            if (maximum > 0) {

                percentage =
                    (
                        total /
                        maximum
                    ) * 100;

            }


            percentage =
                Number(
                    percentage.toFixed(1)
                );


            classTotalPercentage +=
                percentage;


            if (
                percentage >
                highest
            ) {

                highest =
                    percentage;

            }


            if (
                percentage <
                lowest
            ) {

                lowest =
                    percentage;

            }


            if (
                percentage >= 50
            ) {

                passed++;

            }


            const category =
                getCategory(
                    percentage
                );


            table.innerHTML += `

                <tr>

                    <td>
                        ${index + 1}
                    </td>

                    <td>
                        ${learner.full_name || "Unnamed"}
                    </td>

                    ${cells}

                    <td>
                        ${totalTests.toFixed(1)}
                    </td>

                    <td>
                        ${overallTest.toFixed(1)}
                    </td>

                    <td>
                        ${totalExam.toFixed(1)}
                    </td>

                    <td>
                        ${overallExam.toFixed(1)}
                    </td>

                    <td>
                        ${total.toFixed(1)}
                    </td>

                    <td>
                        ${percentage.toFixed(1)}%
                    </td>

                    <td>

                        <span class="badge">

                            ${category.grade}
                            -
                            ${category.text}

                        </span>

                    </td>

                </tr>

            `;

        }
    );


    /* ====================================================
       ANALYSIS
       ==================================================== */

    const average =
        learners.length
            ? (
                classTotalPercentage /
                learners.length
            ).toFixed(1)
            : "0.0";


    const failed =
        learners.length -
        passed;


    const passRate =
        learners.length
            ? (
                (
                    passed *
                    100
                ) /
                learners.length
            ).toFixed(1)
            : "0.0";


    if (!Number.isFinite(lowest)) {
        lowest = 0;
    }


    if (!Number.isFinite(highest)) {
        highest = 0;
    }


    document.getElementById(
        "analysisTable"
    ).innerHTML = `

        <tr>

            <td>
                ${subjectName}
            </td>

            <td>
                ${average}%
            </td>

            <td>
                ${passed}
            </td>

            <td>
                ${failed}
            </td>

            <td>
                ${lowest.toFixed(1)}%
            </td>

            <td>
                ${highest.toFixed(1)}%
            </td>

            <td>
                ${passRate}%
            </td>

        </tr>

    `;

} catch (error) {

    console.error(
        "Failed to load results:",
        error
    );


    document.getElementById(
        "resultsTable"
    ).innerHTML = `

        <tr>

            <td colspan="20"
                style="text-align:center;">

                Failed to load results.

            </td>

        </tr>

    `;

}


}

/* ====================================================
INIT
==================================================== */

async function init() {


try {

    await loadAcademicYear();

    await loadTerms();

    await loadSubjects();

    await loadClasses();

    await loadResults();

} catch (error) {

    console.error(
        "Results page initialization failed:",
        error
    );


    document.getElementById(
        "resultsTable"
    ).innerHTML = `

        <tr>

            <td colspan="20"
                style="text-align:center;">

                Failed to load results.

            </td>

        </tr>

    `;

}


}

init();

/* ====================================================
PDF
==================================================== */

function downloadPDF() {


const title =
    document.getElementById(
        "reportTitle"
    ).innerHTML;


const resultsTable =
    document.querySelector(
        ".card"
    )?.outerHTML;


const analysisTable =
    document.getElementById(
        "analysisTable"
    )
    ?.closest("table")
    ?.outerHTML;


const printWindow =
    window.open(
        "",
        "",
        "width=900,height=700"
    );


if (!printWindow) {

    alert(
        "Please allow pop-ups to download or print the results."
    );

    return;

}


printWindow.document.write(`

    <!DOCTYPE html>

    <html>

    <head>

        <title>Marks Results</title>

        <style>

            body {
                font-family: Arial, sans-serif;
                padding: 20px;
            }

            h2 {
                text-align: center;
            }

            table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 25px;
            }

            th,
            td {
                border: 1px solid #ccc;
                padding: 6px;
                text-align: center;
            }

            th {
                font-weight: bold;
            }

        </style>

    </head>

    <body>

        <h2>
            ${title}
        </h2>

        ${resultsTable || ""}

        <h2>
            Analysis
        </h2>

        ${analysisTable || ""}

    </body>

    </html>

`);


printWindow.document.close();

printWindow.focus();

printWindow.print();


}

/* ====================================================
EXCEL
==================================================== */

function exportExcel() {


const table =
    document.querySelector(
        ".card table"
    );


if (!table) {

    alert(
        "No results available to export."
    );

    return;

}


const html =
    table.outerHTML;


const blob =
    new Blob(
        [html],
        {
            type:
                "application/vnd.ms-excel"
        }
    );


const link =
    document.createElement(
        "a"
    );


link.href =
    URL.createObjectURL(
        blob
    );


link.download =
    "marks-results.xls";


document.body.appendChild(
    link
);

link.click();

document.body.removeChild(
    link
);


URL.revokeObjectURL(
    link.href
);


}

/* ====================================================
PRINT
==================================================== */

function printResults() {


downloadPDF();


}
