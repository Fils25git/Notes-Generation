const sql=require("./spellingDb");

exports.handler=async(event)=>{

try{

const body=
JSON.parse(event.body);

const group=
await sql`

INSERT INTO word_groups(

group_number

)

VALUES(

${body.group_number}

)

RETURNING *

`;

for(

const word of body.words

){

await sql`

INSERT INTO words(

group_id,
word

)

VALUES(

${group[0].id},
${word}

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
