const db = require("./db");

exports.handler = async (event) => {

try {

const action =
event.queryStringParameters?.action;

console.log("========== NEW REQUEST ==========");
console.log("ACTION:", action);
console.log("QUERY:", event.queryStringParameters);


// =========================
// GET SUBJECTS
// =========================

if(action==="getSubjects"){

console.log("Loading subjects...");

const result=
await db.query(
`
SELECT *
FROM subjects
ORDER BY id ASC
`
);

console.log(
"Subjects found:",
result.rows.length
);

return{
statusCode:200,
body:JSON.stringify(result.rows)
};

}


// =========================
// GET CLASSES
// =========================

if(action==="getClasses"){

console.log("Loading classes...");

const result=
await db.query(
`
SELECT *
FROM classes
ORDER BY id ASC
`
);

console.log(
"Classes found:",
result.rows.length
);

return{
statusCode:200,
body:JSON.stringify(result.rows)
};

}


// =========================
// GET MARKS
// =========================

if(action==="getMarks"){

const{
class_id,
subject_id,
term_id,
academic_year_id
}
=
event.queryStringParameters;


console.log("GET MARKS PARAMETERS:");
console.log("class_id:",class_id);
console.log("subject_id:",subject_id);
console.log("term_id:",term_id);
console.log("academic_year_id:",academic_year_id);


if(
!class_id ||
!subject_id ||
!term_id ||
!academic_year_id
){

console.log(
"Missing required parameters"
);

return{
statusCode:400,
body:JSON.stringify({
error:"Missing required fields"
})
};

}


// =========================
// DEBUG DATABASE VALUES
// =========================

const learnersCheck=
await db.query(
`
SELECT
id,
full_name,
class_id,
academic_year_id
FROM learners
ORDER BY id
`
);

console.log(
"ALL LEARNERS IN DATABASE:"
);

console.log(
JSON.stringify(
learnersCheck.rows,
null,
2
)
);


// =========================
// GET LEARNERS
// =========================

console.log(
"Searching learners with:"
);

console.log(
"class_id=",
class_id
);

console.log(
"academic_year_id=",
academic_year_id
);


const learnersRes=
await db.query(
`
SELECT *
FROM learners
WHERE class_id=$1
AND academic_year_id=$2
ORDER BY full_name ASC
`,
[
class_id,
academic_year_id
]
);


console.log(
"FOUND LEARNERS:"
);

console.log(
JSON.stringify(
learnersRes.rows,
null,
2
)
);

console.log(
"TOTAL LEARNERS:",
learnersRes.rows.length
);


// =========================
// GET MARKS
// =========================

const marksRes=
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

console.log(
"TOTAL MARKS:",
marksRes.rows.length
);

console.log(
JSON.stringify(
marksRes.rows,
null,
2
)
);


// =========================
// DEFAULT TESTS
// =========================

const assessmentTypes=[
"Test 1",
"Test 2",
"Exam"
];


// =========================
// CREATE MAP
// =========================

const marksMap={};

marksRes.rows.forEach(
mark=>{

const key=
`${mark.learner_id}_${mark.assessment_type}`;

marksMap[key]=mark;

}
);


// =========================
// FINAL DATA
// =========================

const data=
learnersRes.rows.map(
learner=>{

const marks=
assessmentTypes.map(
type=>{

const found=
marksMap[
`${learner.id}_${type}`
];

return{

assessment_type:type,

score:
found?.score || "",

max_score:
found?.max_score || 100

};

}
);

return{

id:learner.id,

full_name:learner.full_name,

marks

};

}
);


console.log(
"FINAL RESPONSE:"
);

console.log(
JSON.stringify(
data,
null,
2
)
);


return{

statusCode:200,
body:JSON.stringify(data)

};

}


// =========================
// SAVE MARK
// =========================

if(action==="saveMark"){

const body=
JSON.parse(event.body);

console.log(
"SAVE MARK BODY:"
);

console.log(
JSON.stringify(
body,
null,
2
)
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


const existing=
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


console.log(
"Existing mark count:",
existing.rows.length
);


if(existing.rows.length>0){

console.log(
"Updating mark..."
);

await db.query(
`
UPDATE marks
SET score=$1,
max_score=$2
WHERE id=$3
`,
[
score,
max_score || 100,
existing.rows[0].id
]
);

}
else{

console.log(
"Inserting mark..."
);

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
$1,$2,$3,$4,$5,$6,$7,$8,$9
)
`,
[
learner_id,
subject_id,
class_id,
academic_year_id,
term_id,
teacher_id || null,
assessment_type,
score,
max_score || 100
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
// INVALID ACTION
// =========================

return{
statusCode:400,
body:JSON.stringify({
message:"Invalid action"
})
};

}

catch(error){

console.log(
"SERVER ERROR:"
);

console.log(error);

return{

statusCode:500,

body:JSON.stringify({
error:error.message
})

};

}

};
