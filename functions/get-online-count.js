/*const { Client } = require("pg");

exports.handler = async () => {

  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    const result = await client.query(
      `
      SELECT COUNT(*) 
      FROM active_users
      WHERE last_active > NOW() - INTERVAL '2 minutes';
      `
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        onlineUsers: result.rows[0].count
      }),
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  } finally {
    await client.end();
  }
};*/
