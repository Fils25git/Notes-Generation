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

loadResults();

}

init();
