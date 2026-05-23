const sql = require("./spellingDb");

exports.handler = async (event) => {

try {

const body = JSON.parse(event.body);

const competition_name = body.competition_name;

if (!competition_name) {

return {
statusCode: 400,
body: JSON.stringify({
message: "Competition name required"
})
};

}

await sql`
INSERT INTO competitions
(competition_name, status)
VALUES (${competition_name}, 'inactive')
`;

return {
statusCode: 200,
body: JSON.stringify({
message: "Competition created"
})
};

} catch (error) {

console.log(error);

return {
statusCode: 500,
body: JSON.stringify({
message: error.message
})
};

}

};
