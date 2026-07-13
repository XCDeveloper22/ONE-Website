# ONE Bot Commands Reference

A comprehensive catalog of command references for **ONE. Bot**, detailing prefix (`!`) and slash (`/`) commands as sourced from [ONE-bot.node](https://github.com/XCDeveloper22/ONE-bot.node).

---

## 📅 Attendance System
Automated clock-in, shift tracking, consecutive daily streaks, and leaderboard logging.

| Command | Type | Usage | Permissions | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Clock In** | Prefix | `!in [notes]` | Everyone | Begins tracking your active session/shift. Tracks daily consecutive attendance streaks. |
| **Clock In (Slash)** | Slash | `/in [notes]` | Everyone | Slash command counterpart to clock into your shift. |
| **Clock Out** | Prefix | `!out` | Everyone | Stops tracking your session and calculates total shift duration. |
| **Clock Out (Slash)** | Slash | `/out` | Everyone | Slash command counterpart to clock out of your shift. |
| **Stats** | Prefix | `!stats [@user]` | Everyone | View comprehensive personal records, streaks, uptime, and monthly averages. |
| **Stats (Slash)** | Slash | `/stats [user]` | Everyone | Slash command counterpart to view attendance metrics. |
| **Leaderboard** | Prefix | `!leaderboard` | Everyone | Ranks all active guild members based on total checked-in shift hours this month. |
| **Leaderboard (Slash)**| Slash | `/leaderboard` | Everyone | Slash command counterpart to display current active rankings. |

---

## 📌 Sticky Messages
Ensure critical alerts, instructions, or rules stay visible by re-sending them automatically at the bottom of a channel.

| Command | Type | Usage | Permissions | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Create Sticky** | Prefix | `!sticky <message>` | Manage Messages | Spawns a sticky anchor message in the channel that re-posts itself at the bottom. |
| **Create Sticky (Slash)**| Slash | `/sticky set message:<msg>` | Manage Messages | Slash command counterpart to configure a dynamic sticky prompt. |
| **Remove Sticky** | Prefix | `!unsticky` | Manage Messages | Disables and cleans up active sticky posts in the current channel. |

---

## 🎧 24/7 Lofi Streamer
Bring relaxing background music, lofi beats, and focus vibes straight into your voice channels.

| Command | Type | Usage | Permissions | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Play Lofi** | Prefix | `!lofi` | Everyone | Summons the bot to your current voice channel to stream relaxing 24/7 lofi hip-hop. |
| **Play Lofi (Slash)** | Slash | `/lofi join` | Everyone | Slash command counterpart to start the voice channel streaming stream. |
| **Stop Stream** | Prefix | `!stop` | Everyone | Disconnects the voice client and halts music streaming. |

---

## 🔥 Chat Revival & Social Tools
Whip up active conversations, debate prompts, or questions to break ice and keep chat channels flowing.

| Command | Type | Usage | Permissions | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Revive Chat** | Prefix | `!revive` | Everyone | Generates an engaging conversation starter or mini-game prompt to spark discussion. |
| **Random Topic** | Prefix | `!topic` | Everyone | Broadcasts a quirky topic, debate prompt, or "Would you rather" challenge. |

---

## 🧠 Brainrot & Memes
Chaotic, hyper-modern Gen-Z humor generators for casual banter and entertainment.

| Command | Type | Usage | Permissions | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Brainrot** | Prefix | `!brainrot` | Everyone | Generates chaotic, slang-infused stories, Rizz checks, and community jokes. |
| **Brainrot (Slash)** | Slash | `/brainrot` | Everyone | Slash command counterpart to initiate meme chaos. |

---

## 🛡️ Moderation Utility
A fast and secure operations deck for staff to regulate chat corridors and user presence.

| Command | Type | Usage | Permissions | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Kick Member** | Prefix | `!kick <@user> [reason]`| Kick Members | Kicks a specified member from the server corridor. User is free to rejoin. |
| **Ban Member** | Prefix | `!ban <@user> [reason]` | Ban Members | Permanently bans a specified user and purges recent messages. |
| **Purge Chat** | Prefix | `!purge <amount>` | Manage Messages | Mass-deletes up to 100 messages to clean up spam in a text channel. |
| **Timeout (Slash)** | Slash | `/timeout user:<@user> duration:<time> [reason]` | Moderate Members | Temporarily puts a user in timeout, stripping their chat privileges. |
