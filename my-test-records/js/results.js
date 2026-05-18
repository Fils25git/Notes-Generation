const teacher=
JSON.parse(
localStorage.getItem("teacher")
|| "{}"
);

let selectedSubject=
localStorage.getItem(
"selectedSubject"
);

let selectedClass=
localStorage.getItem(
"selectedClass"
);

let selectedTerm=
localStorage.getItem(
"selectedTerm"
);

let selectedYear=null;


// =====================
// API
// =====================

async function school(
action,
body={},
method="GET"
){

let url=
`/.netlify/functions/school?action=${action}`;

const options={

method,

headers:{
"Content-Type":"application/json"
}

};

if(method==="GET"){

const params=
new URLSearchParams(
body
).toString();

if(params){

url+="&"+params;

}

}else{

options.body=
JSON.stringify(body);

}

const response=
await fetch(
url,
options
);

return await response.json();

}



// =====================
// CATEGORY
// =====================

function getCategory(
percentage
){

percentage=
Number(
percentage
);

if(
percentage>=80
){

return{
grade:"A",
text:"Excellent"
};

}

if(
percentage>=75
){

return{
grade:"B",
text:"Very Good"
};

}

if(
percentage>=70
){

return{
grade:"C",
text:"Good"
};

}

if(
percentage>=65
){

return{
grade:"D",
text:"Fair"
};

}

if(
percentage>=60
){

return{
grade:"E",
text:"Satisfactory"
};

}

if(
percentage>=50
){

return{
grade:"S",
text:"Minimum Pass"
};

}

return{

grade:"F",
text:"Fail"

};

}

// =====================
// SUBJECTS
// =====================

async function loadSubjects(){

const data=
await school(
"getSubjects"
);

const container=
document.getElementById(
"subjectContainer"
);

container.innerHTML="";

if(!selectedSubject){

selectedSubject=
data[0]?.id;

}

data.forEach(s=>{

const active=
Number(selectedSubject)
===
s.id;

container.innerHTML+=`

<button
class="
subject-btn
${active?"active":""}
"
onclick="
selectSubject(
${s.id},
event
)
"
>

${s.subject_name}

</button>

`;

});

}


function selectSubject(
id,
event
){

selectedSubject=id;

localStorage.setItem(
"selectedSubject",
id
);

document
.querySelectorAll(
".subject-btn"
)
.forEach(
x=>
x.classList.remove(
"active"
)
);

event.target
.classList.add(
"active"
);

loadResults();

}



// =====================
// CLASSES
// =====================

async function loadClasses(){

const data=
await school(
"getClasses"
);

const container=
document.getElementById(
"classContainer"
);

container.innerHTML="";

if(!selectedClass){

selectedClass=
data[0]?.id;

}

data.forEach(c=>{

const active=
Number(selectedClass)
===
c.id;

container.innerHTML+=`

<button
class="
class-btn
${active?"active":""}
"
onclick="
selectClass(
${c.id},
event
)
"
>

${c.class_name}

</button>

`;

});

}


function selectClass(
id,
event
){

selectedClass=id;

localStorage.setItem(
"selectedClass",
id
);

document
.querySelectorAll(
".class-btn"
)
.forEach(
x=>
x.classList.remove(
"active"
)
);

event.target
.classList.add(
"active"
);

loadResults();

}



// =====================
// TERMS
// =====================

async function loadTerms(){

const data=
await fetch(
"/.netlify/functions/academic?action=getTerms"
)
.then(
r=>r.json()
);

const container=
document.getElementById(
"termContainer"
);

container.innerHTML="";

data.forEach(term=>{

const active=
Number(selectedTerm)
===
term.id;

container.innerHTML+=`

<button
class="
class-btn
${active?"active":""}
"
onclick="
selectTerm(
${term.id},
event
)
"
>

${term.term_name}

</button>

`;

});

}


function selectTerm(
id,
event
){

selectedTerm=id;

localStorage.setItem(
"selectedTerm",
id
);

document
.querySelectorAll(
"#termContainer button"
)
.forEach(
x=>
x.classList.remove(
"active"
)
);

event.target
.classList.add(
"active"
);

loadResults();

}

// =====================
// LOAD RESULTS
// =====================

