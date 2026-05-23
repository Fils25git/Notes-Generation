const sql=require("./spellingDb");

exports.handler=async(event)=>{

try{

const competition_id=
event.queryStringParameters.competition_id;

if(!competition_id){

return{
statusCode:400,
body:JSON.stringify({message:"competition_id required"})
};

}

const stages=
await sql(
`
SELECT *
FROM competition_stages
WHERE competition_id=$1
ORDER BY stage_number ASC
`,
[competition_id]
);

return{
statusCode:200,
body:JSON.stringify({stages})
};

}
catch(error){

return{
statusCode:500,
body:JSON.stringify({message:error.message})
};

}

};
