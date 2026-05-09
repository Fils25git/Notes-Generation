import pkg from "pg";
const { Client } = pkg;

export async function handler(event){

try{

const {
role,
school_name
} = event.queryStringParameters || {};

// ================= DB =================

const client = new Client({
connectionString:process.env.DATABASE_URL,
ssl:{ rejectUnauthorized:false }
});

await client.connect();

// ================= QUERY =================

let query = `
SELECT *
FROM tests
WHERE 1=1
`;

let values = [];

// ================= SCHOOL ADMIN =================

if(role === "school_admin"){

query += `
AND (
school_name = $1
OR role = 'sector_admin'
)
`;

values.push(school_name);

}

// ================= ORDER =================

query += `
ORDER BY id DESC
`;

// ================= EXECUTE =================

const result =
await client.query(query, values);

await client.end();

// ================= RESPONSE =================

return{
statusCode:200,
body:JSON.stringify(result.rows)
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
