import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Code2, Search, Copy, Check, Terminal, Play, Sliders, Calendar, Music, 
  MessageSquare, ShieldAlert, Sparkles, Pin, HelpCircle, UserCheck, RefreshCw,
  Lock, Gamepad2, Heart, EyeOff, Tag, User, Trophy, Volume2
} from 'lucide-react';

interface Command {
  name: string;
  trigger: string;
  type: 'prefix' | 'slash';
  category: 
    | 'attendance' 
    | 'custom' 
    | 'sticky' 
    | 'revival' 
    | 'lofi' 
    | 'nickname' 
    | 'confession' 
    | 'games' 
    | 'pet' 
    | 'moderation' 
    | 'dashboard' 
    | 'utility' 
    | 'brainrot';
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
  // 📅 Attendance System - User Commands
  {
    name: 'Mark Present',
    trigger: 'present',
    type: 'prefix',
    category: 'attendance',
    description: 'Mark yourself as Present for the active attendance session.',
    usage: 'present',
    demoResponse: {
      userMsg: 'present',
      botMsgs: [
        {
          type: 'text',
          content: '✅ **Xander#0001** has been marked **Present**!'
        }
      ]
    }
  },
  {
    name: 'Mark Absent',
    trigger: 'absent',
    type: 'prefix',
    category: 'attendance',
    description: 'Mark yourself as Absent for the active attendance session.',
    usage: 'absent',
    demoResponse: {
      userMsg: 'absent',
      botMsgs: [
        {
          type: 'text',
          content: '❌ **Xander#0001** has been marked **Absent**.'
        }
      ]
    }
  },
  {
    name: 'Weekend NSTP Attendance',
    trigger: 'present nstp',
    type: 'prefix',
    category: 'attendance',
    description: 'Mark yourself as present specifically for the weekend National Service Training Program.',
    usage: 'present nstp',
    demoResponse: {
      userMsg: 'present nstp',
      botMsgs: [
        {
          type: 'embed',
          embed: {
            title: '🎓 NSTP Weekend Attendance',
            description: 'Successfully checked in for today\'s NSTP session.',
            color: '#3B82F6',
            fields: [
              { name: 'Student', value: 'Xander#0001', inline: true },
              { name: 'Program', value: 'NSTP-1', inline: true },
              { name: 'Status', value: '🟢 Present', inline: true }
            ],
            footer: 'NSTP Attendance System'
          }
        }
      ]
    }
  },
  {
    name: 'View Attendance Report',
    trigger: '!attendance',
    type: 'prefix',
    category: 'attendance',
    description: 'View the current active attendance session report and statistics.',
    usage: '!attendance',
    demoResponse: {
      userMsg: '!attendance',
      botMsgs: [
        {
          type: 'embed',
          embed: {
            title: '📊 Attendance Session Report',
            description: 'Active session statistics for the channel.',
            color: '#10B981',
            fields: [
              { name: 'Total Registered', value: '42 Members', inline: true },
              { name: 'Present', value: '🟢 35 (83.3%)', inline: true },
              { name: 'Absent', value: '🔴 5 (11.9%)', inline: true },
              { name: 'Excused', value: '🟡 2 (4.8%)', inline: true }
            ],
            footer: 'Use !leaderboard to see all-time rankings'
          }
        }
      ]
    }
  },
  {
    name: 'View Attendance Leaderboard',
    trigger: '!leaderboard',
    type: 'prefix',
    category: 'attendance',
    description: 'Display the top members with the highest attendance rates.',
    usage: '!leaderboard',
    demoResponse: {
      userMsg: '!leaderboard',
      botMsgs: [
        {
          type: 'embed',
          embed: {
            title: '🏆 Attendance Leaderboard',
            description: 'Top attendees in this server.',
            color: '#F59E0B',
            fields: [
              { name: '🥇 1st Place', value: 'Xander#0001 - 100% (24 Sessions)', inline: false },
              { name: '🥈 2nd Place', value: 'CyberDev#4200 - 98% (23 Sessions)', inline: false },
              { name: '🥉 3rd Place', value: 'AuraWave#1337 - 95% (22 Sessions)', inline: false }
            ],
            footer: 'Keep participating to climb the rank!'
          }
        }
      ]
    }
  },
  {
    name: 'Attendance Leaderboard (Alias)',
    trigger: '!attendance_leaderboard',
    type: 'prefix',
    category: 'attendance',
    description: 'Alias for !leaderboard to view top server attendance records.',
    usage: '!attendance_leaderboard',
    demoResponse: {
      userMsg: '!attendance_leaderboard',
      botMsgs: [
        {
          type: 'text',
          content: '🏆 Loading records... Type `!leaderboard` for the full display!'
        }
      ]
    }
  },

  // 📅 Attendance System - Setup & Config
  {
    name: 'One-Click Attendance Setup',
    trigger: '!setupattendance',
    type: 'prefix',
    category: 'attendance',
    permissions: 'Administrator',
    description: 'Quickly set up the attendance system in the current channel with standard parameters.',
    usage: '!setupattendance',
    demoResponse: {
      userMsg: '!setupattendance',
      botMsgs: [
        {
          type: 'embed',
          embed: {
            title: '⚙️ Attendance System Configured',
            description: 'The attendance system has been initialized successfully.',
            color: '#10B981',
            fields: [
              { name: 'Attendance Channel', value: '#attendance-logs', inline: true },
              { name: 'Active Timer', value: '30 Minutes', inline: true },
              { name: 'Permitted Role', value: '@everyone', inline: true }
            ],
            footer: 'Setup Complete'
          }
        }
      ]
    }
  },
  {
    name: 'One-Click Setup (Slash)',
    trigger: '/setupattendance',
    type: 'slash',
    category: 'attendance',
    permissions: 'Administrator',
    description: 'Slash version of the one-click attendance setup.',
    usage: '/setupattendance',
    demoResponse: {
      userMsg: '/setupattendance',
      botMsgs: [
        {
          type: 'text',
          content: '🚀 Slash attendance system launched! All components have been provisioned in `#attendance-logs`.'
        }
      ]
    }
  },
  {
    name: 'Create Attendance Buttons',
    trigger: '!setup_attendance',
    type: 'prefix',
    category: 'attendance',
    permissions: 'Administrator',
    description: 'Create interactive buttons in the channel for user-friendly attendance marking.',
    usage: '!setup_attendance',
    demoResponse: {
      userMsg: '!setup_attendance',
      botMsgs: [
        {
          type: 'embed',
          embed: {
            title: '📅 Click to Mark Attendance',
            description: 'Click the buttons below to register your attendance status for today\'s class/session.',
            color: '#3B82F6',
            fields: [
              { name: 'Status Options', value: '🟢 Present  |  🔴 Absent', inline: false }
            ],
            footer: 'Button actions expire in 60 minutes'
          }
        }
      ]
    }
  },
  {
    name: 'Set Attendance Time',
    trigger: '!settime',
    type: 'prefix',
    category: 'attendance',
    permissions: 'Administrator',
    description: 'Configure the duration in minutes for which attendance remains open.',
    usage: '!settime <minutes>',
    args: ['minutes'],
    demoResponse: {
      userMsg: '!settime 45',
      botMsgs: [
        {
          type: 'text',
          content: '⏱️ Attendance timer updated! Future sessions will now remain open for **45 minutes**.'
        }
      ]
    }
  },
  {
    name: 'Set Report Channel',
    trigger: '!assignchannel',
    type: 'prefix',
    category: 'attendance',
    permissions: 'Administrator',
    description: 'Specify the Discord channel where detailed attendance reports will be sent.',
    usage: '!assignchannel <#channel>',
    args: ['channel'],
    demoResponse: {
      userMsg: '!assignchannel #attendance-reports',
      botMsgs: [
        {
          type: 'text',
          content: '📥 Report channel updated! Detailed summaries will now be dispatched to <#attendance-reports>.'
        }
      ]
    }
  },
  {
    name: 'Disable Report Channel',
    trigger: '!assignchannel remove',
    type: 'prefix',
    category: 'attendance',
    permissions: 'Administrator',
    description: 'Disable the report channel so summaries are sent to the local active channel instead.',
    usage: '!assignchannel remove',
    demoResponse: {
      userMsg: '!assignchannel remove',
      botMsgs: [
        {
          type: 'text',
          content: '🚫 Specific report channel disabled. Reports will now default to the active session channel.'
        }
      ]
    }
  },
  {
    name: 'Set Attendance Channel',
    trigger: '!channelpresent',
    type: 'prefix',
    category: 'attendance',
    permissions: 'Administrator',
    description: 'Lock attendance marking commands specifically to a designated channel.',
    usage: '!channelpresent <#channel>',
    args: ['channel'],
    demoResponse: {
      userMsg: '!channelpresent #attendance-logs',
      botMsgs: [
        {
          type: 'text',
          content: '🔒 Attendance logging locked to <#attendance-logs>. Commands used elsewhere will be ignored.'
        }
      ]
    }
  },
  {
    name: 'Set Permitted Role',
    trigger: '!setpermitrole',
    type: 'prefix',
    category: 'attendance',
    permissions: 'Administrator',
    description: 'Restricts attendance participation to members with a specific role.',
    usage: '!setpermitrole <@role>',
    args: ['role'],
    demoResponse: {
      userMsg: '!setpermitrole @VerifiedStudent',
      botMsgs: [
        {
          type: 'text',
          content: '🔑 Permitted role set to **@VerifiedStudent**. Only members with this role can attend sessions.'
        }
      ]
    }
  },
  {
    name: 'Remove Permitted Role',
    trigger: '!resetpermitrole',
    type: 'prefix',
    category: 'attendance',
    permissions: 'Administrator',
    description: 'Removes the role restriction, allowing all server members to check in.',
    usage: '!resetpermitrole',
    demoResponse: {
      userMsg: '!resetpermitrole',
      botMsgs: [
        {
          type: 'text',
          content: '🔓 Permitted roles reset. All members in the channel can now participate in attendance!'
        }
      ]
    }
  },

