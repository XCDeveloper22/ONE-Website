import fs from "fs";
import path from "path";

export interface GuildConfig {
  guildId: string;
  prefix: string;
  welcomeChannel: string;
  welcomeEnabled: boolean;
  welcomeMessage: string;
  welcomeTheme: string; // premium perk
  welcomeColor: string; // premium perk
  leaveChannel: string;
  leaveEnabled: boolean;
  leaveMessage: string;
  leaveTheme: string; // premium perk
  leaveColor: string; // premium perk
  embedTitle: string;
  embedDescription: string;
  embedColor: string;
  embedImage: string;
  scheduledMessages: Array<{
    id: string;
    channel: string;
    text: string;
    intervalMinutes: number;
    enabled: boolean;
  }>;
  moderationRules: {
    antiSpam: boolean;
    linkFilter: boolean;
    profanityFilter: boolean;
    inviteBlock: boolean;
    massMentions: boolean;
  };
  integrations: Record<string, {
    enabled: boolean;
    config?: any;
  }>;
  premium: boolean;
}

export interface ConfigAuditLog {
  id: string;
  guildId: string;
  userId: string;
  userTag: string;
  modifiedSection: string;
  previousValue: string;
  newValue: string;
  timestamp: number;
}

// Memory Cache
const configCache = new Map<string, GuildConfig>();
const dbFilePath = path.join(process.cwd(), "api", "config_store.json");
const logsFilePath = path.join(process.cwd(), "api", "config_logs.json");

// Helper: load files safely
function loadJsonFile<T>(filePath: string, defaultValue: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content);
    }
  } catch (error) {
    console.error(`Error loading JSON file at ${filePath}:`, error);
  }
  return defaultValue;
}

// Helper: save files safely
function saveJsonFile<T>(filePath: string, data: T) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error(`Error saving JSON file at ${filePath}:`, error);
  }
}

// Generate the standard default guild configuration
export function getDefaultConfig(guildId: string): GuildConfig {
  return {
    guildId,
    prefix: "!",
    welcomeChannel: "#welcome",
    welcomeEnabled: true,
    welcomeMessage: "Welcome to our server, {user}! Enjoy your stay! 🎉",
    welcomeTheme: "classic",
    welcomeColor: "#3B82F6",
    leaveChannel: "#leave",
    leaveEnabled: false,
    leaveMessage: "{user} has left the server. Goodbye! 🚪",
    leaveTheme: "classic",
    leaveColor: "#EF4444",
    embedTitle: "Server Info",
    embedDescription: "Welcome! Configure your automated embed templates easily.",
    embedColor: "#3B82F6",
    embedImage: "",
    scheduledMessages: [
      {
        id: "sch-1",
        channel: "#announcements",
        text: "💡 Tip: You can configure custom welcome themes, colors, and automation settings using the premium dashboard!",
        intervalMinutes: 60,
        enabled: true,
      }
    ],
    moderationRules: {
      antiSpam: true,
      linkFilter: false,
      profanityFilter: true,
      inviteBlock: true,
      massMentions: false,
    },
    integrations: {
      github: { enabled: false, config: { repo: "owner/repo" } },
      twitch: { enabled: false, config: { streamer: "kenzu" } },
      youtube: { enabled: false, config: { channel: "kenzu_channel" } },
      spotify: { enabled: false, config: {} },
      roblox: { enabled: false, config: {} },
      steam: { enabled: false, config: {} },
      fivem: { enabled: false, config: {} },
      minecraft: { enabled: false, config: {} },
      patreon: { enabled: false, config: {} },
      kofi: { enabled: false, config: {} },
      paypal: { enabled: false, config: {} },
      stripe: { enabled: false, config: {} },
      rss: { enabled: false, config: {} },
      gcal: { enabled: false, config: {} },
      trello: { enabled: false, config: {} },
      notion: { enabled: false, config: {} },
      zapier: { enabled: false, config: {} },
      webhooks: { enabled: false, config: {} },
    },
    premium: false,
  };
}

// Central Configuration Database (State loaded from file, fell back to memory maps)
let databaseStore: Record<string, GuildConfig> = {};
let databaseLogs: ConfigAuditLog[] = [];

// Initialize Database on module load
try {
  databaseStore = loadJsonFile<Record<string, GuildConfig>>(dbFilePath, {});
  databaseLogs = loadJsonFile<ConfigAuditLog[]>(logsFilePath, []);
} catch (e) {
  console.error("Failed to initialize JSON database store", e);
}

// 1. Load configuration from cache (falling back to file database, then to defaults)
export function getConfig(guildId: string): GuildConfig {
  if (configCache.has(guildId)) {
    return configCache.get(guildId)!;
  }

  // Load from persisted JSON database
  let guildConfig = databaseStore[guildId];
  if (!guildConfig) {
    guildConfig = getDefaultConfig(guildId);
    databaseStore[guildId] = guildConfig;
    saveJsonFile(dbFilePath, databaseStore);
  }

  // Set Cache
  configCache.set(guildId, guildConfig);
  return guildConfig;
}

