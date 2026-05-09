import pkg from "pg";
const { Client } = pkg;

export async function handler(event){

try{

if(event.httpMethod !== "POST"){

return{
statusCode:405,
body:JSON.stringify({
message:"Method not allowed"
})
};

}

const body = JSON.parse(event.body || "{}");

const {
test_name,
created_by,
school_name,
role
} = body;

// ================= VALIDATION =================

if(!test_name){

return{
statusCode:400,
body:JSON.stringify({
message:"Test name is required"
})
};

}

// ================= DB =================

const client = new Client({
connectionString:process.env.DATABASE_URL,
ssl:{ rejectUnauthorized:false }
});

await client.connect();

// ================= INSERT TEST =================

const result = await client.query(

`
INSERT INTO tests
(
test_name,
created_by,
school_name,
role
)

VALUES
($1,$2,$3,$4)

RETURNING *
`,

[
test_name,
created_by || null,
school_name || null,
role || null
]

);

// ================= CLOSE =================

await client.end();

// ================= RESPONSE =================

return{
statusCode:200,
body:JSON.stringify({

message:"Test created successfully",

test:result.rows[0]

})
};

}catch(err){

return{
statusCode:500,
body:JSON.stringify({
message:err.message
})
};

}

}
