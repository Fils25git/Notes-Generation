let students=[];

let currentStudent=0;

let currentRound=1;

let currentWordInRound=0;

let currentWords=[];

let timer=null;

let timeLeft=0;

let totalScore=0;



async function loadCompetition(){

try{

const response=
await fetch(
"/.netlify/functions/getStudentCompetition"
);

const data=
await response.json();

students=
data.students;

showStudent();

loadWords();

}

catch(error){

console.log(error);

}

}



async function loadWords(){

let student=
students[currentStudent];

try{

const response=
await fetch(
"/.netlify/functions/getWordGroups"
);

const data=
await response.json();

let group=
data.groups.find(

g=>

g.group_number===
student.group_number

);

currentWords=
group.words;

showWord();

}

catch(error){

console.log(error);

}

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
currentRound;

}



function showWord(){

let index=

((currentRound-1)*3)

+

currentWordInRound;


document.getElementById(
"wordDisplay"
).innerText=
"Ready";

}


function calculateTime(word){

let length=
word.length;

if(length<=4)
return 8;

if(length<=7)
return 12;

if(length<=10)
return 15;

return 20;

}



function startWord(){

clearInterval(
timer
);

let index=

((currentRound-1)*3)

+

currentWordInRound;


let word=
currentWords[index];

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
timer);

saveAnswer(
0,
"time up"
);

nextWord();

}

},1000);

}



function calculateMark(

allowed,
used

){

let percentage=
used/allowed;


if(
percentage<=0.5
){

return 1;

}


if(
percentage<=0.75
){

return .75;

}


return .5;

}



async function correctAnswer(){

clearInterval(
timer
);

let index=

((currentRound-1)*3)

+

currentWordInRound;


let word=
currentWords[index];

let allowed=
calculateTime(word);

let used=
allowed-timeLeft;

let mark=

calculateMark(
allowed,
used
);

totalScore+=mark;


document.getElementById(
"score"
).innerText=
totalScore;


await saveAnswer(
mark,
"correct"
);

nextWord();

}



async function wrongAnswer(){

clearInterval(
timer
);

await saveAnswer(
0,
"wrong"
);

nextWord();

}



async function skipWord(){

clearInterval(
timer
);

await saveAnswer(
0,
"skipped"
);

nextWord();

}



async function saveAnswer(

score,
status

){

let index=

((currentRound-1)*3)

+

currentWordInRound;


let word=
currentWords[index];


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

studentId:
students[currentStudent]
.id,

groupNumber:
students[currentStudent]
.group_number,

round:
currentRound,

word:
word,

score:
score,

status:
status,

timeAllowed:
calculateTime(word),

timeUsed:
calculateTime(word)
-
timeLeft

})

}

);

}



function nextWord(){

currentWordInRound++;


if(
currentWordInRound>=3
){

nextStudent();

return;

}


showWord();

}



function nextStudent(){

currentStudent++;

currentWordInRound=0;


if(
currentStudent>=
students.length
){

currentStudent=0;

currentRound++;

}


if(
currentRound>3
){

alert(
"Competition Finished"
);

return;

}


showStudent();

loadWords();

}



loadCompetition();
