let students=[];

let currentStudent=0;

let round=1;

let currentWordIndex=0;

let roundScore=0;

let totalScores={};

let timer=null;
let timeLeft=0;

let groupWords=[];
let started=false;

let learnerFinished=false;

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
function updateButtons(){

document.querySelector(".correct").disabled=
!learnerFinished;

document.querySelector(".wrong").disabled=
!learnerFinished;

document.querySelector(".skip").disabled=
!learnerFinished;

document.querySelector(".stop").disabled=
!started;

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
  updateButtons();

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

started=true;

learnerFinished=false;

updateButtons();


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
  saveState();


timer=
setInterval(async()=>{

timeLeft--;


if(timeLeft<=0){

timeLeft=0;

clearInterval(timer);

playSound(
timeoutSound
);

learnerFinished=true;

started=false;

usedTime=
calculateTime(word);

updateButtons();
  
wrong();

return;

}


document.getElementById(
"timer"
).innerText=
timeLeft;


await saveState();

},1000);

}

function pauseTimer(){

clearInterval(
timer
);

started=false;

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

updateButtons();

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


let used=
usedTime;

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


roundScore=
Number(roundScore)+
Number(scoreValue);


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
]=0.0;

}


totalScores[
studentId
]=
Number(
totalScores[studentId]
)+
Number(scoreValue);


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


saveState();
nextWord();

}



function wrong(){

clearInterval(timer);

playSound(
wrongSound
);

saveState();

nextWord();

}



function nextWord(){

learnerFinished=false;

started=false;

updateButtons();

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

timeLeft=0;

usedTime=0;

saveState();

updateButtons();

}



function nextStudent(){

currentStudent++;

currentWordIndex=0;

roundScore=0;


if(
currentStudent>=students.length
){

currentStudent=0;


// end competition

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


// round complete

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


learnerFinished=false;

started=false;

timeLeft=0;

usedTime=0;

updateButtons();

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


localStorage.clear();


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
timeLeft,

competition_started:false,
participant_done:false

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
data.state.currentstudent || 0;

currentWordIndex=
data.state.currentwordindex || 0;

round=
data.state.round || 1;

roundScore=
data.state.score || 0;

timeLeft=
data.state.timeleft || 0;


/* PARTICIPANT SCREEN SIGNALS */

if(
data.state.competition_started
){

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

competition_started:false

})

}

);

startWord();

}



if(
data.state.participant_done
){

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

participant_done:false

})

}

);

pauseTimer();

}

}

}
catch(error){

console.log(error);

}

  }
setInterval(

loadSavedState,

1000

);

window.onload=()=>{

updateButtons();
};

loadCompetition();
