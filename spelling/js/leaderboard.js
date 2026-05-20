async function load(){

const res=
await fetch(
"/.netlify/functions/spellingLeaderboard"
);

const data=
await res.json();

let html="";

data.leaderboard.forEach((s,i)=>{

let cls="";

if(i===0) cls="top1";
if(i===1) cls="top2";
if(i===2) cls="top3";

html+=`
<tr class="${cls}">

<td>${i+1}</td>
<td>${s.full_name}</td>
<td>${s.class_name}</td>
<td>${s.total_score}</td>

</tr>
`;

});

document.getElementById("list")
.innerHTML=html;

}

load();