  // 📅 Attendance System - Roles Config
  {
    name: 'Set Present Role',
    trigger: '!presentrole',
    type: 'prefix',
    category: 'attendance',
    permissions: 'Administrator',
    description: 'Assigns a specific Discord role automatically when a user marks themselves present.',
    usage: '!presentrole <@role>',
    args: ['role'],
    demoResponse: {
      userMsg: '!presentrole @Attended',
      botMsgs: [
        {
          type: 'text',
          content: '🏷️ Users who mark themselves present will now automatically receive the **@Attended** role.'
        }
      ]
    }
  },
  {
    name: 'Set Absent Role',
    trigger: '!absentrole',
    type: 'prefix',
    category: 'attendance',
    permissions: 'Administrator',
    description: 'Assigns a specific Discord role automatically when a user marks themselves absent.',
    usage: '!absentrole <@role>',
    args: ['role'],
    demoResponse: {
      userMsg: '!absentrole @Missing',
      botMsgs: [
        {
          type: 'text',
          content: '🏷️ Users who check in as absent will now receive the **@Missing** role.'
        }
      ]
    }
  },
  {
    name: 'Set Excused Role',
    trigger: '!excuserole',
    type: 'prefix',
    category: 'attendance',
    permissions: 'Administrator',
    description: 'Assigns a specific Discord role automatically when a user is excused.',
    usage: '!excuserole <@role>',
    args: ['role'],
    demoResponse: {
      userMsg: '!excuserole @ExcusedAbsence',
      botMsgs: [
        {
          type: 'text',
          content: '🏷️ Excused members will now be assigned the **@ExcusedAbsence** role.'
        }
      ]
    }
  },

  // 📅 Attendance System - Management
  {
    name: 'Force Mark Present',
    trigger: '!present @user',
    type: 'prefix',
    category: 'attendance',
    permissions: 'Manage Server',
    description: 'Manually override and mark a member as Present.',
    usage: '!present <@user>',
    args: ['user'],
    demoResponse: {
      userMsg: '!present @Troublemaker',
      botMsgs: [
        {
          type: 'text',
          content: '👮 **Admin Action**: Forced **Present** status for <@Troublemaker>.'
        }
      ]
    }
  },
  {
    name: 'Force Mark Absent',
    trigger: '!absent @user',
    type: 'prefix',
    category: 'attendance',
    permissions: 'Manage Server',
    description: 'Manually override and mark a member as Absent.',
    usage: '!absent <@user>',
    args: ['user'],
    demoResponse: {
      userMsg: '!absent @Skipper',
      botMsgs: [
        {
          type: 'text',
          content: '👮 **Admin Action**: Forced **Absent** status for <@Skipper>.'
        }
      ]
    }
  },
  {
    name: 'Excuse User',
    trigger: '!excuse @user reason',
    type: 'prefix',
    category: 'attendance',
    permissions: 'Manage Server',
    description: 'Excuse a member from the active session with a recorded reason.',
    usage: '!excuse <@user> <reason>',
    args: ['user', 'reason'],
    demoResponse: {
      userMsg: '!excuse @SillyDev sick leave',
      botMsgs: [
        {
          type: 'text',
          content: '🟡 <@SillyDev> has been marked **Excused** (Reason: *sick leave*).'
        }
      ]
    }
  },
  {
    name: 'Reset Individual Attendance',
    trigger: '!removepresent @user',
    type: 'prefix',
    category: 'attendance',
    permissions: 'Manage Server',
    description: 'Reset/clear a specific user\'s attendance status for the current session.',
    usage: '!removepresent <@user>',
    args: ['user'],
    demoResponse: {
      userMsg: '!removepresent @AuraWave',
      botMsgs: [
        {
          type: 'text',
          content: '🔄 Cleared attendance records for <@AuraWave> in this active session.'
        }
      ]
    }
  },
  {
    name: 'Delete Attendance Report',
    trigger: '!removereport',
    type: 'prefix',
    category: 'attendance',
    permissions: 'Manage Server',
    description: 'Deletes the last generated attendance report from the logs/database.',
    usage: '!removereport',
    demoResponse: {
      userMsg: '!removereport',
      botMsgs: [
        {
          type: 'text',
          content: '🗑️ The latest attendance report has been successfully deleted from history.'
        }
      ]
    }
  },
  {
    name: 'Reset All Attendance',
    trigger: '!resetattendance',
    type: 'prefix',
    category: 'attendance',
    permissions: 'Manage Server',
    description: 'Completely clear and wipe all logged data for the current active attendance session.',
    usage: '!resetattendance',
    demoResponse: {
      userMsg: '!resetattendance',
      botMsgs: [
        {
          type: 'text',
          content: '⚠️ **Database Cleared**: Active attendance session logs have been completely reset.'
        }
      ]
    }
  },
  {
    name: 'Restart Session',
    trigger: '!restartattendance',
    type: 'prefix',
    category: 'attendance',
    permissions: 'Manage Server',
    description: 'Ends the current session and instantly starts a fresh one with the same configuration.',
    usage: '!restartattendance',
    demoResponse: {
      userMsg: '!restartattendance',
      botMsgs: [
        {
          type: 'text',
          content: '🔄 Terminating current attendance session and booting up a fresh instance immediately...'
        }
      ]
    }
  },

  // 💬 Custom Commands
  {
    name: 'List Custom Commands',
    trigger: '!listcommands',
    type: 'prefix',
    category: 'custom',
    description: 'Display a list of all active user-configured custom commands in this server.',
    usage: '!listcommands',
    demoResponse: {
      userMsg: '!listcommands',
      botMsgs: [
        {
          type: 'embed',
          embed: {
            title: '💬 Custom Commands Directory',
            description: 'These custom triggers are configured by the server admins.',
            color: '#06B6D4',
            fields: [
              { name: '!rules', value: 'Prints server guidelines.', inline: true },
              { name: '!website', value: 'Provides links to the central control dashboard.', inline: true },
              { name: '!socials', value: 'Prints social handles.', inline: true }
            ],
            footer: 'Configure via !addcommand'
          }
        }
      ]
    }
  },
  {
    name: 'Create Custom Command',
    trigger: '!addcommand',
    type: 'prefix',
    category: 'custom',
    permissions: 'Manage Server',
    description: 'Configure a new simple custom command that repeats a defined block of text.',
    usage: '!addcommand <trigger_name> <response_text>',
    args: ['trigger', 'text'],
    demoResponse: {
      userMsg: '!addcommand rules Follow the server rules.',
      botMsgs: [
        {
          type: 'text',
          content: '✨ Success! Created new custom command `!rules`. Try running it now!'
        }
      ]
    }
  },
  {
    name: 'Remove Custom Command',
    trigger: '!removecommand',
    type: 'prefix',
    category: 'custom',
    permissions: 'Manage Server',
    description: 'Delete an existing user-configured custom command.',
    usage: '!removecommand <trigger_name>',
    args: ['trigger'],
    demoResponse: {
      userMsg: '!removecommand rules',
      botMsgs: [
        {
          type: 'text',
          content: '🗑️ Deleted custom command `!rules` from database.'
        }
      ]
    }
  },

  // 📌 Sticky Messages
  {
    name: 'Set Sticky Message',
    trigger: '!stick <message>',
    type: 'prefix',
    category: 'sticky',
    permissions: 'Manage Messages',
    description: 'Configure a message to "stick" to the bottom of the channel, sending and deleting itself so it remains visible.',
    usage: '!stick <content>',
    args: ['message'],
    demoResponse: {
      userMsg: '!stick Please read the pins!',
      botMsgs: [
        {
          type: 'text',
          content: '📌 Sticky message configured successfully! Active in the current channel.'
        }
      ]
    }
  },
  {
    name: 'Remove Sticky Message',
    trigger: '!unstick',
    type: 'prefix',
    category: 'sticky',
    permissions: 'Manage Messages',
    description: 'Remove and disable any active sticky messages in the current channel.',
    usage: '!unstick',
    demoResponse: {
      userMsg: '!unstick',
      botMsgs: [
        {
          type: 'text',
          content: '🚫 Stopped the active sticky message in this channel.'
        }
      ]
    }
  },
  {
    name: 'Remove Sticky (Alias)',
    trigger: '!removestick',
    type: 'prefix',
    category: 'sticky',
    permissions: 'Manage Messages',
    description: 'Alternate command trigger to remove active sticky posts.',
    usage: '!removestick',
    demoResponse: {
      userMsg: '!removestick',
      botMsgs: [
        {
          type: 'text',
          content: '🚫 Removed sticky anchor.'
        }
      ]
    }
  },

