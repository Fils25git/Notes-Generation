let students=[];

let currentStudent=0;

let round=1;

let currentWordIndex=0;

let roundScore=0;

let totalScores={};

let timer=null;
let timeLeft=0;

let groupWords=[];


/* SOUNDS */

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


const allSounds=[

tickSound,
halfwaySound,
warningSound,
timeoutSound,
applauseSound,
goodSound,
roundFinishSound,
allRoundFinishSound,
competitionFinishSound

];


function playSound(sound){

allSounds.forEach(s=>{

s.pause();
s.currentTime=0;

});

sound.play();

}



async function loadCompetition(){

try{

const res=
await fetch(
"/.netlify/functions/getStudentCompetition"
);

const data=
await res.json();

students=
data.students||[];


if(students.length===0){

alert(
"No participants found"
);

return;

}

await loadSavedState();

showStudent();

await loadGroup();

}
catch(error){

console.log(error);

}

}



async function loadGroup(){

let student=
students[currentStudent];

const res=
await fetch(
"/.netlify/functions/getWordGroups"
);

const data=
await res.json();

let group=
data.groups.find(

g=>

g.group_number==
student.group_number

);


if(!group){

alert(
"Group not found"
);

return;

}


groupWords=
group.words;

showWord();

}



function showStudent(){

let studentId=
students[currentStudent]
.id;


document.getElementById(
"studentName"
).innerText=

students[currentStudent]
.full_name;


document.getElementById(
"round"
).innerText=
round+"/3";


document.getElementById(
"roundScore"
).innerText=
roundScore;


document.getElementById(
"totalScore"
).innerText=

totalScores[
studentId
] || 0;

}



function showWord(){

let index=

(round-1)*3+
currentWordIndex;


document.getElementById(
"word"
).innerText=

groupWords[index]
||
"Finished";

}



function calculateTime(word){

let len=
word.length;

if(len<=4)
return 8;

if(len<=7)
return 12;

if(len<=10)
return 15;

return 20;

}



async function startWord(){

clearInterval(timer);

let word=

groupWords[
(round-1)*3+
currentWordIndex
];


if(!word){

return;

}


timeLeft=
calculateTime(word);


document.getElementById(
"timer"
).innerText=
timeLeft;


timer=
setInterval(async()=>{

timeLeft--;


document.getElementById(
"timer"
).innerText=
timeLeft;


// tick

playSound(
tickSound
);


// halfway warning

if(

timeLeft===

Math.floor(
calculateTime(word)/2
)

){

playSound(
halfwaySound
);

}


// final warning

if(
timeLeft<=3 &&
timeLeft>0
){

playSound(
warningSound
);

}


await saveState();


if(timeLeft<=0){

clearInterval(
timer
);

playSound(
timeoutSound
);

wrong();

}

},1000);

}



function pauseTimer(){

clearInterval(
timer
);

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

clearInterval(
timer
);


let word=

groupWords[
(round-1)*3+
currentWordIndex
];


let used=

calculateTime(word)
-
timeLeft;


let scoreValue=

calcScore(
word,
used
);


if(

used<=
calculateTime(word)/2

){

playSound(
applauseSound
);

}
else{

playSound(
goodSound
);

}


// round score

roundScore+=scoreValue;


// total score

let studentId=

students[currentStudent]
.id;


if(
!totalScores[studentId]
){

totalScores[
studentId
]=0;

}


totalScores[
studentId
]+=scoreValue;


document.getElementById(
"roundScore"
).innerText=
roundScore;


document.getElementById(
"totalScore"
).innerText=

totalScores[
studentId
];


nextWord();

}



function wrong(){

clearInterval(
timer
);

nextWord();

}



function nextWord(){

currentWordIndex++;


if(
currentWordIndex>=3
){

playSound(
roundFinishSound
);


alert(

students[
currentStudent
]
.full_name+

" finished round"

);


nextStudent();

return;

}


showWord();

saveState();

}



function nextStudent(){

currentStudent++;

currentWordIndex=0;


// reset current round score only

roundScore=0;


if(
currentStudent>=
students.length
){

currentStudent=0;

round++;


playSound(
allRoundFinishSound
);


alert(

"Round "+

(round-1)+

" completed"

);


if(round>3){

playSound(
competitionFinishSound
);


localStorage.setItem(

"finalScores",

JSON.stringify(
totalScores
)

);


window.location=
"leaderboard.html";

return;

}

}


showStudent();

loadGroup();

saveState();

}



function resetParticipant(){

currentWordIndex=0;

roundScore=0;

showStudent();

showWord();

saveState();

}



function resetRound(){

currentStudent=0;

currentWordIndex=0;

roundScore=0;

showStudent();

showWord();

saveState();

}



async function resetCompetition(){

if(

!confirm(
"Reset competition?"
)

){

return;

}


localStorage.removeItem(
"finalScores"
);


await fetch(

"/.netlify/functions/resetCompetition"
);

location.reload();

}



async function saveState(){

await fetch(

"/.netlify/functions/saveCompetitionState",

{

method:"POST",

headers:{

"Content-Type":
"application/json"

},

body:
JSON.stringify({

currentStudent,
currentWordIndex,
round,
score:roundScore,
timeLeft

})

}

);

}



async function loadSavedState(){

try{

const res=
await fetch(

"/.netlify/functions/getCompetitionState"

);

const data=
await res.json();


if(data.state){

currentStudent=
data.state.currentstudent;

currentWordIndex=
data.state.currentwordindex;

round=
data.state.round;

roundScore=
data.state.score;

timeLeft=
data.state.timeleft;

}

}
catch(error){

console.log(error);

}

}


loadCompetition();
