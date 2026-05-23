const pool = require("./spellingDb");

exports.handler = async (event) => {

try {

const body = JSON.parse(event.body);

const competitionId = body.competition_id;

if (!competitionId) {

return {
statusCode: 400,
body: JSON.stringify({
message: "competition_id is required"
})
};

}

/* STEP 1: deactivate only active competitions */
await pool.query(`
UPDATE competitions
SET status = 'inactive'
WHERE status = 'active'
`);

/* STEP 2: activate selected competition */
const result = await pool.query(`
UPDATE competitions
SET status = 'active'
WHERE id = $1
RETURNING *
`, [competitionId]);

if (result.rowCount === 0) {

return {
statusCode: 404,
body: JSON.stringify({
message: "Competition not found"
})
};

}

return {
statusCode: 200,
body: JSON.stringify({
message: "Competition activated",
competition: result.rows[0]
})
};

} catch (error) {

return {
statusCode: 500,
body: JSON.stringify({
message: error.message
})
};

}

};