  // 🔥 Chat Revival
  {
    name: 'Set Revive Role',
    trigger: '!reviveping @Role',
    type: 'prefix',
    category: 'revival',
    permissions: 'Manage Server',
    description: 'Configure the specific role that will be pinged when a chat revival prompt is initiated.',
    usage: '!reviveping <@role>',
    args: ['role'],
    demoResponse: {
      userMsg: '!reviveping @ChatRevivalist',
      botMsgs: [
        {
          type: 'text',
          content: '🔥 Revive pings will now notify users with the **@ChatRevivalist** role.'
        }
      ]
    }
  },
  {
    name: 'Set Revive Channel',
    trigger: '!revivechannel #channel',
    type: 'prefix',
    category: 'revival',
    permissions: 'Manage Server',
    description: 'Lock chat revival pings and starter prompts specifically to a target discussion channel.',
    usage: '!revivechannel <#channel>',
    args: ['channel'],
    demoResponse: {
      userMsg: '!revivechannel #general-chat',
      botMsgs: [
        {
          type: 'text',
          content: '🔥 Discussion channel lock updated to <#general-chat>.'
        }
      ]
    }
  },
  {
    name: 'Send Revive Ping',
    trigger: '!revivechat',
    type: 'prefix',
    category: 'revival',
    description: 'Triggers a notification ping to the revive role with an engaging discussion starter.',
    usage: '!revivechat',
    demoResponse: {
      userMsg: '!revivechat',
      botMsgs: [
        {
          type: 'text',
          content: '🔥 **@ChatRevivalist** - Let\'s wake up the chat! 🚀'
        },
        {
          type: 'embed',
          embed: {
            title: '💬 Let\'s discuss!',
            description: 'If you could immediately master any single professional skill, what would it be and why?',
            color: '#EF4444',
            footer: 'Tip: Type in general chat to answer!'
          }
        }
      ]
    }
  },
  {
    name: 'Send Revive (Shortcut)',
    trigger: '!revive',
    type: 'prefix',
    category: 'revival',
    description: 'Quick shortcut trigger to launch the chat revival prompt sequence.',
    usage: '!revive',
    demoResponse: {
      userMsg: '!revive',
      botMsgs: [
        {
          type: 'text',
          content: '🔥 Prompting revival sequence... *If you could live anywhere in the universe, where would it be?*'
        }
      ]
    }
  },
  {
    name: 'Plain Text Revive Trigger',
    trigger: 'revive chat',
    type: 'prefix',
    category: 'revival',
    description: 'Natural language plain-text phrase that prompts a revival interaction without command prefix.',
    usage: 'revive chat',
    demoResponse: {
      userMsg: 'revive chat',
      botMsgs: [
        {
          type: 'text',
          content: '🤖 *Beep boop!* Did someone say chat revival? Let\'s go!'
        }
      ]
    }
  },

  // 🎧 24/7 Music System
  {
    name: 'Join Voice VC',
    trigger: '!join',
    type: 'prefix',
    category: 'lofi',
    description: 'Instruct the bot to join your active voice channel and prepare for streaming.',
    usage: '!join',
    demoResponse: {
      userMsg: '!join',
      botMsgs: [
        {
          type: 'text',
          content: '🔊 Summoned! Connected to voice channel: **🔊 General Lounge**'
        }
      ]
    }
  },
  {
    name: 'Play Music',
    trigger: '!play <song>',
    type: 'prefix',
    category: 'lofi',
    description: 'Search and stream high fidelity music in the active voice channel.',
    usage: '!play <song_name_or_url>',
    args: ['song'],
    demoResponse: {
      userMsg: '!play lofi beats to study to',
      botMsgs: [
        {
          type: 'embed',
          embed: {
            title: '🎵 Now Playing',
            description: '[Lofi Hip-Hop Radio - Beats to Relax/Study to](https://youtube.com) (24/7 Stream)',
            color: '#8B5CF6',
            fields: [
              { name: 'Channel', value: '🔊 General Lounge', inline: true },
              { name: 'Requested By', value: 'Xander#0001', inline: true }
            ],
            footer: 'ONE Music Streaming Service'
          }
        }
      ]
    }
  },
  {
    name: 'View Queue',
    trigger: '!queue',
    type: 'prefix',
    category: 'lofi',
    description: 'Display all pending songs and streams scheduled in the voice queue.',
    usage: '!queue',
    demoResponse: {
      userMsg: '!queue',
      botMsgs: [
        {
          type: 'embed',
          embed: {
            title: '🎼 Server Playlist Queue',
            description: 'Next tracks up in queue:',
            color: '#8B5CF6',
            fields: [
              { name: '1. Coffee Shop Ambient (3:42)', value: 'Requested by CyberDev#4200', inline: false },
              { name: '2. Tokyo Rain Moods (Continuous)', value: 'Requested by AuraWave#1337', inline: false }
            ],
            footer: 'Current: Lofi Hip-Hop Radio (Loop Active)'
          }
        }
      ]
    }
  },
  {
    name: 'Skip Song',
    trigger: '!skip',
    type: 'prefix',
    category: 'lofi',
    description: 'Skips the currently active track and proceeds to the next song in queue.',
    usage: '!skip',
    demoResponse: {
      userMsg: '!skip',
      botMsgs: [
        {
          type: 'text',
          content: '⏭️ Track skipped. Proceeding to **Coffee Shop Ambient**.'
        }
      ]
    }
  },
  {
    name: 'Pause Music',
    trigger: '!pause',
    type: 'prefix',
    category: 'lofi',
    description: 'Temporary pause the active audio stream.',
    usage: '!pause',
    demoResponse: {
      userMsg: '!pause',
      botMsgs: [
        {
          type: 'text',
          content: '⏸️ Stream playback paused.'
        }
      ]
    }
  },
  {
    name: 'Resume Music',
    trigger: '!resume',
    type: 'prefix',
    category: 'lofi',
    description: 'Resume the paused audio stream.',
    usage: '!resume',
    demoResponse: {
      userMsg: '!resume',
      botMsgs: [
        {
          type: 'text',
          content: '▶️ Stream playback resumed.'
        }
      ]
    }
  },
  {
    name: 'Set Volume',
    trigger: '!volume',
    type: 'prefix',
    category: 'lofi',
    description: 'Adjust the audio output volume level (1-100).',
    usage: '!volume <level>',
    args: ['level'],
    demoResponse: {
      userMsg: '!volume 50',
      botMsgs: [
        {
          type: 'text',
          content: '🔊 Playback volume adjusted to **50%**.'
        }
      ]
    }
  },
  {
    name: 'Stop Playback',
    trigger: '!stop',
    type: 'prefix',
    category: 'lofi',
    description: 'Halts all active music streams and completely clears the playlist queue.',
    usage: '!stop',
    demoResponse: {
      userMsg: '!stop',
      botMsgs: [
        {
          type: 'text',
          content: '⏹️ Streaming stopped. Queue cleared.'
        }
      ]
    }
  },
  {
    name: 'Play Lofi Radio',
    trigger: '!playlofi',
    type: 'prefix',
    category: 'lofi',
    description: 'Instant-shortcut to start streaming our standard 24/7 high-fidelity lofi study station.',
    usage: '!playlofi',
    demoResponse: {
      userMsg: '!playlofi',
      botMsgs: [
        {
          type: 'text',
          content: '☕ Summing relax vibes... Connected and streaming **24/7 Lofi Beats**.'
        }
      ]
    }
  },
  {
    name: 'Audio Status',
    trigger: '!status',
    type: 'prefix',
    category: 'lofi',
    description: 'Check active stream, bitrate, latency, and voice network health metrics.',
    usage: '!status',
    demoResponse: {
      userMsg: '!status',
      botMsgs: [
        {
          type: 'embed',
          embed: {
            title: '📈 Music Player Telemetry',
            color: '#8B5CF6',
            fields: [
              { name: 'Active Stream', value: 'Lofi Chill Beats 24/7', inline: true },
              { name: 'VC Connected', value: '🔊 General Lounge', inline: true },
              { name: 'Bitrate', value: '⚡ 128 kbps Stereo', inline: true },
              { name: 'Latency', value: '📶 12ms ping', inline: true }
            ],
            footer: 'System state: OPERATIONAL'
          }
        }
      ]
    }
  },
  {
    name: 'Leave VC',
    trigger: '!leave',
    type: 'prefix',
    category: 'lofi',
    description: 'Disconnect the bot from the current voice channel entirely.',
    usage: '!leave',
    demoResponse: {
      userMsg: '!leave',
      botMsgs: [
        {
          type: 'text',
          content: '🚪 Disconnected from voice channel. Goodbye!'
        }
      ]
    }
  },
  // 🎧 Music System - Slash Version
  {
    name: 'Join VC (Slash)',
    trigger: '/join',
    type: 'slash',
    category: 'lofi',
    description: 'Slash command to summon the bot to your active voice channel.',
    usage: '/join',
    demoResponse: {
      userMsg: '/join',
      botMsgs: [
        {
          type: 'text',
          content: '🔊 Connected via slash command.'
        }
      ]
    }
  },
  {
    name: 'Play Lofi (Slash)',
    trigger: '/playlofi',
    type: 'slash',
    category: 'lofi',
    description: 'Slash command to instantly start playing 24/7 lofi radio.',
    usage: '/playlofi',
    demoResponse: {
      userMsg: '/playlofi',
      botMsgs: [
        {
          type: 'text',
          content: '🎧 Launching 24/7 Lofi stream in your voice channel.'
        }
      ]
    }
  },
  {
    name: 'Music Status (Slash)',
    trigger: '/status',
    type: 'slash',
    category: 'lofi',
    description: 'Slash command to view stream status, active track, and volume metrics.',
    usage: '/status',
    demoResponse: {
      userMsg: '/status',
      botMsgs: [
        {
          type: 'text',
          content: '🎵 **Streaming Active**: volume is at 100% in channel "General Lounge".'
        }
      ]
    }
  },
  {
    name: 'Leave VC (Slash)',
    trigger: '/leave',
    type: 'slash',
    category: 'lofi',
    description: 'Slash command to disconnect the bot from voice channels.',
    usage: '/leave',
    demoResponse: {
      userMsg: '/leave',
      botMsgs: [
        {
          type: 'text',
          content: '🚪 Leaving voice channel.'
        }
      ]
    }
  },
  {
    name: 'Setup 24/7 Music (Slash)',
    trigger: '/setup247music',
    type: 'slash',
    category: 'lofi',
    permissions: 'Administrator',
    description: 'Slash command to configure permanent voice channel and auto-rejoin parameters.',
    usage: '/setup247music channel:<#voice-channel>',
    args: ['channel'],
    demoResponse: {
      userMsg: '/setup247music channel: Lounge',
      botMsgs: [
        {
          type: 'text',
          content: '⚙️ 24/7 Music Auto-Rejoin enabled for voice channel: **Lounge**.'
        }
      ]
    }
  },

