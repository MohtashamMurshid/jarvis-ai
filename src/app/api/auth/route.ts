export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (!password) {
      return Response.json({ error: "Password is required" }, { status: 400 });
    }

    const correctPassword = process.env.JARVIS_PASSWORD;

    if (!correctPassword) {
      console.error("JARVIS_PASSWORD environment variable not set");
      return Response.json(
        { error: "Authentication system not configured" },
        { status: 500 }
      );
    }

    if (password === correctPassword) {
      // Generate a simple session token
      const sessionToken = Buffer.from(
        `jarvis_session_${Date.now()}_${Math.random()}`
      ).toString("base64");

      return Response.json(
        {
          success: true,
          sessionToken,
          message: "Authentication successful",
        },
        { status: 200 }
      );
    } else {
      return Response.json({ error: "Invalid password" }, { status: 401 });
    }
  } catch (error) {
    console.error("Authentication error:", error);
    return Response.json({ error: "Authentication failed" }, { status: 500 });
  }
}
