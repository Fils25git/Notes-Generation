import db from "./db.js";

export const handler = async (event) => {
  try {
    const result = await db.query(
      "SELECT * FROM classes ORDER BY id ASC"
    );

    return {
      statusCode: 200,
      body: JSON.stringify(result.rows)
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
