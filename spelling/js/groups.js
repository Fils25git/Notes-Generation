let groupBoxes=0;



function addGroupBox(){

groupBoxes++;

const div=document.createElement("div");

div.className="card";

div.innerHTML=`

<h3>Group ${groupBoxes}</h3>

<input placeholder="Word 1">
<input placeholder="Word 2">
<input placeholder="Word 3">
<input placeholder="Word 4">
<input placeholder="Word 5">
<input placeholder="Word 6">
<input placeholder="Word 7">
<input placeholder="Word 8">
<input placeholder="Word 9">

<button class="save"
onclick="saveGroup(this,${groupBoxes})">

Save Group

</button>

`;

document.getElementById("groups")
.appendChild(div);

}



async function saveGroup(btn,number){

const card=btn.parentElement;

const inputs=card.querySelectorAll("input");

let words=[];

inputs.forEach(i=>words.push(i.value));


await fetch(
"/.netlify/functions/createWordGroup",
{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
group_number:number,
words:words
})
}
);

alert("Group Saved!");

loadGroups();

}



async function loadGroups(){

const res=
await fetch(
"/.netlify/functions/getWordGroups"
);

const data=
await res.json();

console.log(data);

}

loadGroups();
