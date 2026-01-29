import pkg from "pg";
const { Client } = pkg;

export async function handler(event) {
  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // 🔹 Get page & limit from URL
    const page = parseInt(event.queryStringParameters?.page) || 1;
    const limit = parseInt(event.queryStringParameters?.limit) || 100;
    const offset = (page - 1) * limit;

    // 🔹 Fetch paginated users
    const usersRes = await client.query(
      `SELECT id, name, email, phone, balance
       FROM users
       ORDER BY id DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    // 🔹 Total users count
    const countRes = await client.query(`SELECT COUNT(*) FROM users`);
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
    console.error("Error fetching users:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch users" })
    };

  } finally {
    await client.end();
  }
      }
