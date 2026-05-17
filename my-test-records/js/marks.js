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


// ======================
// DEBUG
// ======================

function debug(message){

console.log(message);

const box=
document.getElementById(
"debugBox"
);

if(box){

box.innerHTML+=
message+"<br>";

box.scrollTop=
box.scrollHeight;

}

}



// ======================
// API
// ======================

async function school(
action,
body={},
method="GET"
){

try{

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

}
else{

options.body=
JSON.stringify(
body
);

}


const response=
await fetch(
url,
options
);

return await response.json();

}
catch(error){

debug(
error.message
);

return[];

}

}



// ======================
// CURRENT SETTINGS
// ======================

async function loadAcademicContext(){

const data=
await fetch(
"/.netlify/functions/academic?action=getCurrent"
)
.then(
r=>r.json()
);

selectedYear=
data.year?.id;


if(
!selectedTerm
){

selectedTerm=
data.term?.id;

localStorage.setItem(
"selectedTerm",
selectedTerm
);

}

}



// ======================
// TERMS
// ======================

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



async function selectTerm(
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

loadMarks();

}



// ======================
// SUBJECTS
// ======================

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


if(
!selectedSubject
){

selectedSubject=
data[0]?.id;

localStorage.setItem(
"selectedSubject",
selectedSubject
);

}


