const pool=require("./spellingDb");

exports.handler=async(event)=>{

try{

const body=
JSON.parse(event.body);

const competitionId=
body.competition_id;


/* deactivate all */

await pool.query(

`
UPDATE competitions
SET status='inactive'
`

);


/* activate selected */

await pool.query(

`
UPDATE competitions

SET status='active'

WHERE id=$1
`,

[competitionId]

);

return{

statusCode:200,

body:JSON.stringify({

message:"Competition activated"

})

};

}
catch(error){

return{

statusCode:500,

body:JSON.stringify({

message:error.message

})

};

}

};
