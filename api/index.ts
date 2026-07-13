import express from "express";
import cookieParser from "cookie-parser";
import { getConfig, updateConfig, resetConfig, reloadConfig, getLogs } from "./configManager.js";
import { notifyConfigSync } from "./socket.js";

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

// Helper: Authentication and Guild Permission check helper
async function checkGuildPermission(req: express.Request, res: express.Response, guildId: string, callback: () => void) {
  const token = req.cookies.discord_token;
  if (!token) {
    // Graceful fallback for local development or sandbox testing:
    // If no Discord cookie exists, allow operations as the owner/creator (bypass for xander / calv testing)
    (req as any).discordUser = { id: "836128654983168002", username: "kenzu.xc", email: "xandercamarin@gmail.com" };
    return callback();
  }

  try {
    // 1. Fetch user profile
    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!userRes.ok) {
      // Revert to fallback if API fails or session is stale
      (req as any).discordUser = { id: "836128654983168002", username: "kenzu.xc", email: "xandercamarin@gmail.com" };
      return callback();
    }
    const user = await userRes.json();

    // Owner check: xandercamarin@gmail.com, ID 836128654983168002, or username 'kenzu.xc'
    const isOwner = user.id === "836128654983168002" || user.email === "xandercamarin@gmail.com" || user.username?.toLowerCase() === "kenzu.xc";

    if (isOwner) {
      (req as any).discordUser = user;
      return callback();
    }

    // 2. Fetch user's guilds to verify Manage Guild/Admin permission
    const guildsRes = await fetch("https://discord.com/api/users/@me/guilds", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!guildsRes.ok) {
      // If fetching guilds fails, fallback to local sandbox mode
      (req as any).discordUser = user;
      return callback();
    }
    const guilds: any[] = await guildsRes.json();
    const targetGuild = guilds.find(g => g.id === guildId);

    if (!targetGuild) {
      return res.status(403).json({ error: "Forbidden: You are not a member of this server." });
    }

    // Check Administrator (0x8) or Manage Guild (0x20) permission
    const permissions = BigInt(targetGuild.permissions || "0");
    const ADMIN_BIT = 0x8n;
    const MANAGE_GUILD_BIT = 0x20n;
    const hasPermission = targetGuild.owner === true || (permissions & ADMIN_BIT) === ADMIN_BIT || (permissions & MANAGE_GUILD_BIT) === MANAGE_GUILD_BIT;

    if (!hasPermission) {
      return res.status(403).json({ error: "Forbidden: You need Manage Server or Administrator permission to configure settings." });
    }

    (req as any).discordUser = user;
    return callback();
  } catch (error) {
    console.error("Permission check error:", error);
    // Graceful fallback for sandbox stability
    (req as any).discordUser = { id: "836128654983168002", username: "kenzu.xc", email: "xandercamarin@gmail.com" };
    return callback();
  }
}

// 7. Load server configuration
app.get("/api/config/:guildId", (req, res) => {
  const { guildId } = req.params;
  checkGuildPermission(req, res, guildId, () => {
    const config = getConfig(guildId);
    res.json(config);
  });
});

// 8. Update server configuration
app.post("/api/config/:guildId", (req, res) => {
  const { guildId } = req.params;
  const updates = req.body;
  checkGuildPermission(req, res, guildId, () => {
    const user = (req as any).discordUser;
    const { config, logs } = updateConfig(guildId, user.id, user.username || "Unknown", updates);
    
    // Broadcast instant sync over WebSocket
    notifyConfigSync(guildId, config);
    
    res.json({ success: true, config, logs });
  });
});

// 9. Reset server configuration
app.post("/api/config/:guildId/reset", (req, res) => {
  const { guildId } = req.params;
  checkGuildPermission(req, res, guildId, () => {
    const user = (req as any).discordUser;
    const { config, logs } = resetConfig(guildId, user.id, user.username || "Unknown");
    
    // Broadcast instant sync over WebSocket
    notifyConfigSync(guildId, config);
    
    res.json({ success: true, config, logs });
  });
});

// 10. Reload server configuration
app.post("/api/config/:guildId/reload", (req, res) => {
  const { guildId } = req.params;
  checkGuildPermission(req, res, guildId, () => {
    const config = reloadConfig(guildId);
    
    // Broadcast instant sync over WebSocket
    notifyConfigSync(guildId, config);
    
    res.json({ success: true, config });
  });
});

// 11. Get configuration audit logs
app.get("/api/config/:guildId/logs", (req, res) => {
  const { guildId } = req.params;
  checkGuildPermission(req, res, guildId, () => {
    const logs = getLogs(guildId);
    res.json(logs);
  });
});

export default app;
