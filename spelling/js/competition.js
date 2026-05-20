let students=[];
let currentStudent=0;

let groupWords=[];
let currentWordIndex=0;

let round=1;

let timer;
let timeLeft=0;

let score=0;



async function loadCompetition(){

const res=
await fetch(
"/.netlify/functions/getStudentCompetition"
);

const data=
await res.json();

students=data.students;

showStudent();

loadGroup();

}



async function loadGroup(){

let student=students[currentStudent];

const res=
await fetch(
"/.netlify/functions/getWordGroups"
);

const data=
await res.json();

let group=
data.groups.find(
g=>g.group_number==student.group_number
);

groupWords=group.words;

showWord();

}



function showStudent(){

document.getElementById("studentName")
.innerText=
students[currentStudent].full_name;

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

document.getElementById("word")
.innerText=word;

timeLeft=calculateTime(word);

document.getElementById("timer")
.innerText=timeLeft;

timer=setInterval(()=>{

timeLeft--;

document.getElementById("timer")
.innerText=timeLeft;

if(timeLeft<=0){

clearInterval(timer);

save(0,"timeout");

nextWord();

}

},1000);

}



function calcScore(word,used){

let allowed=calculateTime(word);

let ratio=used/allowed;

if(ratio<=0.5) return 1;
if(ratio<=0.75) return 0.75;
return 0.5;

}



async function correct(){

clearInterval(timer);

let word=groupWords[currentWordIndex];

let used=calculateTime(word)-timeLeft;

let scoreValue=calcScore(word,used);

score+=scoreValue;

document.getElementById("score")
.innerText=score;

await save(scoreValue,"correct");

nextWord();

}



async function wrong(){

clearInterval(timer);

await save(0,"wrong");

nextWord();

}



async function skip(){

clearInterval(timer);

await save(0,"skipped");

nextWord();

}



async function save(scoreValue,status){

let word=groupWords[currentWordIndex];

await fetch(
"/.netlify/functions/spellingSaveResult",
{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({

student_id:students[currentStudent].id,
group_id:students[currentStudent].group_id,
round:round,
word:word,
score:scoreValue,
status:status,
time_used:calculateTime(word)-timeLeft,
time_allowed:calculateTime(word)

})
}
);

}



function nextWord(){

currentWordIndex++;

if(currentWordIndex%3===0){

round++;
document.getElementById("round").innerText=round;

}

if(currentWordIndex>=9){

nextStudent();
return;

}

document.getElementById("word").innerText="Ready";

}



function nextStudent(){

currentStudent++;

currentWordIndex=0;
round=1;
score=0;

if(currentStudent>=students.length){

alert("Competition Finished");
return;

}

showStudent();
loadGroup();

}



loadCompetition();
