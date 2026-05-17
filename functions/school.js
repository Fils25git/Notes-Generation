const db=require("./db");

exports.handler=async(event)=>{

try{

const action=
event.queryStringParameters?.action;


// =========================
// GET SUBJECTS
// =========================

if(action==="getSubjects"){

const result=
await db.query(`
SELECT *
FROM subjects
ORDER BY id
`);

return{
statusCode:200,
body:JSON.stringify(result.rows)
};

}


// =========================
// GET CLASSES
// =========================

if(action==="getClasses"){

const result=
await db.query(`
SELECT *
FROM classes
ORDER BY id
`);

return{
statusCode:200,
body:JSON.stringify(result.rows)
};

}


// =========================
// ADD TEST
// =========================

if(action==="addTest"){

const body=
JSON.parse(event.body);

const{
subject_id,
class_id,
academic_year_id,
term_id,
test_name,
max_score,
is_exam
}=body;


const result=
await db.query(

`
INSERT INTO subject_tests(

subject_id,
class_id,
academic_year_id,
term_id,
test_name,
max_score,
is_exam

)

VALUES(
$1,$2,$3,$4,$5,$6,$7
)

RETURNING *
`,
[
subject_id,
class_id,
academic_year_id,
term_id,
test_name,
Number(max_score),
is_exam||false
]

);

return{

statusCode:200,

body:JSON.stringify(
result.rows[0]
)

};

}


// =========================
// UPDATE TEST
// =========================

if(action==="updateTest"){

const body=
JSON.parse(event.body);

const{
id,
test_name,
max_score
}=body;


await db.query(

`
UPDATE subject_tests

SET
test_name=$1,
max_score=$2

WHERE id=$3
`,
[
test_name,
Number(max_score),
id
]

);


await db.query(

`
UPDATE marks
SET max_score=$1
WHERE test_id=$2
`,
[
Number(max_score),
id
]

);


return{

statusCode:200,

body:JSON.stringify({

message:"updated"

})

};

}



// =========================
// GET MARKS
// =========================

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


const tests=
await db.query(

`
SELECT *

FROM subject_tests

WHERE subject_id=$1
AND class_id=$2
AND academic_year_id=$3
AND term_id=$4

ORDER BY id
`,
[
subject_id,
class_id,
academic_year_id,
term_id
]

);


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

marks.rows.forEach(m=>{

marksMap[
`${m.learner_id}_${m.test_id}`
]
=
m;

});


const finalData=

learners.rows.map(

learner=>{

const learnerMarks=

tests.rows.map(

test=>{

const found=

marksMap[
`${learner.id}_${test.id}`
];

return{

test_id:test.id,

assessment_type:
test.test_name,

score:
found?.score||"",

max_score:
test.max_score,

is_exam:
test.is_exam

};

}

);


return{

id:learner.id,

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
// GET GRADING SETTINGS
// ===================================

if(action==="getGradingSettings"){

const{

subject_id,
class_id,
academic_year_id,
term_id

}
=
event.queryStringParameters;


const result=
await db.query(

`
SELECT *

FROM grading_settings

WHERE
subject_id=$1
AND class_id=$2
AND academic_year_id=$3
AND term_id=$4
`,
[
subject_id,
class_id,
academic_year_id,
term_id
]

);


if(result.rows.length){

return{

statusCode:200,
body:JSON.stringify(
result.rows[0]
)

};

}


return{

statusCode:200,

body:JSON.stringify({

overall_test_max:100,
overall_exam_max:100

})

};

}



// ===================================
// SAVE GRADING SETTINGS
// ===================================

if(action==="saveGradingSettings"){

const body=
JSON.parse(
event.body
);

const{

subject_id,
class_id,
academic_year_id,
term_id,

overall_test_max,
overall_exam_max

}
=
body;


const existing=
await db.query(

`
SELECT id

FROM grading_settings

WHERE
subject_id=$1
AND class_id=$2
AND academic_year_id=$3
AND term_id=$4
`,
[
subject_id,
class_id,
academic_year_id,
term_id
]

);


if(existing.rows.length){

await db.query(

`
UPDATE grading_settings

SET

overall_test_max=$1,
overall_exam_max=$2

WHERE id=$3
`,
[
overall_test_max,
overall_exam_max,
existing.rows[0].id
]

);

}else{

await db.query(

`
INSERT INTO grading_settings(

subject_id,
class_id,
academic_year_id,
term_id,

overall_test_max,
overall_exam_max

)

VALUES(
$1,$2,$3,$4,$5,$6
)
`,
[
subject_id,
class_id,
academic_year_id,
term_id,

overall_test_max,
overall_exam_max
]

);

}


return{

statusCode:200,

body:JSON.stringify({

message:"Saved"

})

};

}

// =========================
// SAVE MARK
// =========================

if(action==="saveMark"){

const body=
JSON.parse(event.body);

const{

learner_id,
subject_id,
class_id,
academic_year_id,
term_id,
teacher_id,
test_id,
score,
max_score

}=body;


const existing=
await db.query(

`
SELECT id

FROM marks

WHERE learner_id=$1
AND test_id=$2
`,
[
learner_id,
test_id
]

);


if(existing.rows.length){

await db.query(

`
UPDATE marks
SET score=$1
WHERE id=$2
`,
[
score,
existing.rows[0].id
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
test_id,
score,
max_score

)

VALUES(
$1,$2,$3,$4,$5,$6,$7,$8,$9
)
`,
[
learner_id,
subject_id,
class_id,
academic_year_id,
term_id,
teacher_id,
test_id,
score,
max_score
]

);

}


return{

statusCode:200,

body:JSON.stringify({

message:"saved"

})

};

}


// =========================

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
