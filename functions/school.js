const db=require("./db");

exports.handler=async(event)=>{

try{

const action=
event.queryStringParameters?.action;



// ===================================
// GET SUBJECTS
// ===================================

if(action==="getSubjects"){

const result=
await db.query(`
SELECT *
FROM subjects
ORDER BY id
`);

return{

statusCode:200,

body:JSON.stringify(
result.rows
)

};

}



// ===================================
// GET CLASSES
// ===================================

if(action==="getClasses"){

const result=
await db.query(`
SELECT *
FROM classes
ORDER BY id
`);

return{

statusCode:200,

body:JSON.stringify(
result.rows
)

};

}



// ===================================
// ADD TEST
// ===================================

// ===================================
// ADD TEST
// ===================================

if(action==="addTest"){

console.log("ADD TEST REQUEST RECEIVED");

const body=
JSON.parse(event.body);

console.log(
"BODY:",
JSON.stringify(body,null,2)
);

const{

subject_id,
academic_year_id,
term_id,
test_name,
max_score,
is_exam

}=body;


if(
!subject_id ||
!academic_year_id ||
!term_id ||
!test_name ||
!max_score
){

console.log("MISSING DATA");

return{

statusCode:400,

body:JSON.stringify({

message:"Missing required fields"

})

};

}


console.log("INSERTING TEST...");

const result=
await db.query(

`
INSERT INTO marks(

learner_id,
subject_id,
class_id,
academic_year_id,
term_id,
teacher_id,
assessment_type,
score,
max_score,
is_exam

)

VALUES(

NULL,
$1,
NULL,
$2,
$3,
NULL,
$4,
0,
$5,
$6

)

RETURNING *
`,
[
subject_id,
academic_year_id,
term_id,
test_name,
max_score,
is_exam || false
]

);

console.log(
"CREATED:",
JSON.stringify(
result.rows[0],
null,
2
)
);

return{

statusCode:200,

body:JSON.stringify({

message:"Test added",
data:result.rows[0]

})

};

}

// ===================================
// GET MARKS
// ===================================

if(action==="getMarks"){

const{

class_id,
subject_id,
academic_year_id,
term_id

}
=
event.queryStringParameters;



const learners=
await db.query(

`
SELECT *
FROM learners
WHERE class_id=$1
AND academic_year_id=$2
ORDER BY full_name
`,
[
class_id,
academic_year_id
]

);




// GET ALL TESTS

const tests=
await db.query(

`
SELECT DISTINCT

assessment_type,
max_score,
is_exam

FROM marks

WHERE subject_id=$1
AND academic_year_id=$2
AND term_id=$3

ORDER BY assessment_type
`,
[
subject_id,
academic_year_id,
term_id
]

);




// GET SCORES

const marks=
await db.query(

`
SELECT *
FROM marks

WHERE class_id=$1
AND subject_id=$2
AND academic_year_id=$3
AND term_id=$4
`,
[
class_id,
subject_id,
academic_year_id,
term_id
]

);




const marksMap={};


marks.rows.forEach(

m=>{

marksMap[
`${m.learner_id}_${m.assessment_type}`
]
=
m;

}

);




const finalData=

learners.rows.map(

learner=>{

const learnerMarks=

tests.rows.map(

test=>{

const found=

marksMap[
`${learner.id}_${test.assessment_type}`
];


return{

assessment_type:
test.assessment_type,

score:
found?.score || "",

max_score:
test.max_score,

is_exam:
test.is_exam

};

}

);


return{

id:
learner.id,

full_name:
learner.full_name,

marks:
learnerMarks

};

}

);



return{

statusCode:200,

body:JSON.stringify(
finalData
)

};

}




// ===================================
// SAVE MARK
// ===================================

if(action==="saveMark"){

const body=
JSON.parse(
event.body
);


const{

learner_id,
subject_id,
class_id,
academic_year_id,
term_id,
teacher_id,
assessment_type,
score,
max_score

}=body;




const exists=

await db.query(

`
SELECT id
FROM marks

WHERE learner_id=$1
AND subject_id=$2
AND class_id=$3
AND academic_year_id=$4
AND term_id=$5
AND assessment_type=$6
`,
[
learner_id,
subject_id,
class_id,
academic_year_id,
term_id,
assessment_type
]

);




if(exists.rows.length){

await db.query(

`
UPDATE marks
SET score=$1
WHERE id=$2
`,
[
score,
exists.rows[0].id
]

);

}

else{

await db.query(

`
INSERT INTO marks(

learner_id,
subject_id,
class_id,
academic_year_id,
term_id,
teacher_id,

assessment_type,
score,
max_score

)

VALUES(

$1,
$2,
$3,
$4,
$5,
$6,

$7,
$8,
$9
)

`,
[
learner_id,
subject_id,
class_id,
academic_year_id,
term_id,
teacher_id,

assessment_type,
score,
max_score
]

);

}



return{

statusCode:200,

body:JSON.stringify({

message:"Saved successfully"

})

};

}




// ===================================
// INVALID
// ===================================

return{

statusCode:400,

body:JSON.stringify({

message:"Invalid action"

})

};

}

catch(error){

console.log(error);

return{

statusCode:500,

body:JSON.stringify({

error:error.message

})

};

}

};