  // 📝 Auto Nickname System
  {
    name: 'Change Nickname',
    trigger: '!nick',
    type: 'prefix',
    category: 'nickname',
    description: 'Request a customized nickname update with your registered tags.',
    usage: '!nick <new_name>',
    args: ['name'],
    demoResponse: {
      userMsg: '!nick Xander',
      botMsgs: [
        {
          type: 'text',
          content: '🏷️ Your nickname has been updated to **[DEV] Xander**.'
        }
      ]
    }
  },
  {
    name: 'View Nickname Settings',
    trigger: '!nicksettings',
    type: 'prefix',
    category: 'nickname',
    description: 'View the active automated nickname decoration template rules in the guild.',
    usage: '!nicksettings',
    demoResponse: {
      userMsg: '!nicksettings',
      botMsgs: [
        {
          type: 'embed',
          embed: {
            title: '🏷️ Auto Nickname Rules',
            color: '#6366F1',
            fields: [
              { name: 'Admins', value: '`[ADMIN] {nick}`', inline: true },
              { name: 'Developers', value: '`[DEV] {nick}`', inline: true },
              { name: 'Verified Students', value: '`[STUDENT] {nick}`', inline: true },
              { name: 'Default Tag', value: '`[MEMBER] {nick}`', inline: true }
            ],
            footer: 'Configure via !autonick'
          }
        }
      ]
    }
  },
  {
    name: 'Force Set Nickname',
    trigger: '!setnick',
    type: 'prefix',
    category: 'nickname',
    permissions: 'Manage Nicknames',
    description: 'Manually force change another server member\'s nickname.',
    usage: '!setnick <@user> <new_name>',
    args: ['user', 'name'],
    demoResponse: {
      userMsg: '!setnick @Skipper Slacker',
      botMsgs: [
        {
          type: 'text',
          content: '👮 **Admin Action**: Forced nickname for <@Skipper> to **Slacker**.'
        }
      ]
    }
  },
  {
    name: 'Add Role Tag',
    trigger: '!autonick',
    type: 'prefix',
    category: 'nickname',
    permissions: 'Manage Server',
    description: 'Set a formatting prefix tag automatically applied to users carrying a specific role.',
    usage: '!autonick <@role> <tag>',
    args: ['role', 'tag'],
    demoResponse: {
      userMsg: '!autonick @BetaTester BETA',
      botMsgs: [
        {
          type: 'text',
          content: '✅ Auto-Nick added: members carrying **@BetaTester** will now have **[BETA]** prefix added.'
        }
      ]
    }
  },
  {
    name: 'Default Nickname Tag',
    trigger: '!defaultnick',
    type: 'prefix',
    category: 'nickname',
    permissions: 'Manage Server',
    description: 'Configure the default global prefix tag for unassigned new members.',
    usage: '!defaultnick <tag>',
    args: ['tag'],
    demoResponse: {
      userMsg: '!defaultnick MEMBER',
      botMsgs: [
        {
          type: 'text',
          content: '✅ Default fallback tag set to `[MEMBER]`. Applied on new entries.'
        }
      ]
    }
  },
  {
    name: 'Remove Role Tag',
    trigger: '!removenick',
    type: 'prefix',
    category: 'nickname',
    permissions: 'Manage Server',
    description: 'Delete nickname formatting tags configured for a specific role.',
    usage: '!removenick <@role>',
    args: ['role'],
    demoResponse: {
      userMsg: '!removenick @BetaTester',
      botMsgs: [
        {
          type: 'text',
          content: '🗑️ Removed auto-nickname decoration rules for **@BetaTester**.'
        }
      ]
    }
  },
  {
    name: 'Update Everyone',
    trigger: '!updateall',
    type: 'prefix',
    category: 'nickname',
    permissions: 'Administrator',
    description: 'Trigger a complete server-wide evaluation and rebuild of every single member\'s nickname according to current active rules.',
    usage: '!updateall',
    demoResponse: {
      userMsg: '!updateall',
      botMsgs: [
        {
          type: 'text',
          content: '⏳ Initializing full guild nickname sync... Evaluated and updated **142 members**.'
        }
      ]
    }
  },
  {
    name: 'Remove Tag from All',
    trigger: '!removeall',
    type: 'prefix',
    category: 'nickname',
    permissions: 'Administrator',
    description: 'Completely wipe and strip auto-nickname tags from all members in the guild.',
    usage: '!removeall',
    demoResponse: {
      userMsg: '!removeall',
      botMsgs: [
        {
          type: 'text',
          content: '⚠️ Removed tags and restored original usernames/nicknames for all **142 members**.'
        }
      ]
    }
  },
  {
    name: 'Strip Specific Text',
    trigger: '!stripall',
    type: 'prefix',
    category: 'nickname',
    permissions: 'Administrator',
    description: 'Search and strip a specified string pattern from all server nicknames.',
    usage: '!stripall <pattern_text>',
    args: ['pattern'],
    demoResponse: {
      userMsg: '!stripall [OLD_TAG]',
      botMsgs: [
        {
          type: 'text',
          content: '✂️ Search-and-strip sequence completed. Cleared `[OLD_TAG]` from **18 member profiles**.'
        }
      ]
    }
  },
  {
    name: 'Nickname Setup (Slash)',
    trigger: '/setupnick',
    type: 'slash',
    category: 'nickname',
    permissions: 'Administrator',
    description: 'Slash version to configure the global automated nickname system parameters.',
    usage: '/setupnick enabled:true format:[{role_tag}] {username}',
    args: ['enabled', 'format'],
    demoResponse: {
      userMsg: '/setupnick enabled:true format: [TAG] {username}',
      botMsgs: [
        {
          type: 'text',
          content: '⚙️ Auto-Nickname Engine updated. Interactive status: **Active**.'
        }
      ]
    }
  },

  // 🙈 Anonymous Confession
  {
    name: 'Anonymous Confession',
    trigger: '!confess',
    type: 'prefix',
    category: 'confession',
    description: 'Submit an anonymous confession to the designated confessions channel.',
    usage: '!confess <message>',
    args: ['message'],
    demoResponse: {
      userMsg: '!confess I secretly look forward to debugging CSS.',
      botMsgs: [
        {
          type: 'text',
          content: '🤐 Confession received anonymously! Posted to <#confessions>.'
        }
      ]
    }
  },
  {
    name: 'Confession (Slash)',
    trigger: '/confess',
    type: 'slash',
    category: 'confession',
    description: 'Slash command version to transmit an anonymous confession securely.',
    usage: '/confess message:<content>',
    args: ['message'],
    demoResponse: {
      userMsg: '/confess message: I broke the dev server and blamed caching.',
      botMsgs: [
        {
          type: 'text',
          content: '🤐 Sent! Anonymous submission successful.'
        }
      ]
    }
  },
  {
    name: 'Setup Confession',
    trigger: '!setupconfession',
    type: 'prefix',
    category: 'confession',
    permissions: 'Administrator',
    description: 'Establish the designated confession board destination channel.',
    usage: '!setupconfession <#channel>',
    args: ['channel'],
    demoResponse: {
      userMsg: '!setupconfession #confessions-wall',
      botMsgs: [
        {
          type: 'text',
          content: '🤫 Board destination configured. All anonymous logs will be routed to <#confessions-wall>.'
        }
      ]
    }
  },
  {
    name: 'Setup Confession (Slash)',
    trigger: '/setupconfession',
    type: 'slash',
    category: 'confession',
    permissions: 'Administrator',
    description: 'Slash command version to designate the confessions feed.',
    usage: '/setupconfession channel:<#channel>',
    args: ['channel'],
    demoResponse: {
      userMsg: '/setupconfession channel: #confessions-wall',
      botMsgs: [
        {
          type: 'text',
          content: '🤫 Feed designated to channel: **#confessions-wall**.'
        }
      ]
    }
  },
  {
    name: 'Configure Confession Options',
    trigger: '/confession',
    type: 'slash',
    category: 'confession',
    permissions: 'Administrator',
    description: 'Fine-tune anonymous confession moderation status, cooldowns, and filter rules.',
    usage: '/confession cooldown:5m approved_only:true',
    args: ['cooldown', 'approved_only'],
    demoResponse: {
      userMsg: '/confession cooldown: 5m approved_only: true',
      botMsgs: [
        {
          type: 'text',
          content: '⚙️ Confession rules updated: 5-minute user cooldown, Admin vetting is **Enabled**.'
        }
      ]
    }
  },

