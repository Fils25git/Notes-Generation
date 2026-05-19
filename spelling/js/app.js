let students=[];

let studentIndex=0;
let currentWord=0;

let score=0;

let timer=null;
let timeLeft=0;


const words=[

"Library",
"Book",
"Knowledge",

"Environment",
"Beautiful",
"Computer",

"Education",
"Dictionary",
"Friendship"

];



async function loadStudents(){

try{

const response=
await fetch(
"/.netlify/functions/spelling-getStudents"
);

const data=
await response.json();

students=
data.students;

if(students.length===0){

alert(
"No students found"
);

return;

}

showStudent();

}

catch(error){

console.log(error);

}

}


function showStudent(){

document.getElementById(
"studentName"
).innerText=
students[studentIndex]
.full_name;


document.getElementById(
"score"
).innerText=
score;


updateRound();

}



function updateRound(){

let round=
Math.floor(
currentWord/3
)+1;

document.getElementById(
"round"
).innerText=
round;

}



function calculateTime(word){

let length=
word.length;

if(length<=4){

return 8;

}

else if(length<=7){

return 12;

}

else if(length<=10){

return 15;

}

else{

return 20;

}

}



function startWord(){

clearInterval(
timer
);

if(
currentWord>=9
){

finishStudent();

return;

}

let word=
words[currentWord];

document.getElementById(
"wordDisplay"
).innerText=
word;


timeLeft=
calculateTime(word);


document.getElementById(
"timer"
).innerText=
timeLeft;


timer=
setInterval(()=>{

timeLeft--;


document.getElementById(
"timer"
).innerText=
timeLeft;


if(
timeLeft<=0
){

clearInterval(
timer
);

saveResult(
word,
0,
"time up"
);

nextWord();

}

},1000);

}



function pauseTimer(){

clearInterval(
timer
);

}



async function correctAnswer(){

clearInterval(
timer
);

score++;

document.getElementById(
"score"
).innerText=
score;


await saveResult(

words[currentWord],
1,
"correct"

);

nextWord();

}



async function wrongAnswer(){

clearInterval(
timer
);


await saveResult(

words[currentWord],
0,
"wrong"

);

nextWord();

}



function nextWord(){

currentWord++;

updateRound();

document.getElementById(
"wordDisplay"
).innerText=
"Ready";

}



async function saveResult(

word,
scoreValue,
status

){

try{

await fetch(

"/.netlify/functions/spelling-saveResult",

{

method:"POST",

headers:{

"Content-Type":
"application/json"

},

body:
JSON.stringify({

studentId:
students[studentIndex]
.id,

competitionId:1,

round:
Math.floor(
currentWord/3
)+1,

word:
word,

answer:"",

score:
scoreValue,

timeAllowed:
calculateTime(word),

timeUsed:
calculateTime(word)
-
timeLeft,

status:
status

})

}

);

}

catch(error){

console.log(
error
);

}

}



function finishStudent(){

alert(

students[
studentIndex
]
.full_name+

" scored "+

score+

"/9"

);


studentIndex++;

currentWord=0;

score=0;


if(

studentIndex>=
students.length

){

alert(

"Competition Finished"

);

return;

}


showStudent();

}


loadStudents();
