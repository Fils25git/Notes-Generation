async function loadStudents(){

try{

const response=
await fetch(
"/.netlify/functions/spellingGetStudents"
);

const data=
await response.json();

let html=
`<option value="">Select Student</option>`;

data.students.forEach(student=>{

html+=`

<option value="${student.id}">

${student.full_name}

</option>

`;

});

document.getElementById(
"student"
).innerHTML=
html;

}

catch(error){

console.log(error);

}

}



async function saveDraw(){

let studentId=
document.getElementById(
"student"
).value;

let groupNumber=
document.getElementById(
"drawNumber"
).value;

let drawOrder=
document.getElementById(
"drawOrder"
).value;


if(

!studentId ||
!groupNumber ||
!drawOrder

){

alert(
"Fill all fields"
);

return;

}


const response=
await fetch(

"/.netlify/functions/assignDraw",

{

method:"POST",

headers:{

"Content-Type":
"application/json"

},

body:
JSON.stringify({

student_id:
studentId,

group_number:
groupNumber,

draw_order:
drawOrder

})

}

);

const data=
await response.json();

if(data.success){

alert(
"Draw assigned"
);

}

else{

alert(
data.error
);

}

}

loadStudents();
