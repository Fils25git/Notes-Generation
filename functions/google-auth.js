export async function handler() {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: `${process.env.APP_BASE_URL}/.netlify/functions/google-callback`,
    response_type: "code",
    scope: "openid email profile",
    prompt: "select_account",
    access_type: "online"
  });

  return {
    statusCode: 302,
    headers: {
      Location: "https://accounts.google.com/o/oauth2/v2/auth?" + params.toString()
    }
  };
}
