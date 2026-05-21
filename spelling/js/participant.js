async function loadParticipant(){

try{

const res=
await fetch(
"/.netlify/functions/getCompetitionState"
);

const data=
await res.json();

if(!data.state){

return;

}


let round=
data.state.round || 1;

let currentWord=
data.state.currentwordindex || 0;


document.getElementById(
"round"
).innerText=
round+"/3";


document.getElementById(
"wordNumber"
).innerText=
currentWord+1;


}
catch(error){

console.log(
error
);

}

}



// refresh every second

setInterval(

loadParticipant,

1000

);


loadParticipant();
