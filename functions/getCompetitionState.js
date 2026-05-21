const sql=
require("./spellingDb");

exports.handler=
async()=>{

try{

const state=
await sql`

SELECT *

FROM competition_state

LIMIT 1

`;


return{

statusCode:200,

body:JSON.stringify({

state:state[0]

})

};

}
catch(error){

return{

statusCode:500,

body:JSON.stringify({

error:error.message

})

};

}

};
