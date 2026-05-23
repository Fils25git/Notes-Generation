const sql=require("./spellingDb");

exports.handler=async(event)=>{

try{

const data=
JSON.parse(
event.body
);

const stages=
data.stages;


await sql`

DELETE FROM competition_stages

WHERE competition_id=

${stages[0].competition_id}

`;


for(let stage of stages){

await sql`

INSERT INTO competition_stages(

competition_id,
stage_number,
participant_count,
stage_name,
status,
qualification_rule,
qualifier_count

)

VALUES(

${stage.competition_id},

${stage.stage_number},

${stage.participant_count},

${stage.stage_name},

${stage.status},

${stage.qualification_rule},

${stage.qualifier_count}

)

`;

}


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
