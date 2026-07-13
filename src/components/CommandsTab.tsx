import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Code2, Search, Copy, Check, Terminal, Play, Sliders, Calendar, Music, 
  MessageSquare, ShieldAlert, Sparkles, Pin, Trash2, HelpCircle, UserCheck, RefreshCw
} from 'lucide-react';

interface Command {
  name: string;
  trigger: string;
  type: 'prefix' | 'slash';
  category: 'attendance' | 'sticky' | 'lofi' | 'revival' | 'brainrot' | 'moderation';
  description: string;
  usage: string;
  args?: string[];
  permissions?: string;
  demoResponse: {
    userMsg: string;
    botMsgs: Array<{
      type: 'text' | 'embed' | 'voice';
      content?: string;
      embed?: {
        title?: string;
        description?: string;
        color?: string;
        fields?: Array<{ name: string; value: string; inline?: boolean }>;
        footer?: string;
      };
    }>;
  };
}

const commandsData: Command[] = [
  // Attendance System
  {
    name: 'Clock In',
    trigger: '!in',
    type: 'prefix',
    category: 'attendance',
    description: 'Check in for the day. Starts your shift tracker and increments your consecutive attendance streak.',
    usage: '!in [optional notes]',
    args: ['notes'],
    demoResponse: {
      userMsg: '!in working on dashboard',
      botMsgs: [
        {
          type: 'embed',
          embed: {
            title: '📅 Attendance Clock-In',
            description: 'Successfully checked in for today!',
            color: '#10B981',
            fields: [
              { name: 'User', value: 'Xander#0001', inline: true },
              { name: 'Time', value: '05:59 AM UTC', inline: true },
              { name: 'Streak', value: '🔥 5 Days', inline: true },
              { name: 'Notes', value: '"working on dashboard"', inline: false }
            ],
            footer: 'ONE Attendance System • Keep up the streak!'
          }
        }
      ]
    }
  },
  {
    name: 'Clock In (Slash)',
    trigger: '/in',
    type: 'slash',
    category: 'attendance',
    description: 'Slash version of checking in for the day to log attendance.',
    usage: '/in [notes]',
    args: ['notes'],
    demoResponse: {
      userMsg: '/in notes: Coding',
      botMsgs: [
        {
          type: 'embed',
          embed: {
            title: '📅 Attendance Clock-In',
            description: 'Successfully checked in via slash command!',
            color: '#10B981',
            fields: [
              { name: 'User', value: 'Xander#0001', inline: true },
              { name: 'Time', value: '05:59 AM UTC', inline: true },
              { name: 'Streak', value: '🔥 5 Days', inline: true }
            ],
            footer: 'ONE Attendance System'
          }
        }
      ]
    }
  },
  {
    name: 'Clock Out',
    trigger: '!out',
    type: 'prefix',
    category: 'attendance',
    description: 'Check out for the day. Calculates your total checked-in hours for your shift.',
    usage: '!out',
    demoResponse: {
      userMsg: '!out',
      botMsgs: [
        {
          type: 'embed',
          embed: {
            title: '📅 Attendance Clock-Out',
            description: 'Successfully checked out. Great work today!',
            color: '#EF4444',
            fields: [
              { name: 'User', value: 'Xander#0001', inline: true },
              { name: 'Duration', value: '⏱️ 8 hrs 32 mins', inline: true },
              { name: 'Status', value: 'Completed', inline: true }
            ],
            footer: 'ONE Attendance System'
          }
        }
      ]
    }
  },
  {
    name: 'Clock Out (Slash)',
    trigger: '/out',
    type: 'slash',
    category: 'attendance',
    description: 'Slash version of clocking out for the day.',
    usage: '/out',
    demoResponse: {
      userMsg: '/out',
      botMsgs: [
        {
          type: 'embed',
          embed: {
            title: '📅 Attendance Clock-Out',
            description: 'Successfully checked out via slash command!',
            color: '#EF4444',
            fields: [
              { name: 'User', value: 'Xander#0001', inline: true },
              { name: 'Duration', value: '⏱️ 8 hrs 32 mins', inline: true }
            ],
            footer: 'ONE Attendance System'
          }
        }
      ]
    }
  },
  {
    name: 'Attendance Stats',
    trigger: '!stats',
    type: 'prefix',
    category: 'attendance',
    description: 'View your attendance records, total tracked hours, streak, and monthly average.',
    usage: '!stats [@user]',
    args: ['user'],
    demoResponse: {
      userMsg: '!stats',
      botMsgs: [
        {
          type: 'embed',
          embed: {
            title: '📊 Attendance Dashboard',
            description: 'Personal records for **Xander#0001**',
            color: '#3B82F6',
            fields: [
              { name: 'Total Days Check-In', value: '📅 42 Days', inline: true },
              { name: 'Consecutive Streak', value: '🔥 5 Days', inline: true },
              { name: 'Monthly Hours', value: '⏱️ 164.5 hrs', inline: true },
              { name: 'Uptime Grade', value: '⭐️ A+ Excellent', inline: true }
            ],
            footer: 'ONE Attendance System'
          }
        }
      ]
    }
  },
  {
    name: 'Attendance Stats (Slash)',
    trigger: '/stats',
    type: 'slash',
    category: 'attendance',
    description: 'Slash version to view detailed attendance statistics and shift history.',
    usage: '/stats [user]',
    args: ['user'],
    demoResponse: {
      userMsg: '/stats user: @Xander',
      botMsgs: [
        {
          type: 'embed',
          embed: {
            title: '📊 Attendance Dashboard',
            description: 'Personal records for **Xander#0001**',
            color: '#3B82F6',
            fields: [
              { name: 'Total Days Check-In', value: '📅 42 Days', inline: true },
              { name: 'Consecutive Streak', value: '🔥 5 Days', inline: true }
            ],
            footer: 'ONE Attendance System'
          }
        }
      ]
    }
  },
  {
    name: 'Attendance Leaderboard',
    trigger: '!leaderboard',
    type: 'prefix',
    category: 'attendance',
    description: 'Display the server-wide attendance ranking leaderboard based on total shift hours.',
    usage: '!leaderboard',
    demoResponse: {
      userMsg: '!leaderboard',
      botMsgs: [
        {
          type: 'embed',
          embed: {
            title: '🏆 Attendance Leaderboard',
            description: 'Top active members in **ONE. Community** this month:\n\n🥇 **Xander#0001** — 184 hrs (5 days streak)\n🥈 **SpammyJoe#1234** — 172 hrs (3 days streak)\n🥉 **MemeLord#8888** — 145 hrs (0 days streak)\n4️⃣ **SilentNinja#2468** — 112 hrs (1 day streak)\n5️⃣ **CasualDino#4321** — 94 hrs (2 days streak)',
            color: '#F59E0B',
            footer: 'Updated 10 minutes ago • ONE Attendance'
          }
        }
      ]
    }
  },
  {
    name: 'Attendance Leaderboard (Slash)',
    trigger: '/leaderboard',
    type: 'slash',
    category: 'attendance',
    description: 'Slash version to view the server attendance ranking board.',
    usage: '/leaderboard',
    demoResponse: {
      userMsg: '/leaderboard',
      botMsgs: [
        {
          type: 'embed',
          embed: {
            title: '🏆 Attendance Leaderboard',
            description: 'Top active members in **ONE. Community** this month:\n\n🥇 **Xander#0001** — 184 hrs\n🥈 **SpammyJoe#1234** — 172 hrs\n🥉 **MemeLord#8888** — 145 hrs',
            color: '#F59E0B',
            footer: 'ONE Attendance'
          }
        }
      ]
    }
  },

  // Sticky Messages
  {
    name: 'Create Sticky Message',
    trigger: '!sticky',
    type: 'prefix',
    category: 'sticky',
    description: 'Spawns a sticky message in the current channel. The bot keeps re-posting it at the very bottom whenever new messages arrive.',
    usage: '!sticky <message_content>',
    args: ['message_content'],
    permissions: 'Manage Messages',
    demoResponse: {
      userMsg: '!sticky Read the rules in #rules!',
      botMsgs: [
        {
          type: 'text',
          content: '📌 **Sticky Message Created!** The following message will stay pinned at the bottom of this channel.'
        },
        {
          type: 'embed',
          embed: {
            title: '📌 Notice',
            description: 'Read the rules in <#rules>!',
            color: '#3B82F6',
            footer: 'Sticky Message • Automatically reposted at bottom'
          }
        }
      ]
    }
  },
  {
    name: 'Remove Sticky Message',
    trigger: '!unsticky',
    type: 'prefix',
    category: 'sticky',
    description: 'Removes any active sticky messages from the current channel.',
    usage: '!unsticky',
    permissions: 'Manage Messages',
    demoResponse: {
      userMsg: '!unsticky',
      botMsgs: [
        {
          type: 'text',
          content: '🗑️ **Sticky message successfully removed** from this channel!'
        }
      ]
    }
  },
  {
    name: 'Create Sticky (Slash)',
    trigger: '/sticky set',
    type: 'slash',
    category: 'sticky',
    description: 'Slash command to create a sticky message in the channel.',
    usage: '/sticky set message:<content>',
    args: ['message'],
    permissions: 'Manage Messages',
    demoResponse: {
      userMsg: '/sticky set message: Welcome!',
      botMsgs: [
        {
          type: 'embed',
          embed: {
            title: '📌 Welcome to the Server!',
            description: 'Glad to have you here! Please be respectful in chat.',
            color: '#3B82F6',
            footer: 'Sticky message'
          }
        }
      ]
    }
  },

  // Lofi & Voice Streaming
  {
    name: 'Play 24/7 Lofi',
    trigger: '!lofi',
    type: 'prefix',
    category: 'lofi',
    description: 'Summons the bot to your current voice channel to stream relaxing 24/7 lofi hip-hop radio beats.',
    usage: '!lofi',
    demoResponse: {
      userMsg: '!lofi',
      botMsgs: [
        {
          type: 'text',
          content: '🎧 Joining voice channel **#Lounge-1**...'
        },
        {
          type: 'embed',
          embed: {
            title: '🎶 Streaming 24/7 Lofi Radio',
            description: 'Now streaming continuous lofi beats for studying, relaxing, or coding. Enjoy the vibes! ☕️',
            color: '#8B5CF6',
            fields: [
              { name: 'Channel', value: '🔊 lounge-1', inline: true },
              { name: 'Bitrate', value: '⚡️ 128 kbps', inline: true },
              { name: 'Mode', value: '🔄 24/7 Stream', inline: true }
            ],
            footer: 'ONE Music Streaming'
          }
        }
      ]
    }
  },
  {
    name: 'Stop Lofi Stream',
    trigger: '!stop',
    type: 'prefix',
    category: 'lofi',
    description: 'Disconnects the bot from the voice channel and stops streaming music.',
    usage: '!stop',
    demoResponse: {
      userMsg: '!stop',
      botMsgs: [
        {
          type: 'text',
          content: '⏹️ Stopped music playback and disconnected from the voice channel.'
        }
      ]
    }
  },
  {
    name: 'Lofi Join (Slash)',
    trigger: '/lofi join',
    type: 'slash',
    category: 'lofi',
    description: 'Slash command to summon bot to stream 24/7 lofi radio.',
    usage: '/lofi join',
    demoResponse: {
      userMsg: '/lofi join',
      botMsgs: [
        {
          type: 'embed',
          embed: {
            title: '🎧 Connected to Voice',
            description: 'Now streaming **24/7 Lofi Chill Beats** in your channel.',
            color: '#8B5CF6',
            footer: 'ONE Music'
          }
        }
      ]
    }
  },

  // Chat Revival Tools
  {
    name: 'Revive Chat Prompt',
    trigger: '!revive',
    type: 'prefix',
    category: 'revival',
    description: 'Generates a highly engaging conversation starter or mini-game topic to rescue quiet, inactive chat rooms.',
    usage: '!revive',
    demoResponse: {
      userMsg: '!revive',
      botMsgs: [
        {
          type: 'embed',
          embed: {
            title: '🔥 Chat Revival Trigger!',
            description: 'Let\'s wake up this chat! Here is a question for everyone:\n\n**"If you had to survive on a deserted island with only 3 items currently in your bedroom, what are you bringing?"**',
            color: '#EF4444',
            footer: 'Reply to this message with your thoughts!'
          }
        }
      ]
    }
  },
  {
    name: 'Random Topic Query',
    trigger: '!topic',
    type: 'prefix',
    category: 'revival',
    description: 'Generates a random prompt, question, or "Would you rather" challenge for general chatting.',
    usage: '!topic',
    demoResponse: {
      userMsg: '!topic',
      botMsgs: [
        {
          type: 'text',
          content: '🤔 **Would you rather:** Have your internet browser history made public, or never be allowed to use the internet again?'
        }
      ]
    }
  },

  // Meme / Brainrot
  {
    name: 'Generate Brainrot',
    trigger: '!brainrot',
    type: 'prefix',
    category: 'brainrot',
    description: 'Triggers random chaotic meme generators that output hyper-modern Gen-Z slang / "brainrot" stories or sound effects.',
    usage: '!brainrot',
    demoResponse: {
      userMsg: '!brainrot',
      botMsgs: [
        {
          type: 'text',
          content: '🧠 *Determining your Rizz levels...*'
        },
        {
          type: 'embed',
          embed: {
            title: '🚽 Brainrot Generator',
            description: '🚨 **BREAKING NEWS** 🚨\nBaby Gronk just Fanum Taxed the Rizzler at the Ohio Skibidi Toilet! Kai Cenat is shaking in his boots as we speak. Is this the end of the Sigma grindset? level 10 Gyatt detected. Hawk Tuah is the new standard.',
            color: '#F59E0B',
            footer: 'Rizz rating: 100/100 (W Rizz)'
          }
        }
      ]
    }
  },
  {
    name: 'Brainrot (Slash)',
    trigger: '/brainrot',
    type: 'slash',
    category: 'brainrot',
    description: 'Slash version of the chaotic Gen-Z brainrot generator.',
    usage: '/brainrot',
    demoResponse: {
      userMsg: '/brainrot',
      botMsgs: [
        {
          type: 'text',
          content: '💀 **OHIO CHRONICLES:** Sigma alpha wolf detected in general chat! Only true rizzlers can fanum tax this message.'
        }
      ]
    }
  },

  // Moderation Utility
  {
    name: 'Kick Member',
    trigger: '!kick',
    type: 'prefix',
    category: 'moderation',
    description: 'Kicks a specified member from the server. Member can join back with an active invite code.',
    usage: '!kick <@user> [reason]',
    args: ['user', 'reason'],
    permissions: 'Kick Members',
    demoResponse: {
      userMsg: '!kick @SpammyJoe Spamming invites',
      botMsgs: [
        {
          type: 'embed',
          embed: {
            title: '🛡️ Member Kicked',
            description: 'Successfully kicked user from the server.',
            color: '#EF4444',
            fields: [
              { name: 'Kicked User', value: 'SpammyJoe#1234', inline: true },
              { name: 'Moderator', value: 'Xander#0001', inline: true },
              { name: 'Reason', value: 'Spamming invites in general', inline: false }
            ],
            footer: 'ONE Moderation Services'
          }
        }
      ]
    }
  },
  {
    name: 'Ban Member',
    trigger: '!ban',
    type: 'prefix',
    category: 'moderation',
    description: 'Permanently bans a specified member from the server to prevent re-joining.',
    usage: '!ban <@user> [reason]',
    args: ['user', 'reason'],
    permissions: 'Ban Members',
    demoResponse: {
      userMsg: '!ban @RaidBot Malicious token spam',
      botMsgs: [
        {
          type: 'embed',
          embed: {
            title: '🛡️ Member Banned',
            description: 'Permanently banned user and purged 7 days of message history.',
            color: '#7F1D1D',
            fields: [
              { name: 'Banned User', value: 'RaidBot#9999', inline: true },
              { name: 'Moderator', value: 'Xander#0001', inline: true },
              { name: 'Reason', value: 'Malicious token raid attempt', inline: false }
            ],
            footer: 'ONE Moderation Services'
          }
        }
      ]
    }
  },
  {
    name: 'Purge Messages',
    trigger: '!purge',
    type: 'prefix',
    category: 'moderation',
    description: 'Bulk deletes up to 100 recent messages in the current text channel.',
    usage: '!purge <amount>',
    args: ['amount'],
    permissions: 'Manage Messages',
    demoResponse: {
      userMsg: '!purge 15',
      botMsgs: [
        {
          type: 'text',
          content: '🧹 Deleted **15** messages from this channel!'
        }
      ]
    }
  },
  {
    name: 'Timeout / Mute',
    trigger: '/timeout',
    type: 'slash',
    category: 'moderation',
    description: 'Mutes a user for a set duration, blocking them from sending messages or joining voice channels.',
    usage: '/timeout user:<@user> duration:<time> [reason]',
    args: ['user', 'duration', 'reason'],
    permissions: 'Moderate Members',
    demoResponse: {
      userMsg: '/timeout user: @AnnoyingTroll duration: 1h reason: spamming capslock',
      botMsgs: [
        {
          type: 'embed',
          embed: {
            title: '🛡️ Member Timed Out',
            description: 'User has been placed in timeout.',
            color: '#F59E0B',
            fields: [
              { name: 'User', value: 'AnnoyingTroll#1111', inline: true },
              { name: 'Duration', value: '⏱️ 1 Hour', inline: true },
              { name: 'Reason', value: 'spamming capslock', inline: false }
            ],
            footer: 'ONE Moderation Services'
          }
        }
      ]
    }
  }
];

