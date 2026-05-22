const sql=require("./SpellingDb");

exports.handler=async(event)=>{

try{

const data=
JSON.parse(event.body);

const result=
await sql`

INSERT INTO word_attempts(

student_id,
competition_id,
round_number,
word,
learner_answer,
score,
time_allowed,
time_used,
status

)

VALUES(

${data.studentId},
${data.competitionId},
${data.round},
${data.word},
${data.answer},
${data.score},
${data.timeAllowed},
${data.timeUsed},
${data.status}

)

RETURNING *
`;

return{

statusCode:200,

body:JSON.stringify({
success:true,
result
})

};

}

catch(error){

return{

statusCode:500,

body:JSON.stringify({
error:error.message
})

};

}

};
