import db from "./db.js";

export const handler = async (event) => {
try{

const{
id
}=
JSON.parse(
event.body
);


/* remove linked marks first */

await db.query(

`
DELETE FROM marks
WHERE learner_id=$1
`,

[
id
]

);


/* delete student */

await db.query(

`
DELETE FROM learners
WHERE id=$1
`,

[
id
]

);


return{

statusCode:200,

body:JSON.stringify({

message:
"Student deleted"

})

};

}
catch(error){

return{

statusCode:500,

body:JSON.stringify({

error:
error.message

})

};

}

};
