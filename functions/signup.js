const bcrypt = require('bcryptjs');

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const data = JSON.parse(event.body || '{}');

  const { name, email, password, role, phone, recoveryEmail } = data;

  if (!name || !email || !password || !role || !phone) {
    return { statusCode: 400, body: 'Please fill all required fields' };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  console.log({ name, email, password: hashedPassword, role, phone, recoveryEmail });

  return {
    statusCode: 200,
    body: 'User registered successfully!'
  };
};