  // 🎮 Game Progress Tracker
  {
    name: 'UNO Progress',
    trigger: '!uno',
    type: 'prefix',
    category: 'games',
    description: 'Retrieve current saved progress, wins, and all-time records in UNO.',
    usage: '!uno',
    demoResponse: {
      userMsg: '!uno',
      botMsgs: [
        {
          type: 'embed',
          embed: {
            title: '🃏 UNO Tournament Card',
            description: 'Tracked player session records.',
            color: '#10B981',
            fields: [
              { name: 'Player', value: 'Xander#0001', inline: true },
              { name: 'Matches Won', value: '🏆 48 Wins', inline: true },
              { name: 'Last Updated', value: 'Just now', inline: true }
            ],
            footer: 'Uno Tracker Active'
          }
        }
      ]
    }
  },
  {
    name: 'OwO Progress',
    trigger: '!owo',
    type: 'prefix',
    category: 'games',
    description: 'View currency, hunts, and pet collection metrics in OwO.',
    usage: '!owo',
    demoResponse: {
      userMsg: '!owo',
      botMsgs: [
        {
          type: 'embed',
          embed: {
            title: '🐾 OwO Gamer Status',
            color: '#EC4899',
            fields: [
              { name: 'Level', value: '⭐ Lvl 35', inline: true },
              { name: 'Coins', value: '🪙 125,430 owoCoins', inline: true },
              { name: 'Hunts Done', value: '🏹 843 Hunts', inline: true }
            ],
            footer: 'OwO Integration Engine'
          }
        }
      ]
    }
  },
  {
    name: 'Mafia Progress',
    trigger: '!mafia',
    type: 'prefix',
    category: 'games',
    description: 'Check detective and killer win rates in Mafia games.',
    usage: '!mafia',
    demoResponse: {
      userMsg: '!mafia',
      botMsgs: [
        {
          type: 'embed',
          embed: {
            title: '🕵️ Mafia Crime Dossier',
            color: '#111827',
            fields: [
              { name: 'Citizen Wins', value: '😇 14 Wins', inline: true },
              { name: 'Mafia Wins', value: '🩸 8 Wins', inline: true },
              { name: 'Success Rate', value: '📊 62% Winrate', inline: true }
            ],
            footer: 'Mafia Game Tracker'
          }
        }
      ]
    }
  },
  {
    name: 'Save Game Progress',
    trigger: '!<game> set <progress>',
    type: 'prefix',
    category: 'games',
    description: 'Directly record progress updates in games. Supports: UNO, OwO, Mafia, Gartic, Casino, Mudae, Asterie, Hangman, Truth or Dare, Virtual Fisher, Guess The Number.',
    usage: '!uno set 49 wins',
    args: ['progress'],
    demoResponse: {
      userMsg: '!uno set 49 wins',
      botMsgs: [
        {
          type: 'text',
          content: '💾 **Progress Logged**: Your UNO database record has been updated to **49 wins**.'
        }
      ]
    }
  },
  {
    name: 'Clear Game Progress',
    trigger: '!<game> clear',
    type: 'prefix',
    category: 'games',
    description: 'Wipe all tracked metrics and reset record boards for a specific game.',
    usage: '!uno clear',
    demoResponse: {
      userMsg: '!uno clear',
      botMsgs: [
        {
          type: 'text',
          content: '🔄 **Reset Complete**: Your UNO tournament metrics have been set back to zero.'
        }
      ]
    }
  },

  // 🐾 Virtual Pet
  {
    name: 'Adopt Pet (Slash)',
    trigger: '/pet adopt',
    type: 'slash',
    category: 'pet',
    description: 'Begin your journey and adopt a cute virtual pet creature of choice!',
    usage: '/pet adopt name:<pet_name> type:<dog|cat|rabbit|panda>',
    args: ['name', 'type'],
    demoResponse: {
      userMsg: '/pet adopt name: Bubbles type: panda',
      botMsgs: [
        {
          type: 'embed',
          embed: {
            title: '🐼 Pet Adoption Successful!',
            description: 'You are now the official owner of **Bubbles**! Take good care of them!',
            color: '#EC4899',
            fields: [
              { name: 'Name', value: 'Bubbles', inline: true },
              { name: 'Specie', value: 'Rare Panda', inline: true },
              { name: 'Level', value: '⭐ Lvl 1', inline: true }
            ],
            footer: 'Type /pet status to inspect Bubbles'
          }
        }
      ]
    }
  },
  {
    name: 'View Pet Status (Slash)',
    trigger: '/pet status',
    type: 'slash',
    category: 'pet',
    description: 'Check up on your virtual pet\'s age, happiness levels, hunger status, and level progress.',
    usage: '/pet status',
    demoResponse: {
      userMsg: '/pet status',
      botMsgs: [
        {
          type: 'embed',
          embed: {
            title: '🐼 Bubbles\'s Stats Card',
            color: '#10B981',
            fields: [
              { name: 'Affection Lvl', value: '⭐ Lvl 5 (Exp 200/500)', inline: true },
              { name: 'Hunger Bar', value: '🍖 85% (Satisfied)', inline: true },
              { name: 'Energy Meter', value: '⚡ 90% (Energized)', inline: true },
              { name: 'Hygiene Rating', value: '🧼 100% (Squeaky Clean)', inline: true }
            ],
            footer: 'Bubbles is feeling very happy today! ❤️'
          }
        }
      ]
    }
  },
  {
    name: 'Rename Pet (Slash)',
    trigger: '/pet name',
    type: 'slash',
    category: 'pet',
    description: 'Update the official legal certificate name of your pet.',
    usage: '/pet name new_name:<name>',
    args: ['new_name'],
    demoResponse: {
      userMsg: '/pet name new_name: Bamboo',
      botMsgs: [
        {
          type: 'text',
          content: '✏️ Bubbles has been renamed to **Bamboo**! Bamboo seems to enjoy the new name.'
        }
      ]
    }
  },
  {
    name: 'Feed Pet (Slash)',
    trigger: '/pet feed',
    type: 'slash',
    category: 'pet',
    description: 'Feed your virtual companion treats to replenish their hunger bar.',
    usage: '/pet feed',
    demoResponse: {
      userMsg: '/pet feed',
      botMsgs: [
        {
          type: 'text',
          content: '🍖 You fed Bamboo a delicious piece of eucalyptus. Hunger: **100% (+15%)**!'
        }
      ]
    }
  },
  {
    name: 'Play with Pet (Slash)',
    trigger: '/pet play',
    type: 'slash',
    category: 'pet',
    description: 'Play active mini games with your pet to lift their happiness levels and earn EXP.',
    usage: '/pet play',
    demoResponse: {
      userMsg: '/pet play',
      botMsgs: [
        {
          type: 'text',
          content: '⚽ You threw a squeaky toy. Bamboo chased it around happily! Happiness: **100% (+20%)** | Earned **+50 EXP**!'
        }
      ]
    }
  },
  {
    name: 'Clean Pet (Slash)',
    trigger: '/pet clean',
    type: 'slash',
    category: 'pet',
    description: 'Give your virtual companion a fresh soapy bath to restore hygiene bars.',
    usage: '/pet clean',
    demoResponse: {
      userMsg: '/pet clean',
      botMsgs: [
        {
          type: 'text',
          content: '🧼 Scrub dub! You gave Bamboo a nice warm bath. Hygiene: **100%**!'
        }
      ]
    }
  },
  {
    name: 'Put Pet to Sleep (Slash)',
    trigger: '/pet sleep',
    type: 'slash',
    category: 'pet',
    description: 'Tuck your pet into bed to recharge their stamina and energy meter over time.',
    usage: '/pet sleep',
    demoResponse: {
      userMsg: '/pet sleep',
      botMsgs: [
        {
          type: 'text',
          content: '💤 Bamboo is now sleeping. They will wake up fully recharged in a few hours!'
        }
      ]
    }
  },
  {
    name: 'Daily Reward (Slash)',
    trigger: '/pet daily',
    type: 'slash',
    category: 'pet',
    description: 'Claim your daily allowance of pet coins, food items, and accessories.',
    usage: '/pet daily',
    demoResponse: {
      userMsg: '/pet daily',
      botMsgs: [
        {
          type: 'embed',
          embed: {
            title: '🎁 Daily Pet Allowance Claimed!',
            description: 'You collected your reward package for today!',
            color: '#F59E0B',
            fields: [
              { name: 'Coins Received', value: '🪙 +500 petCoins', inline: true },
              { name: 'Consumables', value: '🍎 x2 Apple Treats', inline: true }
            ],
            footer: 'Streak active: Day 5 (Multiplier x1.5)'
          }
        }
      ]
    }
  },
  {
    name: 'Pet Fetch Game (Slash)',
    trigger: '/pet fetch',
    type: 'slash',
    category: 'pet',
    description: 'Engage in an interactive fetch trial. Catch items to win extra currency tokens.',
    usage: '/pet fetch',
    demoResponse: {
      userMsg: '/pet fetch',
      botMsgs: [
        {
          type: 'text',
          content: '🎾 *Throwing stick...* Bamboo sprinted, dodged a squirrel, and successfully caught it! **+120 petCoins** awarded.'
        }
      ]
    }
  },
  {
    name: 'Pet Racing (Slash)',
    trigger: '/pet race',
    type: 'slash',
    category: 'pet',
    description: 'Match against concurrent active users in a high stakes dash tournament!',
    usage: '/pet race',
    demoResponse: {
      userMsg: '/pet race',
      botMsgs: [
        {
          type: 'embed',
          embed: {
            title: '🏁 Pet Derby Stadium',
            description: 'The race has finished! Final Standings:',
            color: '#F59E0B',
            fields: [
              { name: '🥇 1st Place', value: 'Bamboo (User: Xander) [Speed: 12m/s]', inline: false },
              { name: '🥈 2nd Place', value: 'Spike (User: CyberDev) [Speed: 10m/s]', inline: false }
            ],
            footer: 'Bamboo won the gold and 1000 coins!'
          }
        }
      ]
    }
  },
  {
    name: 'Pet Battle (Slash)',
    trigger: '/pet battle',
    type: 'slash',
    category: 'pet',
    description: 'Friendly PVP combat arenas between pet stats.',
    usage: '/pet battle opponent:<@user>',
    args: ['opponent'],
    demoResponse: {
      userMsg: '/pet battle opponent: @CyberDev',
      botMsgs: [
        {
          type: 'embed',
          embed: {
            title: '⚔️ Pet Duel Arena',
            description: 'Bamboo matches up against Spike!',
            color: '#EF4444',
            fields: [
              { name: 'Turn 1', value: 'Bamboo used *Bamboo Slam* for 25 Damage!', inline: false },
              { name: 'Turn 2', value: 'Spike missed! Bamboo retaliated with *Cute Tackle*!', inline: false },
              { name: '🏆 Winner', value: 'Bamboo survives with 75 HP! **Victory**!', inline: false }
            ],
            footer: 'Fame rank improved!'
          }
        }
      ]
    }
  },
  {
    name: 'Pet Shop (Slash)',
    trigger: '/pet shop',
    type: 'slash',
    category: 'pet',
    description: 'Buy cool custom costumes, rare treats, toys, and grooming items.',
    usage: '/pet shop',
    demoResponse: {
      userMsg: '/pet shop',
      botMsgs: [
        {
          type: 'embed',
          embed: {
            title: '🛒 Virtual Pet Emporium',
            description: 'Spend your petCoins here!',
            color: '#10B981',
            fields: [
              { name: '🎩 Fedora Hat', value: 'Cost: 1,500 petCoins', inline: true },
              { name: '🍖 Prime Steak Treat', value: 'Cost: 200 petCoins', inline: true },
              { name: '🧴 Royal Shampoo', value: 'Cost: 350 petCoins', inline: true }
            ],
            footer: 'Buy via /pet buy item:<name>'
          }
        }
      ]
    }
  },

