const sql=
require("./spellingDb");

exports.handler=
async(event)=>{

try{

const body=
JSON.parse(
event.body
);


await sql`

UPDATE competition_state

SET

currentstudent=
${body.currentStudent},

currentwordindex=
${body.currentWordIndex},

round=
${body.round},

score=
${body.score},

timeleft=
${body.timeLeft}

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
