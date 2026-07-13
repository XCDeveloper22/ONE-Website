export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  global_name: string | null;
  email?: string;
}

export interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
  features: string[];
  approximate_member_count?: number;
  approximate_presence_count?: number;
}

export interface DiscordConnection {
  type: string;
  id: string;
  name: string;
  visibility: number;
  friend_sync: boolean;
  show_activity: boolean;
  verified: boolean;
}

export interface DiscordFriend {
  id: string;
  type: number;
  nickname: string | null;
  user: {
    id: string;
    username: string;
    avatar: string | null;
    global_name: string | null;
  };
}