  // 🔨 Moderation
  {
    name: 'Fake Ban Prank',
    trigger: '!fakeban',
    type: 'prefix',
    category: 'moderation',
    permissions: 'Manage Messages',
    description: 'Deploy a convincing fake ban message to trick unsuspecting prank targets.',
    usage: '!fakeban <@user> [reason]',
    args: ['user', 'reason'],
    demoResponse: {
      userMsg: '!fakeban @CyberDev rule breaking',
      botMsgs: [
        {
          type: 'embed',
          embed: {
            title: '🚨 User Permanently Banned',
            description: '<@CyberDev> has been banned from the Discord server.',
            color: '#EF4444',
            fields: [
              { name: 'Moderator', value: 'Xander#0001', inline: true },
              { name: 'Reason', value: 'rule breaking (not sharing memes)', inline: true }
            ],
            footer: 'Just kidding! This is a simulated fakeban prank. 🤪'
          }
        }
      ]
    }
  },
  {
    name: 'Mute Member (Slash)',
    trigger: '/mute',
    type: 'slash',
    category: 'moderation',
    permissions: 'Moderate Members',
    description: 'Restrict voice and chat capability for a specific user for a set duration.',
    usage: '/mute user:<@user> duration:<time> [reason]',
    args: ['user', 'duration', 'reason'],
    demoResponse: {
      userMsg: '/mute user: @Troll duration: 30m reason: mic spam',
      botMsgs: [
        {
          type: 'embed',
          embed: {
            title: '🔇 Member Silenced',
            description: 'User has been placed in a chat timeout.',
            color: '#F59E0B',
            fields: [
              { name: 'Enforced On', value: 'Troll#9999', inline: true },
              { name: 'Duration', value: '30 Minutes', inline: true }
            ],
            footer: 'Moderation logs saved'
          }
        }
      ]
    }
  },
  {
    name: 'Unmute Member (Slash)',
    trigger: '/unmute',
    type: 'slash',
    category: 'moderation',
    permissions: 'Moderate Members',
    description: 'Restore chat and voice privileges to a muted member.',
    usage: '/unmute user:<@user>',
    args: ['user'],
    demoResponse: {
      userMsg: '/unmute user: @Troll',
      botMsgs: [
        {
          type: 'text',
          content: '🔊 **Unmuted**: restored microphone and typing keys for <@Troll>.'
        }
      ]
    }
  },
  {
    name: 'Configure Lock Channels (Slash)',
    trigger: '/lockunlockchannels',
    type: 'slash',
    category: 'moderation',
    permissions: 'Manage Channels',
    description: 'Configure and dispatch channel freeze instructions and lock notifications to target channels.',
    usage: '/lockunlockchannels action:lock channel:#chat',
    args: ['action', 'channel'],
    demoResponse: {
      userMsg: '/lockunlockchannels action: lock channel: general',
      botMsgs: [
        {
          type: 'text',
          content: '🔒 Channel **#general** has been locked. Ordinary members can no longer write messages.'
        }
      ]
    }
  },

  // 🌐 Dashboard
  {
    name: 'Open Dashboard (Slash)',
    trigger: '/dashboard',
    type: 'slash',
    category: 'dashboard',
    description: 'Generates a secure, temporary web authentication link to access the bot config panel.',
    usage: '/dashboard',
    demoResponse: {
      userMsg: '/dashboard',
      botMsgs: [
        {
          type: 'embed',
          embed: {
            title: '🌐 Bot Configuration Panel',
            description: 'Click the button below to open your administrator control deck. This link expires in 5 minutes.',
            color: '#3B82F6',
            fields: [
              { name: 'Secure Auth URL', value: '[Open Settings Dashboard](https://ais-dev-nrr7rkipmftufqyfdn5jsf-711770346733.asia-southeast1.run.app)', inline: false }
            ],
            footer: 'Do not share your auth URLs with anyone!'
          }
        }
      ]
    }
  },

