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

    // 3. Handle sending a message
    socket.on("chat:message", (messageData: { text: string; user: any }) => {
      if (!messageData || !messageData.text || !messageData.user) return;

      const newMessage: ChatMessage = {
        id: Math.random().toString(36).substring(2, 11),
        text: messageData.text.trim().substring(0, 500), // Protect against massive payloads
        user: {
          id: messageData.user.id,
          username: messageData.user.username,
          global_name: messageData.user.global_name || null,
          avatar: messageData.user.avatar || null,
          isGuest: !!messageData.user.isGuest,
          color: messageData.user.color || "#3B82F6"
        },
        timestamp: Date.now()
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
