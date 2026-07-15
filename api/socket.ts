import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";

export interface ChatMessage {
  id: string;
  text: string;
  user: {
    id: string;
    username: string;
    global_name: string | null;
    avatar: string | null;
    isGuest?: boolean;
    color?: string; // For guest users to have unique color tags
  };
  timestamp: number;
  photoUrl?: string;
  voicemailUrl?: string;
  videoUrl?: string;
}

export interface ActiveUser {
  socketId: string;
  user: {
    id: string;
    username: string;
    global_name: string | null;
    avatar: string | null;
    isGuest?: boolean;
    color?: string;
  };
}

const MAX_MESSAGES = 100;
const messagesHistory: ChatMessage[] = [
  {
    id: "system-1",
    text: "🌍 Welcome to the ONE. World Chat! Open another tab or browser window to test live real-time communication between users.",
    user: {
      id: "system",
      username: "ONE. System",
      global_name: "ONE Bot",
      avatar: null,
      isGuest: false
    },
    timestamp: Date.now() - 3600000
  }
];

const connectedSockets = new Map<string, ActiveUser>();
let ioInstance: SocketIOServer | null = null;
let isChatLocked = false;

export function notifyConfigSync(guildId: string, updatedConfig: any) {
  if (ioInstance) {
    ioInstance.emit("config:sync", { guildId, config: updatedConfig, timestamp: Date.now() });
  }
}

export function initSocket(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  ioInstance = io;

  io.on("connection", (socket) => {
    // 1. Send chat history to the newly connected client
    socket.emit("chat:history", messagesHistory);
    socket.emit("chat:lock", isChatLocked);

    // 2. Handle a user joining the chat
    socket.on("chat:join", (user) => {
      if (!user || !user.id) return;

      const activeUser: ActiveUser = {
        socketId: socket.id,
        user: {
          id: user.id,
          username: user.username || "Anonymous",
          global_name: user.global_name || null,
          avatar: user.avatar || null,
          isGuest: !!user.isGuest,
          color: user.color || "#3B82F6"
        }
      };

      connectedSockets.set(socket.id, activeUser);

      // Broadcast updated active user list
      broadcastActiveUsers(io);

      // System notification: user joined (limited to avoid spam, but nice for feedback)
      const systemMsg: ChatMessage = {
        id: `sys-join-${Date.now()}`,
        text: `⚡️ ${user.global_name || user.username} joined the World Chat!`,
        user: {
          id: "system",
          username: "ONE. System",
          global_name: "ONE Bot",
          avatar: null,
          isGuest: false
        },
        timestamp: Date.now()
      };
      // Keep system join notifications in history? Usually too spammy for history, just emit live
      io.emit("chat:message", systemMsg);
    });

    // Handle chat lock state change
    socket.on("chat:lock", (locked: boolean) => {
      isChatLocked = locked;
      io.emit("chat:lock", isChatLocked);

      // Broadcast system notice about lock state change
      const systemMsg: ChatMessage = {
        id: `sys-lock-${Date.now()}`,
        text: locked ? "🔒 The World Chat room has been locked by a moderator." : "🔓 The World Chat room has been unlocked.",
        user: {
          id: "system",
          username: "ONE. System",
          global_name: "ONE Bot",
          avatar: null,
          isGuest: false
        },
        timestamp: Date.now()
      };
      messagesHistory.push(systemMsg);
      if (messagesHistory.length > MAX_MESSAGES) {
        messagesHistory.shift();
      }
      io.emit("chat:message", systemMsg);
    });

    // 3. Handle sending a message
    socket.on("chat:message", (messageData: { text?: string; user: any; photoUrl?: string; voicemailUrl?: string; videoUrl?: string }) => {
      if (!messageData || !messageData.user) return;
      if (isChatLocked) return; // Prevent sending if locked

      const text = (messageData.text || "").trim();
      const hasContent = text || messageData.photoUrl || messageData.voicemailUrl || messageData.videoUrl;
      if (!hasContent) return;

      const newMessage: ChatMessage = {
        id: Math.random().toString(36).substring(2, 11),
        text: text.substring(0, 1000), // Allow up to 1000 chars
        user: {
          id: messageData.user.id,
          username: messageData.user.username,
          global_name: messageData.user.global_name || null,
          avatar: messageData.user.avatar || null,
          isGuest: !!messageData.user.isGuest,
          color: messageData.user.color || "#3B82F6"
        },
        timestamp: Date.now(),
        photoUrl: messageData.photoUrl,
        voicemailUrl: messageData.voicemailUrl,
        videoUrl: messageData.videoUrl
      };

      messagesHistory.push(newMessage);
      if (messagesHistory.length > MAX_MESSAGES) {
        messagesHistory.shift();
      }

      // Broadcast message to everyone
      io.emit("chat:message", newMessage);
    });

    // 4. Handle typing indicator
    socket.on("chat:typing", (data: { user: any; isTyping: boolean }) => {
      socket.broadcast.emit("chat:typing", data);
    });

    // 5. Handle disconnection
    socket.on("disconnect", () => {
      const leavingUser = connectedSockets.get(socket.id);
      if (leavingUser) {
        connectedSockets.delete(socket.id);
        broadcastActiveUsers(io);
        
        // System message of departure
        const systemMsg: ChatMessage = {
          id: `sys-leave-${Date.now()}`,
          text: `🚪 ${leavingUser.user.global_name || leavingUser.user.username} left the chat.`,
          user: {
            id: "system",
            username: "ONE. System",
            global_name: "ONE Bot",
            avatar: null,
            isGuest: false
          },
          timestamp: Date.now()
        };
        io.emit("chat:message", systemMsg);
      }
    });
  });

  return io;
}

function broadcastActiveUsers(io: SocketIOServer) {
  // Extract unique users
  const uniqueUsersMap = new Map<string, any>();
  for (const active of connectedSockets.values()) {
    uniqueUsersMap.set(active.user.id, active.user);
  }
  const usersList = Array.from(uniqueUsersMap.values());
  io.emit("chat:users", usersList);
}
