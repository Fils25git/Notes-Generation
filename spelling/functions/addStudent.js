const sql=require("./db");

exports.handler=async(event)=>{

try{

const data=
JSON.parse(event.body);

const name=
data.full_name.trim();

const className=
data.class_name.trim();

const existing=
await sql`

SELECT id
FROM students
WHERE LOWER(full_name)=LOWER(${name})

`;

if(existing.length>0){

return{

statusCode:400,

body:JSON.stringify({

success:false,
message:"Student already exists"

})

};

}


const student=
await sql`

INSERT INTO students(

full_name,
class_name

)

VALUES(

${name},
${className}

)

RETURNING *

`;

return{

statusCode:200,

body:JSON.stringify({

success:true,
student

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
