const pool = require("./spellingDb");

exports.handler = async () => {

try {

const result = await pool.query(
"SELECT * FROM competitions"
);

return {
statusCode: 200,
body: JSON.stringify({
competitions: result.rows,
count: result.rowCount
})
};

} catch (error) {

console.log("DB ERROR:", error);

return {
statusCode: 500,
body: JSON.stringify({
error: error.message
})
};

}

};
