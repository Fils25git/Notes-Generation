export async function handler() {
  // DO NOT expose the actual secret!
  return {
    statusCode: 200,
    body: JSON.stringify({
      hasJWT: !!process.env.JWT_SECRET,          // true if JWT_SECRET exists
      jwtLength: process.env.JWT_SECRET?.length || 0,  // check length
      hasDB: !!process.env.NEON_DATABASE_URL      // true if database URL exists
    })
  };
}
