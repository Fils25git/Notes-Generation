let students=[];
let currentStudent=0;

let groupWords=[];

let currentWordIndex=0;

let round=1;

let timer=null;
let timeLeft=0;

let score=0;

let totalStudents=0;


// AUDIO

const tickSound=
new Audio("sounds/tick.mp3");

const halfwaySound=
new Audio("sounds/halfway.mp3");

const warningSound=
new Audio("sounds/warning.mp3");

const timeoutSound=
new Audio("sounds/timeout.mp3");

const applauseSound=
new Audio("sounds/applause.mp3");

const goodSound=
new Audio("sounds/good.mp3");

const roundFinishSound=
new Audio("sounds/round-finish.mp3");

const allRoundFinishSound=
new Audio("sounds/all-round-finish.mp3");

const competitionFinishSound=
new Audio("sounds/competition-finish.mp3");



async function loadCompetition(){

try{

const res=
await fetch(
"/.netlify/functions/getStudentCompetition"
);

const data=
await res.json();

students=data.students || [];

totalStudents=students.length;

if(totalStudents===0){

alert("No participants found");

return;

}

showStudent();

await loadGroup();

}
catch(error){

console.log(error);

alert("Failed loading competition");

}

}



async function loadGroup(){

let student=
students[currentStudent];

if(!student){

alert("No student");

return;

}

const res=
await fetch(
"/.netlify/functions/getWordGroups"
);

const data=
await res.json();

let group=
data.groups.find(

g=>g.group_number==
student.group_number

);


if(!group){

alert(

student.full_name+
" has no assigned group"

);

return;

}

groupWords=
group.words;

showWord();

}



function showStudent(){

document.getElementById(
"studentName"
).innerText=

students[currentStudent]
.full_name;


document.getElementById(
"round"
).innerText=
round;

}



function showWord(){

document.getElementById(
"word"
).innerText=
"Ready";

}



function calculateTime(word){

let len=word.length;

if(len<=4) return 8;
if(len<=7) return 12;
if(len<=10) return 15;

return 20;

}



function startWord(){

clearInterval(timer);

let word=
groupWords[currentWordIndex];

if(!word){

alert("No word available");

return;

}

document.getElementById(
"word"
).innerText=
word;

timeLeft=
calculateTime(word);

let original=
timeLeft;

let halfPlayed=false;

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


// tick
tickSound.currentTime=0;
tickSound.play();


// halfway
if(

!halfPlayed &&
timeLeft<=Math.floor(original/2)

){

halfPlayed=true;

halfwaySound.currentTime=0;
halfwaySound.play();

}


// last 3 sec
if(
timeLeft<=3 &&
timeLeft>0
){

warningSound.currentTime=0;
warningSound.play();

}


// timeout
if(timeLeft<=0){

clearInterval(timer);

timeoutSound.currentTime=0;
timeoutSound.play();

save(
0,
"timeout"
);

nextWord();

}

},1000);

}



function calcScore(word,used){

let allowed=
calculateTime(word);

let ratio=
used/allowed;

if(ratio<=0.5)
return 1;

if(ratio<=0.75)
return .75;

return .5;

}



async function correct(){

clearInterval(timer);

let word=
groupWords[currentWordIndex];

let used=
calculateTime(word)
-timeLeft;

let scoreValue=
calcScore(
word,
used
);


// applause if under half
if(
used<=
calculateTime(word)/2
){

applauseSound.play();

}

else{

goodSound.play();

}


score+=scoreValue;

document.getElementById(
"score"
).innerText=
score;

await save(
scoreValue,
"correct"
);

nextWord();

}



async function wrong(){

clearInterval(timer);

await save(
0,
"wrong"
);

nextWord();

}



async function skip(){

clearInterval(timer);

await save(
0,
"skipped"
);

nextWord();

}



async function save(

scoreValue,
status

){

let word=
groupWords[currentWordIndex];

await fetch(

"/.netlify/functions/spellingSaveResult",

{

method:"POST",

headers:{
"Content-Type":
"application/json"
},

body:
JSON.stringify({

student_id:
students[currentStudent].id,

group_id:
students[currentStudent].group_id,

round:
round,

word:
word,

score:
scoreValue,

status:
status,

time_used:
calculateTime(word)
-timeLeft,

time_allowed:
calculateTime(word)

})

}

);

}



function nextWord(){

currentWordIndex++;


// every 3 words student finishes
if(currentWordIndex>=3){

roundFinishSound.play();

alert(

students[currentStudent]
.full_name+

" finished Round "+

round

);

nextStudent();

return;

}

document.getElementById(
"word"
).innerText=
"Ready";

}



function nextStudent(){

currentStudent++;

currentWordIndex=0;


if(currentStudent>=students.length){

currentStudent=0;

round++;


// all students finished one round
allRoundFinishSound.play();

alert(

"All students completed Round "+

(round-1)

);


if(round>3){

competitionFinishSound.play();

alert(
"Competition Finished"
);

return;

}

}


showStudent();

loadGroup();

}



loadCompetition();
