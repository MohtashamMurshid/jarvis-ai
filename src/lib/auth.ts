export function verifyAuth(request: Request): boolean {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return false;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Basic validation - in a production app you'd want more sophisticated token validation
    if (!token || !token.startsWith("amFydmlzX3Nlc3Npb24")) {
      // base64 encoded "jarvis_session"
      return false;
    }

    // Decode and check if token is recent (within 24 hours)
    try {
      const decoded = Buffer.from(token, "base64").toString();
      const timestampMatch = decoded.match(/jarvis_session_(\d+)_/);

      if (!timestampMatch) {
        return false;
      }

      const tokenTime = parseInt(timestampMatch[1]);
      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;

      // Token is valid if it's less than 24 hours old
      return now - tokenTime < twentyFourHours;
    } catch {
      return false;
    }
  } catch {
    return false;
  }
}

export function createAuthResponse() {
  return Response.json({ error: "Authentication required" }, { status: 401 });
}
