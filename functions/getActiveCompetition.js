const pool=require("./spellingDb");

exports.handler=async()=>{

try{

const result=
await pool.query(

`
SELECT *

FROM competitions

WHERE status='active'

LIMIT 1
`

);

return{

statusCode:200,

body:JSON.stringify({

competition:
result.rows[0] || null

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