export default function CommandsTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [triggerType, setTriggerType] = useState<'all' | 'prefix' | 'slash'>('all');
  const [copiedTrigger, setCopiedTrigger] = useState<string | null>(null);
  
  // Interactive simulator console states
  const [activeDemoCmd, setActiveDemoCmd] = useState<Command | null>(commandsData[0]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedLogs, setSimulatedLogs] = useState<Array<{ sender: 'user' | 'bot'; type: 'text' | 'embed'; text?: string; embed?: any }>>([
    { sender: 'user', type: 'text', text: '!in working on dashboard' },
    {
      sender: 'bot',
      type: 'embed',
      embed: {
        title: '📅 Attendance Clock-In',
        description: 'Successfully checked in for today!',
        color: '#10B981',
        fields: [
          { name: 'User', value: 'Xander#0001', inline: true },
          { name: 'Time', value: '05:59 AM UTC', inline: true },
          { name: 'Streak', value: '🔥 5 Days', inline: true },
          { name: 'Notes', value: '"working on dashboard"', inline: false }
        ],
        footer: 'ONE Attendance System • Keep up the streak!'
      }
    }
  ]);

  const handleCopyTrigger = (trigger: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(trigger);
    setCopiedTrigger(trigger);
    setTimeout(() => setCopiedTrigger(null), 2000);
  };

  const categories = [
    { id: 'all', label: 'All Modules', icon: HelpCircle },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'sticky', label: 'Sticky Messages', icon: Pin },
    { id: 'lofi', label: 'Lofi Voice', icon: Music },
    { id: 'revival', label: 'Chat Revival', icon: MessageSquare },
    { id: 'brainrot', label: 'Brainrot Meme', icon: Sparkles },
    { id: 'moderation', label: 'Moderation', icon: ShieldAlert },
  ];

  const filteredCommands = commandsData.filter(cmd => {
    const matchesSearch = cmd.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          cmd.trigger.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          cmd.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = activeCategory === 'all' || cmd.category === activeCategory;
    const matchesType = triggerType === 'all' || cmd.type === triggerType;

    return matchesSearch && matchesCategory && matchesType;
  });

  const runSimulation = (cmd: Command) => {
    if (isSimulating) return;
    setActiveDemoCmd(cmd);
    setIsSimulating(true);
    
    // Clear terminal and append user command first
    setSimulatedLogs([
      { sender: 'user', type: 'text', text: cmd.demoResponse.userMsg }
    ]);

    // Fast delays for simulated bot response typing and rendering
    let delayIndex = 0;
    cmd.demoResponse.botMsgs.forEach((botMsg) => {
      delayIndex++;
      setTimeout(() => {
        setSimulatedLogs(prev => [
          ...prev,
          {
            sender: 'bot',
            type: botMsg.type === 'embed' ? 'embed' : 'text',
            text: botMsg.content,
            embed: botMsg.embed
          }
        ]);
        if (delayIndex === cmd.demoResponse.botMsgs.length) {
          setIsSimulating(false);
        }
      }, delayIndex * 700);
    });
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Controls */}
      <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/60 p-5 rounded-3xl flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search bot commands (e.g. !in, sticky, lofi)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl pl-11 pr-4 py-3 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-all shadow-inner"
            />
          </div>

          {/* Type trigger filter */}
          <div className="flex gap-1.5 bg-zinc-950/80 border border-zinc-800/80 p-1 rounded-2xl shadow-inner shrink-0 self-start md:self-auto">
            {[
              { id: 'all' as const, label: 'All Triggers' },
              { id: 'prefix' as const, label: 'Prefix (!)' },
              { id: 'slash' as const, label: 'Slash (/)' }
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => setTriggerType(type.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${triggerType === type.id ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'}`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Categories sliding rail */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border whitespace-nowrap transition-all duration-200 shrink-0 ${activeCategory === cat.id ? 'bg-blue-500/10 border-blue-500/40 text-blue-400' : 'bg-zinc-950/30 border-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'}`}
            >
              <cat.icon className="w-4 h-4 shrink-0" />
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Commands and Mock Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Commands List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-bold text-base md:text-lg tracking-tight">
              Command References 
              <span className="text-zinc-500 font-mono text-xs ml-2">({filteredCommands.length} found)</span>
            </h3>
            <span className="text-[10px] tracking-widest font-black uppercase text-blue-500 flex items-center gap-1.5 bg-blue-500/5 border border-blue-500/10 px-3 py-1 rounded-full">
              <Code2 className="w-3.5 h-3.5" />
              Prefix: `!`
            </span>
          </div>

          <div className="space-y-3.5 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
            {filteredCommands.length === 0 ? (
              <div className="text-center p-12 bg-zinc-900/10 border border-zinc-800/40 rounded-3xl text-zinc-500">
                <HelpCircle className="w-10 h-10 mx-auto mb-3 opacity-25" />
                <p className="text-sm">No commands match your filters.</p>
                <button 
                  onClick={() => { setSearchTerm(''); setActiveCategory('all'); setTriggerType('all'); }} 
                  className="mt-3 text-xs text-blue-400 hover:underline font-bold"
                >
                  Reset all filters
                </button>
              </div>
            ) : (
              filteredCommands.map((cmd) => (
                <motion.div
                  layoutId={`cmd-${cmd.trigger}`}
                  key={cmd.trigger}
                  onClick={() => runSimulation(cmd)}
                  className="bg-zinc-900/30 border border-zinc-800/60 hover:border-zinc-700/80 p-4.5 rounded-2xl flex items-start gap-4 hover:bg-zinc-900/50 cursor-pointer group transition-all"
                >
                  {/* Category mini icon */}
                  <div className="w-10 h-10 rounded-xl bg-zinc-950/80 border border-zinc-800/60 flex items-center justify-center shrink-0 group-hover:border-zinc-700">
                    {cmd.category === 'attendance' && <Calendar className="w-5 h-5 text-emerald-400" />}
                    {cmd.category === 'sticky' && <Pin className="w-5 h-5 text-blue-400" />}
                    {cmd.category === 'lofi' && <Music className="w-5 h-5 text-purple-400" />}
                    {cmd.category === 'revival' && <MessageSquare className="w-5 h-5 text-red-400" />}
                    {cmd.category === 'brainrot' && <Sparkles className="w-5 h-5 text-amber-400" />}
                    {cmd.category === 'moderation' && <ShieldAlert className="w-5 h-5 text-amber-500" />}
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-black text-white bg-zinc-950 border border-zinc-800 px-2 py-0.5 rounded-md group-hover:text-blue-400 transition-colors">
                        {cmd.trigger}
                      </span>
                      <span className="text-zinc-300 font-bold text-sm tracking-tight">{cmd.name}</span>
                      <span className={`text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded border shrink-0 ${cmd.type === 'slash' ? 'bg-purple-500/10 text-purple-400 border-purple-500/25' : 'bg-blue-500/10 text-blue-400 border-blue-500/25'}`}>
                        {cmd.type}
                      </span>
                      {cmd.permissions && (
                        <span className="text-[9px] font-bold text-zinc-500 bg-zinc-900 border border-zinc-850 px-1.5 py-0.5 rounded shrink-0">
                          ⚙️ {cmd.permissions}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{cmd.description}</p>
                    
                    <div className="font-mono text-[10px] text-zinc-500 mt-3 flex items-center gap-1.5 truncate">
                      <span className="text-zinc-600">Usage:</span>
                      <span className="bg-zinc-950 px-2 py-1 rounded border border-zinc-850 text-zinc-400 select-all font-mono">{cmd.usage}</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={(e) => handleCopyTrigger(cmd.trigger, e)}
                      className="p-1.5 bg-zinc-950/60 border border-zinc-800 rounded-lg text-zinc-500 hover:text-white hover:border-zinc-700 transition-all"
                      title="Copy command"
                    >
                      {copiedTrigger === cmd.trigger ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      className="p-1.5 bg-zinc-950/60 border border-zinc-800 rounded-lg text-zinc-500 group-hover:text-blue-400 group-hover:border-blue-500/30 transition-all"
                      title="Simulate output"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Mock Discord Simulator Terminal */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-bold text-base md:text-lg tracking-tight flex items-center gap-2">
              <Terminal className="w-5 h-5 text-blue-400" />
              Discord Live Console
            </h3>
            <button 
              onClick={() => activeDemoCmd && runSimulation(activeDemoCmd)}
              disabled={isSimulating || !activeDemoCmd}
              className="flex items-center gap-1 text-[10px] bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 px-2.5 py-1 rounded-lg active:scale-95 disabled:opacity-50 transition-all font-bold"
            >
              <RefreshCw className={`w-3 h-3 ${isSimulating ? 'animate-spin' : ''}`} />
              Re-run Demo
            </button>
          </div>

          <div className="bg-[#2b2d31] rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl flex flex-col h-[490px]">
            {/* Mock Discord Channel Top bar */}
            <div className="bg-[#313338] px-4.5 py-3 border-b border-[#1f2023] flex items-center gap-2">
              <span className="text-[#949ba4] font-black text-xl">#</span>
              <span className="text-white font-bold text-sm tracking-tight">bot-playground</span>
              <span className="text-[#949ba4] text-xs font-semibold px-2 py-0.5 rounded bg-[#2b2d31] ml-auto">ONE Bot Core</span>
            </div>

            {/* Chat message content box */}
            <div className="flex-1 overflow-y-auto p-4.5 space-y-4 font-sans select-none custom-scrollbar">
              
              {/* Help tip when idle */}
              {!isSimulating && simulatedLogs.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#949ba4]">
                  <HelpCircle className="w-10 h-10 mb-2 opacity-30 text-blue-400" />
                  <p className="text-xs font-medium max-w-xs">
                    Select any command on the left or click the <Play className="w-3 h-3 inline fill-current text-zinc-400" /> button to simulate live bot output in this chat console.
                  </p>
                </div>
              )}

              {simulatedLogs.map((log, index) => {
                if (log.sender === 'user') {
                  return (
                    <div key={index} className="flex gap-4 items-start group">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-[#5865f2] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-md">
                        XD
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-white font-bold text-sm hover:underline cursor-pointer">Xander#0001</span>
                          <span className="text-[10px] text-[#949ba4] font-medium">Today at 05:59 AM</span>
                        </div>
                        <p className="text-[#dbdee1] text-sm mt-1 font-mono bg-[#1e1f22] px-2 py-1 rounded inline-block border border-zinc-800">{log.text}</p>
                      </div>
                    </div>
                  );
                } else {
                  // Bot Message
                  return (
                    <div key={index} className="flex gap-4 items-start">
                      {/* Bot Avatar */}
                      <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-lg relative">
                        1.
                        <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-3 h-3 rounded-full border-2 border-[#2b2d31]"></div>
                      </div>
                      
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold text-sm">ONE</span>
                          <span className="bg-[#5865f2] text-white text-[9px] font-black px-1 py-0.5 rounded uppercase tracking-wider scale-90">BOT</span>
                          <span className="text-[10px] text-[#949ba4] font-medium">Today at 05:59 AM</span>
                        </div>

                        {/* Standard text message */}
                        {log.text && (
                          <p className="text-[#dbdee1] text-sm leading-relaxed">{log.text}</p>
                        )}

                        {/* Embed Message Card */}
                        {log.embed && (
                          <div 
                            className="border-l-4 rounded bg-[#1e1f22] p-4.5 max-w-md shadow-lg" 
                            style={{ borderColor: log.embed.color || '#3B82F6' }}
                          >
                            {log.embed.title && (
                              <h4 className="text-white font-bold text-base tracking-tight mb-2">{log.embed.title}</h4>
                            )}
                            {log.embed.description && (
                              <p className="text-[#dbdee1] text-xs leading-relaxed whitespace-pre-line mb-3.5">{log.embed.description}</p>
                            )}
                            
                            {/* Embed Fields */}
                            {log.embed.fields && log.embed.fields.length > 0 && (
                              <div className="grid grid-cols-2 gap-3.5 my-2">
                                {log.embed.fields.map((f: any, fi: number) => (
                                  <div key={fi} className={f.inline ? "col-span-1 min-w-0" : "col-span-2 min-w-0"}>
                                    <span className="text-[#949ba4] text-[10px] uppercase font-bold tracking-wider block">{f.name}</span>
                                    <span className="text-white text-xs font-semibold mt-0.5 block truncate whitespace-pre-line">{f.value}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {log.embed.footer && (
                              <div className="text-[10px] text-[#949ba4] mt-3 pt-2.5 border-t border-[#2b2d31] font-medium">
                                {log.embed.footer}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
              })}

              {/* Bot typing simulator */}
              {isSimulating && simulatedLogs[simulatedLogs.length - 1]?.sender === 'user' && (
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-lg">1.</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-sm">ONE</span>
                      <span className="bg-[#5865f2] text-white text-[9px] font-black px-1 py-0.5 rounded uppercase tracking-wider scale-90">BOT</span>
                      <span className="text-[10px] text-[#949ba4] font-medium">typing...</span>
                    </div>
                    <div className="flex gap-1 items-center mt-2 bg-[#1e1f22] p-2.5 rounded-xl w-16 justify-center">
                      <span className="w-1.5 h-1.5 bg-[#dbdee1] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-[#dbdee1] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-[#dbdee1] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mock input box */}
            <div className="bg-[#2b2d31] p-4 pt-1.5 border-t border-[#1f2023]">
              <div className="bg-[#383a40] text-[#949ba4] px-4 py-2.5 rounded-xl text-xs font-medium font-mono border border-zinc-800/20 flex justify-between items-center">
                <span>Message #bot-playground</span>
                <span className="text-[9px] font-black uppercase bg-[#2b2d31] px-1.5 py-0.5 rounded border border-zinc-800">
                  Simulation Active
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
