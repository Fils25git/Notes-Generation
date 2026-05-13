const db = require("./db");

exports.handler = async (event) => {
  try {
    const { email, password } = JSON.parse(event.body);

    const result = await db.query(
      "SELECT * FROM teachers WHERE email = $1 AND password = $2",
      [email, password]
    );

    if (result.rows.length === 0) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: "Invalid login" })
      };
    }

    const teacher = result.rows[0];

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Login successful",
        teacher: {
          id: teacher.id,
          full_name: teacher.full_name,
          email: teacher.email
        }
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
