let totalScores={};

async function loadTimer(){

try{

const stateRes=
await fetch(
"/.netlify/functions/getCompetitionState"
);

const stateData=
await stateRes.json();


if(
!stateData.state
){

return;

}


const studentRes=
await fetch(
"/.netlify/functions/getStudentCompetition"
);

const studentData=
await studentRes.json();

const students=
studentData.students||[];


let currentStudent=

stateData.state
.currentstudent||0;


let student=

students[
currentStudent
];


if(!student){

return;

}


document.getElementById(
"studentName"
).innerText=

student.full_name;


document.getElementById(
"round"
).innerText=

(
stateData.state.round||1
)

+"/3";


document.getElementById(
"roundScore"
).innerText=

stateData.state.score||0;


// total score

let studentId=
student.id;


document.getElementById(
"totalScore"
).innerText=

totalScores[
studentId
] || 0;


// timer

document.getElementById(
"timer"
).innerText=

stateData.state.timeleft || 0;


}
catch(error){

console.log(
error
);

}

}


// auto refresh

setInterval(

loadTimer,

1000

);


loadTimer();
