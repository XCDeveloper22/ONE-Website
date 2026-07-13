import express from "express";
import cookieParser from "cookie-parser";

const app = express();

app.use(cookieParser());
app.use(express.json());

// OAuth Setup
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;

const getRedirectUri = (req: express.Request) => {
  // If a specific APP_URL is provided, prioritize it
  if (process.env.APP_URL) {
    return `${process.env.APP_URL.replace(/\/$/, '')}/api/auth/callback`;
  }

  // Dynamically determine the URL from the request headers (works well in Vercel)
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const protocol = req.headers['x-forwarded-proto'] || 'https'; // Default to https for Vercel/Production

  // Fallback for local development
  if (host && host.includes('localhost')) {
    return `http://${host}/api/auth/callback`;
  }

  return `${protocol}://${host}/api/auth/callback`;
};

// 1. Return URL to open in popup
app.get("/api/auth/url", (req, res) => {
  if (!DISCORD_CLIENT_ID) {
      return res.status(500).json({ error: "DISCORD_CLIENT_ID is not configured." });
  }
  const redirectUri = getRedirectUri(req);
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "identify email guilds connections", 
  });

  const authUrl = `https://discord.com/api/oauth2/authorize?${params}`;
  res.json({ url: authUrl });
});

// 2. Handle the callback from Discord
app.get(["/api/auth/callback", "/api/auth/callback/"], async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send("No code provided.");
  }

  try {
    const redirectUri = getRedirectUri(req);
    
    const params = new URLSearchParams();
    params.append('client_id', DISCORD_CLIENT_ID!);
    params.append('client_secret', DISCORD_CLIENT_SECRET!);
    params.append('grant_type', 'authorization_code');
    params.append('code', code as string);
    params.append('redirect_uri', redirectUri);

    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to fetch Discord token');
    }

    const tokenData = await tokenResponse.json();
    
    // Fetch user data
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`
      }
    });
    
    if (!userResponse.ok) {
      throw new Error('Failed to fetch Discord user');
    }

    const userData = await userResponse.json();

    const isLocalhost = req.headers.host?.includes('localhost') || false;
    res.cookie("discord_token", tokenData.access_token, {
      secure: !isLocalhost,
      sameSite: isLocalhost ? "lax" : "none",
      httpOnly: true,
      maxAge: tokenData.expires_in * 1000,
    });

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', user: ${JSON.stringify(userData)} }, '*');
              window.close();
            } else {
              window.location.href = '/dashboard';
            }
          </script>
          <p>Authentication successful. This window should close automatically.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error(error);
    res.status(500).send("Authentication failed.");
  }
});

// 3. User info endpoint for frontend
app.get("/api/me", async (req, res) => {
  const token = req.cookies.discord_token;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (!userResponse.ok) {
      return res.status(401).json({ error: "Invalid token" });
    }
    const userData = await userResponse.json();
    res.json(userData);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// 4. Get User Guilds
app.get("/api/guilds", async (req, res) => {
  const token = req.cookies.discord_token;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const guildsResponse = await fetch('https://discord.com/api/users/@me/guilds?with_counts=true', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (!guildsResponse.ok) {
      return res.status(401).json({ error: "Invalid token" });
    }
    const guildsData = await guildsResponse.json();
    res.json(guildsData);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// 5. Get User Connections
app.get("/api/connections", async (req, res) => {
  const token = req.cookies.discord_token;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const connectionsResponse = await fetch('https://discord.com/api/users/@me/connections', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (!connectionsResponse.ok) {
      return res.status(401).json({ error: "Invalid token" });
    }
    const connectionsData = await connectionsResponse.json();
    res.json(connectionsData);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// 6. Logout
app.post("/api/logout", (req, res) => {
  const isLocalhost = req.headers.host?.includes('localhost') || false;
  res.clearCookie("discord_token", {
    secure: !isLocalhost,
    sameSite: isLocalhost ? "lax" : "none",
    httpOnly: true,
  });
  res.json({ success: true });
});

export default app;
