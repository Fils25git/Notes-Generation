const sql=require("./spellingDb");

exports.handler=async()=>{

try{

const top7=
await sql`

SELECT

student_id,
SUM(score) AS total

FROM word_attempts

GROUP BY student_id

ORDER BY total DESC

LIMIT 7

`;

for(let i=0;i<top7.length;i++){

await sql`

INSERT INTO competition_results(
student_id,
total_score,
position,
stage
)

VALUES(

${top7[i].student_id},
${top7[i].total},
${i+1},
'finalist'

)

`;

}

return{

statusCode:200,
body:JSON.stringify({
success:true,
top7
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
