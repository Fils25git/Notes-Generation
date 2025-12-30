// functions/signup.js
const bcrypt = require('bcryptjs');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const data = JSON.parse(event.body);
  const { name, email, password, role, phone, recoveryEmail } = data;

  if (!email || !password || !name || !role || !phone) {
    return { statusCode: 400, body: 'Please fill all required fields' };
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Save user data (for now, just log it)
  console.log({ name, email, password: hashedPassword, role, phone, recoveryEmail });

  return { statusCode: 200, body: 'User registered successfully!' };
};
