const sql=require("./spellingDb");

exports.handler=async()=>{

try{

const winners=
await sql`

SELECT *

FROM competition_results

WHERE stage='finalist'

ORDER BY position

LIMIT 3

`;

const participants=
await sql`

SELECT *

FROM competition_results

WHERE stage='finalist'

OFFSET 3

`;

return{

statusCode:200,
body:JSON.stringify({
success:true,
winners,
participants
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
