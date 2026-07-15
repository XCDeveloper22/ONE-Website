import re

with open('src/pages/Dashboard.tsx', 'r') as f:
    content = f.read()

bg_glow = """      {/* Subtle background glow */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-[#09090b] to-[#09090b] pointer-events-none"></div>"""

neon_bg = """      {/* Interactive Neon Floating Orbs Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[15%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px] animate-float-neon-1"></div>
        <div className="absolute -bottom-[15%] -right-[10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[120px] animate-float-neon-2"></div>
        <div className="absolute top-[40%] left-[60%] w-[35%] h-[35%] rounded-full bg-pink-500/10 blur-[100px] animate-float-neon-1" style={{ animationDelay: '-4s' }}></div>
      </div>
      
      {/* Subtle background glow */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-[#09090b] to-[#09090b] pointer-events-none z-0"></div>"""

content = content.replace(bg_glow, neon_bg)

with open('src/pages/Dashboard.tsx', 'w') as f:
    f.write(content)

print("Dashboard background patched.")
