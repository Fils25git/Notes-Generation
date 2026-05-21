let students=[];

let currentStudent=0;

let round=1;

let currentWordIndex=0;

let roundScore=0;

let totalScores={};

let timer=null;
let timeLeft=0;

let groupWords=[];

let learnerFinished=false;
let spellingStarted=false;
let usedTime=0;


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

const wrongSound=
new Audio("sounds/wrong.mp3");

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
wrongSound,
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


function toggleButtons(){

document.querySelector(".correct").disabled=
!learnerFinished;

document.querySelector(".wrong").disabled=
!learnerFinished;

document.querySelector(".skip").disabled=
!learnerFinished;

document.querySelector(".stop").disabled=
!spellingStarted;

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
data.students || [];


if(students.length===0){

alert(
"No participants found"
);

return;

}

await loadSavedState();

showStudent();

await loadGroup();

toggleButtons();

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


if(groupWords[index]){

document.getElementById(
"timer"
).innerText=
calculateTime(
groupWords[index]
);

}

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



function startWord(){

clearInterval(timer);

spellingStarted=true;

learnerFinished=false;

toggleButtons();

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


if(timeLeft<=0){

timeLeft=0;

document.getElementById(
"timer"
).innerText=
0;

clearInterval(
timer
);

playSound(
timeoutSound
);

learnerFinished=true;

spellingStarted=false;

usedTime=
calculateTime(word);

toggleButtons();

return;

}


document.getElementById(
"timer"
).innerText=
timeLeft;


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

else if(
timeLeft<=3
){

playSound(
warningSound
);

}

else{

playSound(
tickSound
);

}


await saveState();

},1000);

}



function pauseTimer(){

clearInterval(
timer
);

spellingStarted=false;

learnerFinished=true;


let word=

groupWords[
(round-1)*3+
currentWordIndex
];


usedTime=

calculateTime(word)
-
timeLeft;


toggleButtons();

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



function correct(){

clearInterval(
timer
);


let word=

groupWords[
(round-1)*3+
currentWordIndex
];


let scoreValue=

calcScore(
word,
usedTime
);


if(

usedTime<=
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


roundScore+=
scoreValue;


let studentId=
students[currentStudent]
.id;


if(
!totalScores[
studentId
]
){

totalScores[
studentId
]=0;

}


totalScores[
studentId
]+=
scoreValue;


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

playSound(
wrongSound
);

nextWord();

}



function nextWord(){

learnerFinished=false;

spellingStarted=false;

toggleButtons();

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

roundScore=0;


if(
currentStudent>=students.length
){

currentStudent=0;


if(round===3){

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


playSound(
allRoundFinishSound
);

localStorage.setItem(
"roundFinished",
"true"
);

localStorage.setItem(
"currentRound",
round
);

window.location=
"leaderboard.html";

return;

}


showStudent();

loadGroup();

saveState();

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
timeLeft,

competition_started:false,
participant_done:false

})

}

);

}


loadCompetition();