  // 💬 Utility Commands
  {
    name: 'Help Menu',
    trigger: '!help',
    type: 'prefix',
    category: 'utility',
    description: 'Prints out the comprehensive category index helper directory.',
    usage: '!help',
    demoResponse: {
      userMsg: '!help',
      botMsgs: [
        {
          type: 'embed',
          embed: {
            title: '🤖 ONE Bot Commands Help',
            description: 'Provide assistance options across various active modules.',
            color: '#3B82F6',
            fields: [
              { name: '📅 Attendance', value: '`present`, `absent`, `!attendance`', inline: true },
              { name: '🎵 Lofi Music', value: '`!play`, `!queue`, `!skip`, `!stop`', inline: true },
              { name: '🎮 Game Stats', value: '`!uno`, `!owo`, `!mafia`', inline: true },
              { name: '🐶 Virtual Pet', value: '`/pet adopt`, `/pet status`, `/pet play`', inline: true }
            ],
            footer: 'Type !help <module_name> for detailed syntax listings'
          }
        }
      ]
    }
  },
  {
    name: 'Ping Latency',
    trigger: '!ping',
    type: 'prefix',
    category: 'utility',
    description: 'Check active bot API response round-trip latencies and Discord API heartbeats.',
    usage: '!ping',
    demoResponse: {
      userMsg: '!ping',
      botMsgs: [
        {
          type: 'text',
          content: '🏓 **Pong!** Latency: **45ms** | Gateway Heartbeat: **12ms**'
        }
      ]
    }
  },
  {
    name: 'User Avatar',
    trigger: '!av',
    type: 'prefix',
    category: 'utility',
    description: 'Fetch and present the high definition avatar profile graphic of yourself or other user.',
    usage: '!av [@user]',
    args: ['user'],
    demoResponse: {
      userMsg: '!av @CyberDev',
      botMsgs: [
        {
          type: 'embed',
          embed: {
            title: '🖼️ CyberDev\'s Avatar Profile',
            description: '[Click to open full high-definition PNG](https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500)',
            color: '#3B82F6',
            footer: 'ONE Graphic services'
          }
        }
      ]
    }
  },
  {
    name: 'Avatar (No Prefix)',
    trigger: 'av',
    type: 'prefix',
    category: 'utility',
    description: 'Convenience natural word trigger to view avatars quickly without prefix syntax.',
    usage: 'av',
    demoResponse: {
      userMsg: 'av',
      botMsgs: [
        {
          type: 'text',
          content: '🖼️ Fetching profile graphics for **Xander#0001**...'
        }
      ]
    }
  },
  {
    name: 'Bot Say',
    trigger: '!say',
    type: 'prefix',
    category: 'utility',
    permissions: 'Manage Messages',
    description: 'Summons the bot to repeat your textual message verbatim.',
    usage: '!say <message_text>',
    args: ['message'],
    demoResponse: {
      userMsg: '!say Announcements are starting soon.',
      botMsgs: [
        {
          type: 'text',
          content: 'Announcements are starting soon.'
        }
      ]
    }
  },
  {
    name: 'Bot Say (Slash)',
    trigger: '/say',
    type: 'slash',
    category: 'utility',
    permissions: 'Manage Messages',
    description: 'Slash version of the verbatim text echo utility.',
    usage: '/say message:<content>',
    args: ['message'],
    demoResponse: {
      userMsg: '/say message: Hello World!',
      botMsgs: [
        {
          type: 'text',
          content: 'Hello World!'
        }
      ]
    }
  },
  {
    name: 'Settings Summary',
    trigger: '!settings',
    type: 'prefix',
    category: 'utility',
    permissions: 'Manage Server',
    description: 'Inspect overall system health statuses and enable/disable states for server modules.',
    usage: '!settings',
    demoResponse: {
      userMsg: '!settings',
      botMsgs: [
        {
          type: 'embed',
          embed: {
            title: '⚙️ Guild Control Hub',
            description: 'Module switch statuses for current Discord Server:',
            color: '#10B981',
            fields: [
              { name: '📅 Attendance Engine', value: '🟢 ENABLED', inline: true },
              { name: '🔒 Confession Board', value: '🟢 ENABLED', inline: true },
              { name: '💬 Custom Commands', value: '🟢 ENABLED', inline: true },
              { name: '🎧 24/7 Lofi Streamer', value: '🟢 ENABLED', inline: true },
              { name: '🤖 Brainrot Slangs', value: '🔴 DISABLED', inline: true },
              { name: '🐾 Pet Simulator', value: '🟢 ENABLED', inline: true }
            ],
            footer: 'Update flags instantly via website dashboard!'
          }
        }
      ]
    }
  },
  {
    name: 'View Bot Status',
    trigger: '!status',
    type: 'prefix',
    category: 'utility',
    description: 'Inspect current CPU, memory footprint, guild count, and online status timers.',
    usage: '!status',
    demoResponse: {
      userMsg: '!status',
      botMsgs: [
        {
          type: 'embed',
          embed: {
            title: '🤖 Bot Core Health Dashboard',
            color: '#3B82F6',
            fields: [
              { name: 'Active Shard', value: '🟢 Shard #0 (Active)', inline: true },
              { name: 'Connected Guilds', value: '📂 512 Servers', inline: true },
              { name: 'Uptime Duration', value: '⏳ 14 Days, 6 Hours', inline: true },
              { name: 'Resource Overhead', value: '💾 RAM: 182MB / CPU: 1.2%', inline: true }
            ],
            footer: 'All systems operational'
          }
        }
      ]
    }
  },
  {
    name: 'Change Bot Status Text',
    trigger: '!status <text>',
    type: 'prefix',
    category: 'utility',
    permissions: 'Developer Override',
    description: 'Adjust the custom playing/watching status message text displayed on the bot.',
    usage: '!status <activity_text>',
    args: ['text'],
    demoResponse: {
      userMsg: '!status drinking iced coffee',
      botMsgs: [
        {
          type: 'text',
          content: '🎮 Bot status activity text adjusted to: **Playing drinking iced coffee**.'
        }
      ]
    }
  },
  {
    name: 'Clear Status Text',
    trigger: '!status clear',
    type: 'prefix',
    category: 'utility',
    permissions: 'Developer Override',
    description: 'Wipe customized status text and restore standard playing activity message.',
    usage: '!status clear',
    demoResponse: {
      userMsg: '!status clear',
      botMsgs: [
        {
          type: 'text',
          content: '🧹 Custom status cleared. Restored standard dashboard presence.'
        }
      ]
    }
  },
  {
    name: 'Utility State Reset',
    trigger: '!reset',
    type: 'prefix',
    category: 'utility',
    permissions: 'Manage Server',
    description: 'Forced hard restart on local server data memory cache arrays.',
    usage: '!reset',
    demoResponse: {
      userMsg: '!reset',
      botMsgs: [
        {
          type: 'text',
          content: '⚡ Cache flush complete. Local state records reloaded from persistent storage.'
        }
      ]
    }
  },

