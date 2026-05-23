const pool=require("./spellingDb");

exports.handler=async()=>{

try{

const result=
await pool.query(

`
SELECT *
FROM competitions

ORDER BY id DESC
`

);

return{

statusCode:200,

body:JSON.stringify({

competitions:
result.rows

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
