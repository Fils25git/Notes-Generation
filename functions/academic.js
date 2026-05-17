const db=require("./db");

exports.handler=async(event)=>{

try{

const action=
event.queryStringParameters?.action;


// GET CURRENT

if(action==="getCurrent"){

const year=
await db.query(
`
SELECT *
FROM academic_years
WHERE is_current=true
LIMIT 1
`
);

const term=
await db.query(
`
SELECT *
FROM terms
WHERE is_current=true
LIMIT 1
`
);

return{

statusCode:200,

body:JSON.stringify({

year:
year.rows[0],

term:
term.rows[0]

})

};

}


// GET TERMS

if(action==="getTerms"){

const result=
await db.query(
`
SELECT *
FROM terms
ORDER BY id
`
);

return{

statusCode:200,

body:JSON.stringify(
result.rows
)

};

}


// SET ACTIVE TERM

if(action==="setTerm"){

const {id}=
JSON.parse(event.body);

await db.query(
`
UPDATE terms
SET is_current=false
`
);

await db.query(
`
UPDATE terms
SET is_current=true
WHERE id=$1
`,
[id]
);

return{

statusCode:200,

body:JSON.stringify({

message:"Updated"

})

};

}


return{

statusCode:400,

body:JSON.stringify({

message:"Invalid action"

})

};

}catch(error){

return{

statusCode:500,

body:JSON.stringify({

error:error.message

})

};

}

};
