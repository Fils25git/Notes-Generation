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


document.getElementById(
"round"
).innerText=
(data.state.round||1)+"/3";


document.getElementById(
"wordNumber"
).innerText=
(data.state.currentwordindex||0)+1;


}
catch(error){

console.log(error);

}

}



async function startParticipant(){

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

competition_started:true

})

}

);

}



async function doneParticipant(){

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

participant_done:true

})

}

);

}


setInterval(

loadParticipant,

1000

);


loadParticipant();
