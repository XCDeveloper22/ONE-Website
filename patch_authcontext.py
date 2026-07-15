import re

with open('src/contexts/AuthContext.tsx', 'r') as f:
    content = f.read()

# Login transition length
content = content.replace("progress += 5;", "progress += 1;")
content = content.replace("setInterval(() => {", "setInterval(() => {", 1) # First setInterval
content = content.replace("}, 80);", "}, 40);", 1) # First setInterval end

# Logout transition length
content = content.replace("progress += 8;", "progress += 1;")
content = content.replace("}, 80);", "}, 40);") # Replaces all remaining, including the second one.

# Login terms
content = content.replace("'Synchronizing Dashboard'", "'Logging In'")
content = content.replace("'Authenticating secure session with Discord...'", "'Getting things ready...'")
content = content.replace("'Connecting to Discord Secure Gateway...'", "'Connecting to Discord...'")
content = content.replace("'Synchronizing servers, profile & active roles...'", "'Loading your profile...'")
content = content.replace("'Initializing ONE real-time Gateway Websocket...'", "'Setting up your dashboard...'")
content = content.replace("'Preparing dashboard layouts & preferences...'", "'Almost there...'")
content = content.replace("'Welcome back, Operator!'", "'Welcome back!'")

# Logout terms
content = content.replace("'Initiating secure session termination...'", "'Signing you out...'")
content = content.replace("'Revoking Discord active session tokens...'", "'Disconnecting from Discord...'")
content = content.replace("'Clearing local session caches & credentials...'", "'Clearing your data...'")
content = content.replace("'Terminating real-time server connections...'", "'Finishing up...'")
content = content.replace("'Session terminated safely.'", "'You have been logged out.'")

with open('src/contexts/AuthContext.tsx', 'w') as f:
    f.write(content)

print("AuthContext patched.")