data.forEach(s=>{

const active=
Number(
selectedSubject
)
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

loadMarks();

}



// ======================
// CLASSES
// ======================

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


if(
!selectedClass
){

selectedClass=
data[0]?.id;

localStorage.setItem(
"selectedClass",
selectedClass
);

}


data.forEach(c=>{

const active=
Number(
selectedClass
)
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

loadMarks();

}

// ======================
// LOAD MARKS
// ======================

async function loadMarks(){

if(
!selectedYear||
!selectedTerm||
!selectedClass||
!selectedSubject
){
return;
}


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



const header=
document.getElementById(
"marksHeader"
);

header.innerHTML=`

<th>#</th>
<th>Pupil Name</th>

`;


if(data.length){

data[0].marks.forEach(
m=>{

header.innerHTML+=`

<th
style="
cursor:pointer
"

onclick="
editTest(
${m.test_id},
'${m.assessment_type}',
${m.max_score}
)
"
>

${m.assessment_type}

<br>

/${m.max_score}

</th>

`;

});

}



header.innerHTML+=`

<th>Total Tests</th>

<th
style="
cursor:pointer
"

onclick="
editOverallTest()
"
>

Overall Test
<br>
/${overallTestMax}

</th>

<th>Exam</th>

<th
style="
cursor:pointer
"

onclick="
editOverallExam()
"
>

Overall Exam
<br>
/${overallExamMax}

</th>

<th>Total</th>

<th>%</th>

`;



const table=
document.getElementById(
"marksTable"
);

table.innerHTML="";



data.forEach(
(learner,i)=>{


let totalTests=0;
let totalTestsMax=0;

let exam=0;
let examMax=0;



const cells=
learner.marks
.map(
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

exam+=score;
examMax+=max;

}else{

totalTests+=score;
totalTestsMax+=max;

}
  debug(
"Test: "+
mark.assessment_type+
" | Score: "+score+
" | Max: "+max+
" | IsExam: "+mark.is_exam
);


return`

<td>

<input
type="number"

value="${
score||""
}"

max="${max}"

oninput="

if(
Number(this.value)>
${max}
){

this.style.border=
'2px solid red';

}
else{

this.style.border='';

}

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

}
).join("");





// ===================
// REAL CALCULATIONS
// ===================
  debug(
"totalTests: " +
totalTests
);

debug(
"totalTestsMax: " +
totalTestsMax
);

debug(
"exam: " +
exam
);

debug(
"examMax: " +
examMax
);

debug(
"overallTestMax: " +
overallTestMax
);

debug(
"overallExamMax: " +
overallExamMax
);
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
examMax>0
){

overallExam=

(
exam/
examMax
)
*
overallExamMax;

}


overallTest=
overallTest.toFixed(1);

overallExam=
overallExam.toFixed(1);


const total=

(
Number(overallTest)
+
Number(overallExam)
).toFixed(1);


const maxPossible=

Number(overallTestMax)
+
Number(overallExamMax);


const percentage=

maxPossible>0

?

(
(
total*100
)
/
maxPossible
).toFixed(1)

:0;


table.innerHTML+=`

<tr>

<td>${i+1}</td>

<td>${learner.full_name}</td>

${cells}

<td>${totalTests}</td>

<td>${overallTest}</td>

<td>${exam}</td>

<td>${overallExam}</td>

<td>${total}</td>

<td>${percentage}%</td>

</tr>

`;

});

}

// ======================
// ADD TEST
// ======================

async function addTest(){

const test_name=
document.getElementById(
"testName"
).value.trim();

const max_score=
document.getElementById(
"testMax"
).value;

const is_exam=
document.getElementById(
"isExam"
).checked;


if(
!test_name
||
!max_score
){

alert(
"Fill all fields"
);

return;

}


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

test_name,
max_score,
is_exam

},
"POST"
);


closeTestModal();

loadMarks();

}





// ======================
// SAVE MARK
// ======================

async function saveMark(
learner_id,
test_id,
score,
max_score
){

if(
score===""
){
return;
}


document
.getElementById(
"saveStatus"
)
.innerHTML=
"Saving...";


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

teacher_id:
teacher.id,

test_id,

score,

max_score

},
"POST"
);


document
.getElementById(
"saveStatus"
)
.innerHTML=
"✓ Saved";


setTimeout(()=>{

document
.getElementById(
"saveStatus"
)
.innerHTML="";

},2000);

}



// ======================
// EDIT TEST
// ======================

async function editTest(
id,
name,
max
){

const test_name=
prompt(
"Edit test name",
name
);

if(
!test_name
){
return;
}

const max_score=
prompt(
"Edit max score",
max
);

if(
!max_score
){
return;
}


await school(
"updateTest",
{

id,
test_name,
max_score

},
"POST"
);

loadMarks();

}

// ======================
// EDIT OVERALL TEST
// ======================

async function editOverallTest(){

const value=
prompt(
"Set overall test maximum"
);

if(!value)return;


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


await school(
"saveGradingSettings",
{

subject_id:selectedSubject,
class_id:selectedClass,
academic_year_id:selectedYear,
term_id:selectedTerm,

overall_test_max:value,

overall_exam_max:
settings.overall_exam_max||100

},
"POST"
);

loadMarks();

}



// ======================
// EDIT OVERALL EXAM
// ======================

async function editOverallExam(){

const value=
prompt(
"Set overall exam maximum"
);

if(!value)return;


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


await school(
"saveGradingSettings",
{

subject_id:selectedSubject,
class_id:selectedClass,
academic_year_id:selectedYear,
term_id:selectedTerm,

overall_test_max:
settings.overall_test_max||100,

overall_exam_max:value

},
"POST"
);

loadMarks();

  }

// ======================
// SEARCH
// ======================

document
.getElementById(
"searchInput"
)
.addEventListener(
"input",
searchLearners
);


function searchLearners(){

const value=
document
.getElementById(
"searchInput"
)
.value
.toLowerCase();


document
.querySelectorAll(
"#marksTable tr"
)
.forEach(
row=>{

row.style.display=
row.innerText
.toLowerCase()
.includes(value)
?
""
:
"none";

});

}



// ======================
// MODAL
// ======================

function openTestModal(){

document
.getElementById(
"testModal"
)
.classList.add(
"active"
);

}


function closeTestModal(){

document
.getElementById(
"testModal"
)
.classList.remove(
"active"
);

}



// ======================
// INIT
// ======================

async function init(){

await loadAcademicContext();

await loadTerms();

await loadSubjects();

await loadClasses();

await loadMarks();

}

init();