// 2. Save / Update configuration with logging and validation
export function updateConfig(
  guildId: string,
  userId: string,
  userTag: string,
  updates: Partial<GuildConfig>
): { config: GuildConfig; logs: ConfigAuditLog[] } {
  const current = { ...getConfig(guildId) };

  // Validate changes (Ensure prefix isn't empty, check properties)
  const mergedModeration = {
    ...current.moderationRules,
    ...(updates.moderationRules || {}),
  };

  const updatedConfig: GuildConfig = {
    ...current,
    ...updates,
    guildId, // guarantee ID doesn't change
    moderationRules: mergedModeration,
  };

  // Perform premium permissions checks & constraints check
  // (We enforce premium constraints server-side for security!)
  const isOwner = userId === "836128654983168002" || userTag.toLowerCase().includes("kenzu");
  const hasPremium = updatedConfig.premium || isOwner;

  if (!hasPremium) {
    // Force revert any premium modifications back to defaults
    if (updatedConfig.welcomeTheme !== "classic") updatedConfig.welcomeTheme = "classic";
    if (updatedConfig.welcomeColor !== "#3B82F6") updatedConfig.welcomeColor = "#3B82F6";
    if (updatedConfig.leaveTheme !== "classic") updatedConfig.leaveTheme = "classic";
    if (updatedConfig.leaveColor !== "#EF4444") updatedConfig.leaveColor = "#EF4444";
  }

  // Detect and record log changes
  const newLogs: ConfigAuditLog[] = [];
  const timestamp = Date.now();

  const recordChange = (section: string, prev: any, next: any) => {
    const prevStr = typeof prev === "object" ? JSON.stringify(prev) : String(prev);
    const nextStr = typeof next === "object" ? JSON.stringify(next) : String(next);

    if (prevStr !== nextStr) {
      const logEntry: ConfigAuditLog = {
        id: `log-${Math.random().toString(36).substring(2, 11)}`,
        guildId,
        userId,
        userTag,
        modifiedSection: section,
        previousValue: prevStr.substring(0, 300),
        newValue: nextStr.substring(0, 300),
        timestamp,
      };
      newLogs.push(logEntry);
      databaseLogs.unshift(logEntry);
    }
  };

  // Check prefix
  if (updates.prefix !== undefined && updates.prefix.trim() !== "") {
    recordChange("Prefix", current.prefix, updatedConfig.prefix);
  } else {
    updatedConfig.prefix = current.prefix; // preserve old if invalid
  }

  // Check welcome settings
  if (updates.welcomeChannel !== undefined) recordChange("Welcome Channel", current.welcomeChannel, updatedConfig.welcomeChannel);
  if (updates.welcomeEnabled !== undefined) recordChange("Welcome Toggled", current.welcomeEnabled, updatedConfig.welcomeEnabled);
  if (updates.welcomeMessage !== undefined) recordChange("Welcome Message", current.welcomeMessage, updatedConfig.welcomeMessage);
  if (updates.welcomeTheme !== undefined) recordChange("Welcome Theme", current.welcomeTheme, updatedConfig.welcomeTheme);
  if (updates.welcomeColor !== undefined) recordChange("Welcome Color", current.welcomeColor, updatedConfig.welcomeColor);

  // Check leave settings
  if (updates.leaveChannel !== undefined) recordChange("Leave Channel", current.leaveChannel, updatedConfig.leaveChannel);
  if (updates.leaveEnabled !== undefined) recordChange("Leave Toggled", current.leaveEnabled, updatedConfig.leaveEnabled);
  if (updates.leaveMessage !== undefined) recordChange("Leave Message", current.leaveMessage, updatedConfig.leaveMessage);
  if (updates.leaveTheme !== undefined) recordChange("Leave Theme", current.leaveTheme, updatedConfig.leaveTheme);
  if (updates.leaveColor !== undefined) recordChange("Leave Color", current.leaveColor, updatedConfig.leaveColor);

  // Check embed builder
  if (updates.embedTitle !== undefined) recordChange("Embed Title", current.embedTitle, updatedConfig.embedTitle);
  if (updates.embedDescription !== undefined) recordChange("Embed Desc", current.embedDescription, updatedConfig.embedDescription);
  if (updates.embedColor !== undefined) recordChange("Embed Color", current.embedColor, updatedConfig.embedColor);
  if (updates.embedImage !== undefined) recordChange("Embed Image", current.embedImage, updatedConfig.embedImage);

  // Check scheduled messages
  if (updates.scheduledMessages !== undefined) {
    recordChange("Scheduled Messages", current.scheduledMessages, updatedConfig.scheduledMessages);
  }

  // Check moderation rules
  if (updates.moderationRules !== undefined) {
    recordChange("Moderation Rules", current.moderationRules, updatedConfig.moderationRules);
  }

  // Check integrations
  if (updates.integrations !== undefined) {
    recordChange("Integrations Settings", current.integrations, updatedConfig.integrations);
  }

  // Check premium toggle
  if (updates.premium !== undefined) {
    recordChange("Premium Membership", current.premium, updatedConfig.premium);
  }

  // Save to database
  databaseStore[guildId] = updatedConfig;
  saveJsonFile(dbFilePath, databaseStore);

  if (newLogs.length > 0) {
    // Keep logs files to maximum of 200 logs
    if (databaseLogs.length > 200) {
      databaseLogs = databaseLogs.slice(0, 200);
    }
    saveJsonFile(logsFilePath, databaseLogs);
  }

  // Refresh cache
  configCache.set(guildId, updatedConfig);

  return { config: updatedConfig, logs: newLogs };
}

// 3. Reset config
export function resetConfig(
  guildId: string,
  userId: string,
  userTag: string
): { config: GuildConfig; logs: ConfigAuditLog[] } {
  const defaultConfig = getDefaultConfig(guildId);
  // Keep premium status intact on reset
  const current = getConfig(guildId);
  defaultConfig.premium = current.premium;

  return updateConfig(guildId, userId, userTag, defaultConfig);
}

// 4. Force Reload config
export function reloadConfig(guildId: string): GuildConfig {
  configCache.delete(guildId);
  return getConfig(guildId);
}

// 5. Get Audit Logs
export function getLogs(guildId: string): ConfigAuditLog[] {
  return databaseLogs.filter((log) => log.guildId === guildId);
}