  // 🧠 Brainrot Commands (Concept)
  {
    name: 'Random Slang Chaos',
    trigger: '/brainrot',
    type: 'slash',
    category: 'brainrot',
    description: 'Generates a random text block completely saturated with Gen-Z brainrot slangs.',
    usage: '/brainrot',
    demoResponse: {
      userMsg: '/brainrot',
      botMsgs: [
        {
          type: 'text',
          content: '🔥 skibidi rizzler sigma gyatt fanum tax mewing baby gronky in ohio aura points -9999 level 10 gyatt lookmaxxing griddying with wimpy kid sus skibidi goated gigachad! 💀'
        }
      ]
    }
  },
  {
    name: 'Brainrot Meme',
    trigger: '/meme',
    type: 'slash',
    category: 'brainrot',
    description: 'Retrieve a random chaotic brainrot meme visual or punchline.',
    usage: '/meme',
    demoResponse: {
      userMsg: '/meme',
      botMsgs: [
        {
          type: 'embed',
          embed: {
            title: '💀 When the Mewing streak is broken',
            description: 'The industrial revolution and its consequences have led to me trying to out-rizz a level 10 boss in Ohio.',
            color: '#F59E0B',
            footer: 'Aura lost: -500 aura points'
          }
        }
      ]
    }
  },
  {
    name: 'Meme Sound effect (Slash)',
    trigger: '/sound',
    type: 'slash',
    category: 'brainrot',
    description: 'Plays a classic meme audio clip (vine boom, metal pipe, bruh, etc.) in your active voice channel.',
    usage: '/sound name:vine_boom',
    args: ['name'],
    demoResponse: {
      userMsg: '/sound name: vine_boom',
      botMsgs: [
        {
          type: 'text',
          content: '🔊 Play sound clip: **💥 VINE BOOM SFX** in voice channel "General Lounge".'
        }
      ]
    }
  },
  {
    name: 'NPC Conversationalist',
    trigger: '/npc',
    type: 'slash',
    category: 'brainrot',
    description: 'Generates standard repetitious TikTok live NPC streaming sound bites from your input text.',
    usage: '/npc message:thanks for the roses',
    args: ['message'],
    demoResponse: {
      userMsg: '/npc message: thanks for the roses',
      botMsgs: [
        {
          type: 'text',
          content: '🌸 *Oh, thank you for the roses! Yes yes yes! Ice cream so good! slurp slurp!* 🍦'
        }
      ]
    }
  },
  {
    name: 'Drip Assessment',
    trigger: '/dripcheck',
    type: 'slash',
    category: 'brainrot',
    description: 'Have our AI engine brutally roast or over-hype your profile picture avatar\'s fashion drip levels.',
    usage: '/dripcheck user:<@user>',
    args: ['user'],
    demoResponse: {
      userMsg: '/dripcheck user: @Xander',
      botMsgs: [
        {
          type: 'embed',
          embed: {
            title: '👟 Fashion Drip Evaluation',
            description: 'Assessing profile picture for user <@Xander>...',
            color: '#EF4444',
            fields: [
              { name: 'Drip Level', value: '📉 -200% Absolute Garbage', inline: true },
              { name: 'Verdict', value: 'My toaster has more aesthetic appeal. Did you dress in the dark? 💀', inline: false }
            ],
            footer: 'Rizz rating: Mewing state terminated.'
          }
        }
      ]
    }
  },
  {
    name: 'Corrupt Font Zalgo',
    trigger: '/mirror',
    type: 'slash',
    category: 'brainrot',
    description: 'Distorts your input messages with chaotic glitchy symbols and cursed zalgo characters.',
    usage: '/mirror message:unlocked potential',
    args: ['message'],
    demoResponse: {
      userMsg: '/mirror message: unlocked potential',
      botMsgs: [
        {
          type: 'text',
          content: '👹 **u̶̐͊n̶̅̀l̷͌̈́o̶̽̚c̷̏͛k̶̿͗ë̶̉d̴̅̈́ p̷̀͘o̶̊̈́t̵͑̂e̴͒̚n̶͒͂ẗ̵́̕ḯ̴͑a̶̿̍l̴̄͠** 👹'
        }
      ]
    }
  },
  {
    name: 'Twitter Ratio Strike',
    trigger: '/ratio',
    type: 'slash',
    category: 'brainrot',
    description: 'Launches a fake Twitter-style community ratio mock on the channel.',
    usage: '/ratio',
    demoResponse: {
      userMsg: '/ratio',
      botMsgs: [
        {
          type: 'text',
          content: '🤡 **RATIO DETECTED**! L + Ratio + No Maidens + Mewing streak broken + skibidi toilet fan + touch grass.'
        }
      ]
    }
  },
  {
    name: 'Chaos Multiplier settings',
    trigger: '/chaos',
    type: 'slash',
    category: 'brainrot',
    permissions: 'Administrator',
    description: 'Sets server brainrot slang trigger frequency levels.',
    usage: '/chaos multiplier:10',
    args: ['multiplier'],
    demoResponse: {
      userMsg: '/chaos multiplier: 10',
      botMsgs: [
        {
          type: 'text',
          content: '🚨 **WARNING**: Chaos multiplier updated to **Level 10 (MAXIMUM CRITICAL OVERLOAD)**. Slang replies enabled everywhere.'
        }
      ]
    }
  },
  {
    name: 'Silence Brainrot',
    trigger: '/mute brainrot',
    type: 'slash',
    category: 'brainrot',
    permissions: 'Manage Messages',
    description: 'Temporarily lock and block all chaotic brainrot slangs triggers in the chat.',
    usage: '/mute brainrot',
    demoResponse: {
      userMsg: '/mute brainrot',
      botMsgs: [
        {
          type: 'text',
          content: '🤫 Chat brainrot filters activated. Brainrot triggers will be ignored for 1 hour.'
        }
      ]
    }
  },
  {
    name: 'Uncook Server',
    trigger: '/uncook server',
    type: 'slash',
    category: 'brainrot',
    permissions: 'Administrator',
    description: 'Deactivates all meme overrides, and restores the standard discord guild configuration.',
    usage: '/uncook server',
    demoResponse: {
      userMsg: '/uncook server',
      botMsgs: [
        {
          type: 'text',
          content: '🧹 Server is fully uncooked. Brainrot meme settings reverted. Quiet normality restored.'
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
    { sender: 'user', type: 'text', text: 'present' },
    {
      sender: 'bot',
      type: 'text',
      text: '✅ **Xander#0001** has been marked **Present**!'
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
    { id: 'attendance', label: 'Attendance System', icon: Calendar },
    { id: 'sticky', label: 'Sticky Messages', icon: Pin },
    { id: 'lofi', label: '24/7 Music System', icon: Music },
    { id: 'revival', label: 'Chat Revival', icon: MessageSquare },
    { id: 'nickname', label: 'Auto Nickname', icon: UserCheck },
    { id: 'confession', label: 'Anonymous Confession', icon: Lock },
    { id: 'games', label: 'Game Trackers', icon: Gamepad2 },
    { id: 'pet', label: 'Virtual Pet', icon: Heart },
    { id: 'moderation', label: 'Moderation', icon: ShieldAlert },
    { id: 'dashboard', label: 'Dashboard', icon: Sliders },
    { id: 'utility', label: 'Utility', icon: Terminal },
    { id: 'brainrot', label: 'Brainrot & Memes', icon: Sparkles },
    { id: 'custom', label: 'Custom Commands', icon: Code2 },
  ];

  const categoryMeta: Record<string, { icon: React.ComponentType<any>; colorClass: string }> = {
    attendance: { icon: Calendar, colorClass: 'text-emerald-400' },
    sticky: { icon: Pin, colorClass: 'text-blue-400' },
    lofi: { icon: Music, colorClass: 'text-purple-400' },
    revival: { icon: MessageSquare, colorClass: 'text-red-400' },
    nickname: { icon: UserCheck, colorClass: 'text-indigo-400' },
    confession: { icon: Lock, colorClass: 'text-pink-400' },
    games: { icon: Gamepad2, colorClass: 'text-teal-400' },
    pet: { icon: Heart, colorClass: 'text-rose-400' },
    moderation: { icon: ShieldAlert, colorClass: 'text-amber-500' },
    dashboard: { icon: Sliders, colorClass: 'text-sky-400' },
    utility: { icon: Terminal, colorClass: 'text-zinc-400' },
    brainrot: { icon: Sparkles, colorClass: 'text-amber-400' },
    custom: { icon: Code2, colorClass: 'text-cyan-400' },
  };

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
    <div className="space-y-6" id="commands-tab-container">
      {/* Search and Filters Controls */}
      <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/60 p-5 rounded-3xl flex flex-col gap-4" id="commands-controls">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search bot commands (e.g. present, !play, /pet, brainrot)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl pl-11 pr-4 py-3 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-all shadow-inner"
              id="command-search-input"
            />
          </div>

          {/* Type trigger filter */}
          <div className="flex gap-1.5 bg-zinc-950/80 border border-zinc-800/80 p-1 rounded-2xl shadow-inner shrink-0 self-start md:self-auto" id="command-trigger-filters">
            {[
              { id: 'all' as const, label: 'All Triggers' },
              { id: 'prefix' as const, label: 'Prefix (!)' },
              { id: 'slash' as const, label: 'Slash (/)' }
            ].map((type) => (
              <button
                key={type.id}
                id={`trigger-btn-${type.id}`}
                onClick={() => setTriggerType(type.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${triggerType === type.id ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'}`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Categories sliding rail */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar" id="commands-category-rail">
          {categories.map((cat) => (
            <button
              key={cat.id}
              id={`cat-btn-${cat.id}`}
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" id="commands-main-grid">
        
        {/* Left Side: Commands List */}
        <div className="lg:col-span-7 space-y-4" id="commands-list-section">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-bold text-base md:text-lg tracking-tight">
              Command References 
              <span className="text-zinc-500 font-mono text-xs ml-2">({filteredCommands.length} found)</span>
            </h3>
            <span className="text-[10px] tracking-widest font-black uppercase text-blue-500 flex items-center gap-1.5 bg-blue-500/5 border border-blue-500/10 px-3 py-1 rounded-full">
              <Code2 className="w-3.5 h-3.5" />
              Prefix & Slash Support
            </span>
          </div>

          <div className="space-y-3.5 max-h-[600px] overflow-y-auto pr-1 no-scrollbar" id="commands-scroller">
            {filteredCommands.length === 0 ? (
              <div className="text-center p-12 bg-zinc-900/10 border border-zinc-800/40 rounded-3xl text-zinc-500" id="commands-empty-state">
                <HelpCircle className="w-10 h-10 mx-auto mb-3 opacity-25" />
                <p className="text-sm">No commands match your filters.</p>
                <button 
                  onClick={() => { setSearchTerm(''); setActiveCategory('all'); setTriggerType('all'); }} 
                  className="mt-3 text-xs text-blue-400 hover:underline font-bold"
                  id="commands-reset-btn"
                >
                  Reset all filters
                </button>
              </div>
            ) : (
              filteredCommands.map((cmd) => (
                <motion.div
                  layoutId={`cmd-${cmd.trigger}`}
                  key={cmd.trigger}
                  id={`cmd-card-${cmd.trigger.replace(/[^a-zA-Z0-9]/g, '_')}`}
                  onClick={() => runSimulation(cmd)}
                  className="bg-zinc-900/30 border border-zinc-800/60 hover:border-zinc-700/80 p-4.5 rounded-2xl flex items-start gap-4 hover:bg-zinc-900/50 cursor-pointer group transition-all"
                >
                  {/* Category mini icon */}
                  <div className="w-10 h-10 rounded-xl bg-zinc-950/80 border border-zinc-800/60 flex items-center justify-center shrink-0 group-hover:border-zinc-700">
                    {(() => {
                      const meta = categoryMeta[cmd.category] || { icon: HelpCircle, colorClass: 'text-zinc-400' };
                      const IconComponent = meta.icon;
                      return <IconComponent className={`w-5 h-5 ${meta.colorClass}`} />;
                    })()}
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
                      id={`copy-btn-${cmd.trigger.replace(/[^a-zA-Z0-9]/g, '_')}`}
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
        <div className="lg:col-span-5 space-y-4" id="discord-console-section">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-bold text-base md:text-lg tracking-tight flex items-center gap-2">
              <Terminal className="w-5 h-5 text-blue-400" />
              Discord Live Console
            </h3>
            <button 
              onClick={() => activeDemoCmd && runSimulation(activeDemoCmd)}
              disabled={isSimulating || !activeDemoCmd}
              className="flex items-center gap-1 text-[10px] bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 px-2.5 py-1 rounded-lg active:scale-95 disabled:opacity-50 transition-all font-bold"
              id="rerun-demo-btn"
            >
              <RefreshCw className={`w-3 h-3 ${isSimulating ? 'animate-spin' : ''}`} />
              Re-run Demo
            </button>
          </div>

          <div className="bg-[#2b2d31] rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl flex flex-col h-[490px]" id="discord-mock-box">
            {/* Mock Discord Channel Top bar */}
            <div className="bg-[#313338] px-4.5 py-3 border-b border-[#1f2023] flex items-center gap-2">
              <span className="text-[#949ba4] font-black text-xl">#</span>
              <span className="text-white font-bold text-sm tracking-tight">bot-playground</span>
              <span className="text-[#949ba4] text-xs font-semibold px-2 py-0.5 rounded bg-[#2b2d31] ml-auto">ONE Bot Core</span>
            </div>

            {/* Chat message content box */}
            <div className="flex-1 overflow-y-auto p-4.5 space-y-4 font-sans select-none no-scrollbar">
              
              {/* Help tip when idle */}
              {!isSimulating && simulatedLogs.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#949ba4]" id="discord-console-empty">
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
                <div className="flex gap-4 items-start" id="bot-typing-indicator">
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
            <div className="bg-[#2b2d31] p-4 pt-1.5 border-t border-[#1f2023]" id="discord-mock-input-row">
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
