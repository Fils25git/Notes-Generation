import pkg from "pg";
const { Client } = pkg;

export async function handler(event) {
  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    const page = parseInt(event.queryStringParameters?.page) || 1;
    const limit = parseInt(event.queryStringParameters?.limit) || 100;
    const search = event.queryStringParameters?.search || "";
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, name, email, phone, balance
      FROM users
    `;

    let countQuery = `SELECT COUNT(*) FROM users`;
    let values = [];
    let whereClause = "";

    if (search) {
      whereClause = `
        WHERE name ILIKE $1
        OR email ILIKE $1
        OR phone ILIKE $1
      `;
      values.push(`%${search}%`);
    }

    query += whereClause + ` ORDER BY id DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(limit, offset);

    const usersRes = await client.query(query, values);

    const countRes = await client.query(countQuery + whereClause, search ? [`%${search}%`] : []);
    const totalUsers = parseInt(countRes.rows[0].count, 10);

    return {
      statusCode: 200,
      body: JSON.stringify({
        users: usersRes.rows,
        totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
        currentPage: page
      })
    };

  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed" }) };
  } finally {
    await client.end();
  }
}
