const sql=require("./spellingDb");

exports.handler=async(event)=>{

try{

const body=
JSON.parse(event.body);

await sql`

INSERT INTO student_draws(

student_id,
group_id,
draw_order

)

VALUES(

${body.student_id},
${body.group_id},
${body.draw_order}

)

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
