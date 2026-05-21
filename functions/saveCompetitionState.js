const sql=require("./spellingDb");

exports.handler=async(event)=>{

try{

const body=
JSON.parse(
event.body
);


await sql`

UPDATE competition_state

SET

currentstudent=
COALESCE(
${body.currentStudent},
currentstudent
),

currentwordindex=
COALESCE(
${body.currentWordIndex},
currentwordindex
),

round=
COALESCE(
${body.round},
round
),

score=
COALESCE(
${body.score},
score
),

timeleft=
COALESCE(
${body.timeLeft},
timeleft
),

competition_started=
COALESCE(
${body.competition_started},
competition_started
),

participant_done=
COALESCE(
${body.participant_done},
participant_done
)

WHERE id=1

`;


return{

statusCode:200,

body:JSON.stringify({

success:true

})

};

}
catch(error){

return{

statusCode:500,

body:JSON.stringify({

success:false,
error:error.message

})

};

}

};
