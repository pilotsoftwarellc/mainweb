import subprocess
import os

# SSH command to run Python on VPS
ssh_cmd = [
    "sshpass", "-e", "ssh", "-o", "StrictHostKeyChecking=accept-new",
    "root@207.180.230.125"
]

# Get VPS password
env = os.environ.copy()
env["SSHPASS"] = subprocess.check_output(
    f"awk '{{print $3}}' ~/Documents/Dev/_secrets/vps-login.txt",
    shell=True
).decode().strip()

result = subprocess.run(
    ssh_cmd + ["python3", "-c", r"""
import re
with open("/opt/pilot-site-backend/server.js", "r") as f:
    code = f.read()

# Fix 1: Remove duplicate CSS lines
lines = code.split("\n")
seen = set()
new_lines = []
dup_patterns = set([
    ".chart-tip{position:absolute;top:-28px;left:50%;transform:translateX(-50%);background:#0E1420;border:1px solid rgba(0,217,255,.35);border-radius:8px;padding:4px 10px;font-size:.68rem;font-family:JetBrains Mono,monospace;color:#F2F6FA;pointer-events:none;white-space:nowrap;opacity:0;transition:opacity .15s}",
    ".dt:hover+.chart-tip{opacity:1}",
    ".dt:hover + .chart-tip{opacity:1}",
])
for line in lines:
    stripped = line.rstrip("\n")
    if stripped in dup_patterns:
        if stripped not in seen:
            seen.add(stripped)
            new_lines.append(line)
    else:
        new_lines.append(line)
code = "\n".join(new_lines)

# Fix 2: Fix duplicate .dt CSS
code = code.replace(
    ".dt{fill:#00D9FF;stroke:#04121A;stroke-width:1.5;cursor:pointer}\n.dt{fill:#00D9FF;stroke:#04121A;stroke-width:1.5;cursor:pointer;transition:r .15s,filter .15s}",
    ".dt{fill:#00D9FF;stroke:#04121A;stroke-width:1.5;cursor:pointer;transition:r .15s,filter .15s}"
)

# Fix 3: Add chart-tip spans to dots
old_dots = r'const dayDots = days.map((x,i) => x.n > 0 ? `<circle class="dt" cx="${px(i)}" cy="${py(x.n)}" r="7"><title>${x.d.slice(5)} · ${x.n} visit${x.n===1?\'s\':\'\'}</title></circle>` : \'\').join(\'\');'
new_dots = r'const dayDots = days.map((x,i) => x.n > 0 ? `<circle class="dt" cx="${px(i)}" cy="${py(x.n)}" r="7"><title>${x.d.slice(5)} · ${x.n} visit${x.n===1?\'s\':\'\'}</title></circle><span class="chart-tip">${x.d.slice(5)} · ${x.n}</span>` : \'\').join(\'\');'
code = code.replace(old_dots, new_dots)

with open("/opt/pilot-site-backend/server.js", "w") as f:
    f.write(code)
print("Done")
"""]
)

print(result.stdout.decode())
