import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cookieParser from "cookie-parser";
import http from "http";

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  const httpServer = http.createServer(app);

  app.use(cookieParser());
  app.use(express.json());

  // OAuth Setup
  const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
  const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
  const APP_URL = process.env.APP_URL; // e.g. https://ais-pre-...run.app

  const getRedirectUri = () => {
    // If running in development or APP_URL is not set, fallback gracefully.
    // However, APP_URL is guaranteed by the platform in preview.
    const baseUrl = APP_URL || "http://localhost:3000";
    return `${baseUrl.replace(/\/$/, '')}/api/auth/callback`;
  };

  // 1. Return URL to open in popup
  app.get("/api/auth/url", (req, res) => {
    if (!DISCORD_CLIENT_ID) {
       return res.status(500).json({ error: "DISCORD_CLIENT_ID is not configured." });
    }
    const redirectUri = getRedirectUri();
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
      const redirectUri = getRedirectUri();
      
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

      // Securely store access_token in httpOnly cookie or just use sessions.
      // Since it's a popup, we need to let the frontend know we succeeded.
      // We will set an httpOnly cookie for the token, and send a message.
      res.cookie("discord_token", tokenData.access_token, {
        secure: true,
        sameSite: "none",
        httpOnly: true,
        maxAge: tokenData.expires_in * 1000,
      });

      // Send success message to parent window and close popup
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
    res.clearCookie("discord_token", {
      secure: true,
      sameSite: "none",
      httpOnly: true,
    });
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Use *all for Express 5 compatibility if applicable, otherwise * works for Express 4.
    // Express 4 uses '*', let's check package.json -> ^4.21.2
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