async function loadResults(){

const data=
await school(
"getMarks",
{

class_id:selectedClass,

subject_id:selectedSubject,

academic_year_id:selectedYear,

term_id:selectedTerm

}
);


const settings=
await school(
"getGradingSettings",
{

subject_id:selectedSubject,

class_id:selectedClass,

academic_year_id:selectedYear,

term_id:selectedTerm

}
);


const overallTestMax=
Number(
settings.overall_test_max||100
);

const overallExamMax=
Number(
settings.overall_exam_max||100
);

const className=

document
.querySelector(
".class-btn.active"
)
?.innerText

||
"Class";


const termName=

document
.querySelector(
"#termContainer .active"
)
?.innerText

||
"Term";


document
.getElementById(
"reportTitle"
)
.innerHTML=

`Students Marksheet for ${className} in ${termName}`;

// HEADER

const header=
document.getElementById(
"resultsHeader"
);

header.innerHTML=`

<th>#</th>

<th>Pupil Name</th>

`;


if(data.length){

data[0].marks.forEach(
m=>{

header.innerHTML+=`

<th>

${m.assessment_type}

<br>

/${m.max_score}

</th>

`;

});

}


header.innerHTML+=`

<th>Total Tests</th>

<th>Overall Test</th>

<th>Exam</th>

<th>Overall Exam</th>

<th>Total</th>

<th>%</th>

<th>Category</th>

`;




// TABLE

const table=
document.getElementById(
"resultsTable"
);

table.innerHTML="";

let classTotal=0;

let highest=0;

let lowest=100;

let passed=0;
  
data.forEach(
(learner,i)=>{

let totalTests=0;
let totalTestsMax=0;

let totalExam=0;
let totalExamMax=0;


const cells=
learner.marks.map(
mark=>{

const score=
Number(
mark.score||0
);

const max=
Number(
mark.max_score||0
);

if(mark.is_exam){

totalExam+=score;
totalExamMax+=max;

}else{

totalTests+=score;
totalTestsMax+=max;

}

return`

<td>

${score}

</td>

`;

}).join("");



let overallTest=0;

if(
totalTestsMax>0
){

overallTest=

(
totalTests/
totalTestsMax
)
*
overallTestMax;

}


let overallExam=0;

if(
totalExamMax>0
){

overallExam=

(
totalExam/
totalExamMax
)
*
overallExamMax;

}


const total=

Number(
overallTest
)
+
Number(
overallExam
);


const percentage=

(
(
total*100
)
/
(
overallTestMax+
overallExamMax
)

).toFixed(1);

classTotal+=
Number(
percentage
);


if(
Number(percentage)>
highest
){

highest=
Number(
percentage
);

}


if(
Number(percentage)<
lowest
){

lowest=
Number(
percentage
);

}


if(
Number(percentage)>=50
){

passed++;

  }

const category=
getCategory(
percentage
);


table.innerHTML+=`

<tr>

<td>${i+1}</td>

<td>${learner.full_name}</td>

${cells}

<td>${totalTests}</td>

<td>${overallTest.toFixed(1)}</td>

<td>${totalExam}</td>

<td>${overallExam.toFixed(1)}</td>

<td>${total.toFixed(1)}</td>

<td>${percentage}%</td>

<td>

<span class="badge">

${category.grade}

-

${category.text}

</span>

</td>

</tr>

`;

});
  const average=

data.length

?

(
classTotal/
data.length
).toFixed(1)

:0;

let failed=

data.length-passed;


let passRate=

data.length

?

(
(
passed*100
)
/
data.length
).toFixed(1)

:0;


const subjectName=

document
.querySelector(
".subject-btn.active"
)
?.innerText

||
"Unknown";


document
.getElementById(
"analysisTable"
)
.innerHTML=`

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

${lowest}%

</td>

<td>

${highest}%

</td>

<td>

${passRate}%

</td>

</tr>

`;

}



// =====================
// INIT
// =====================

async function init(){

const context=
await fetch(
"/.netlify/functions/academic?action=getCurrent"
)
.then(
r=>r.json()
);

selectedYear=
context.year?.id;

await loadTerms();

await loadSubjects();

await loadClasses();

await loadResults();

}

init();

// =====================
// PDF
// =====================

function downloadPDF(){

const content=`

<h2>

${document.getElementById(
"reportTitle"
).innerHTML}

</h2>

${document.querySelector(
".card"
).outerHTML}

<h2>

Analysis

</h2>

${document.getElementById(
"analysisTable"
).closest("table")
.outerHTML}

`;

const printWindow=
window.open(
"",
"",
"width=900,height=700"
);

printWindow.document.write(
content
);

printWindow.document.close();

printWindow.print();

}



// =====================
// EXCEL
// =====================

function exportExcel(){

let table=
document.querySelector(
"table"
);

let html=
table.outerHTML;

let blob=
new Blob(
[html],
{
type:
"application/vnd.ms-excel"
}
);

let link=
document.createElement(
"a"
);

link.href=
URL.createObjectURL(
blob
);

link.download=
"results.xls";

link.click();

}



// =====================
// PRINT
// =====================

function printResults(){

downloadPDF();

}
