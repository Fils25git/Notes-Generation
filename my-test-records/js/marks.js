
const teacher=
JSON.parse(
localStorage.getItem("teacher")
|| "{}"
);

let selectedSubject=null;
let selectedClass=null;
let selectedTerm=null;
let selectedYear=null;


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



// LOAD CURRENT SETTINGS

async function loadAcademicContext(){

const data=
await fetch(
"/.netlify/functions/academic?action=getCurrent"
)
.then(r=>r.json());

selectedYear=
data.year?.id;

selectedTerm=
data.term?.id;

}



// TERMS

async function loadTerms(){

const data=
await fetch(
"/.netlify/functions/academic?action=getTerms"
)
.then(r=>r.json());

const container=
document.getElementById(
"termContainer"
);

container.innerHTML="";

data.forEach(term=>{

container.innerHTML+=`

<button
class="
class-btn
${term.is_current?"active":""}
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

await fetch(
"/.netlify/functions/academic?action=setTerm",
{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({
id
})

}

);

document
.querySelectorAll(
"#termContainer button"
)
.forEach(

b=>
b.classList.remove(
"active"
)

);

event.target
.classList.add(
"active"
);

loadMarks();

}



// SUBJECTS

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

data.forEach((s,i)=>{

container.innerHTML+=`

<button

class="
subject-btn
${i===0?"active":""}
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

selectedSubject=
data[0]?.id;

}



// CLASSES

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

data.forEach((c,i)=>{

container.innerHTML+=`

<button

class="
class-btn
${i===0?"active":""}
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

selectedClass=
data[0]?.id;

}



function selectSubject(
id,
event
){

selectedSubject=id;

loadMarks();

}


function selectClass(
id,
event
){

selectedClass=id;

loadMarks();

}



// ADD TEST

async function addTest(){

const test_name=

document.getElementById(
"testName"
).value;


const max_score=

document.getElementById(
"testMax"
).value;


const is_exam=

document.getElementById(
"isExam"
).checked;


await school(
"addTest",
{

subject_id:
selectedSubject,

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



// LOAD MARKS

async function loadMarks(){

if(

!selectedYear
||
!selectedTerm
||
!selectedClass
||
!selectedSubject

){

return;

}


const data=
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


const header=
document.getElementById(
"marksHeader"
);

header.innerHTML=`

<th>#</th>
<th>Name</th>

`;


if(
data.length
){

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

let total=0;

let max=0;


const cells=
learner.marks.map(
mark=>{

total+=
Number(
mark.score||0
);

max+=
Number(
mark.max_score||0
);


return`

<td>

<input

type="number"

value="
${mark.score||""}
"

max="
${mark.max_score}
"

oninput="

if(
this.value>
${mark.max_score}
){

this.style.color='red'

}

else{

this.style.color='black'

}

"

onchange="

saveMark(
${learner.id},
'${mark.assessment_type}',
this.value,
${mark.max_score}
)

"

>

</td>

`;

}
).join("");


const percent=

max?
(
(total/max)*100
).toFixed(1)
:0;


table.innerHTML+=`

<tr>

<td>${i+1}</td>

<td>${learner.full_name}</td>

${cells}

<td>${total}</td>

<td>${percent}%</td>

</tr>

`;

});

}



// SAVE

async function saveMark(
learner_id,
assessment_type,
score,
max_score
){

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

assessment_type,

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

}



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



async function init(){

await loadAcademicContext();

await loadTerms();

await loadSubjects();

await loadClasses();

await loadMarks();

}

init();
