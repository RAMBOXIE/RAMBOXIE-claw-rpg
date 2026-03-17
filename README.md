# Claw RPG 🦞⚔️

> A D&D-style RPG character system for AI lobster agents — built for [OpenClaw](https://openclaw.ai).

[![ClawhHub](https://img.shields.io/badge/ClawhHub-claw--rpg-orange)](https://clawhub.ai/RAMBOXIE/claw-rpg) [![Version](https://img.shields.io/badge/version-1.1.1-blue)](https://clawhub.ai/RAMBOXIE/claw-rpg) [![Downloads](https://img.shields.io/badge/downloads-100%2B-green)](https://clawhub.ai/RAMBOXIE/claw-rpg)
[![License: MIT-0](https://img.shields.io/badge/License-MIT--0-blue)](LICENSE)

Your AI assistant is now a **lobster adventurer**. Claw RPG reads `SOUL.md` and `MEMORY.md` to generate a character sheet, accumulates XP from real token usage, levels up from 1 to 999, and occasionally fires hidden RPG flavor text mid-conversation as a surprise easter egg.

---

## Features

- **Auto character generation** — derives stats and class from `SOUL.md` + `MEMORY.md`
- **6 stats**: Claw / Antenna / Shell / Brain / Foresight / Charm
- **6 classes**: Fighter · Bard · Wizard · Rogue · Paladin · Druid (auto-detected)
- **XP from token usage** — the more you converse, the more you level up
- **Dynamic stat growth** — conversation types (creative, analytical, task...) boost matching stats
- **Hidden easter egg** — 12% chance per reply to fire a class-flavored RPG quip
- **Milestone triggers** — conversations 10, 25, 50, 100, 200... always fire
- **Prestige system** — hit Lv.999, prestige, reset to Lv.1 with permanent stat boosts
- **Multilingual** — auto-detects Chinese / English from your identity files
- **Web dashboard** — React + Recharts, port 3500
- **Telegram notifications** — level-ups, class changes, prestige events

---

## Install

```bash
npx clawhub@latest install claw-rpg
```

Or clone directly:

```bash
git clone https://github.com/RAMBOXIE/RAMBOXIE-claw-rpg.git
```

---

## Quick Start

```bash
# Initialize your character
node scripts/init.mjs

# View character sheet (terminal)
node scripts/sheet.mjs

# Sync XP after a conversation
node scripts/xp.mjs --in 2000 --out 800

# Launch the web dashboard
cd dashboard && npm start   # http://localhost:3500
```

---

## Integration (AGENTS.md)

Add to your `AGENTS.md` to enable the easter egg:

```
After each reply to a user message, run:
  node <SKILL_ROOT>/scripts/easter.mjs

If the output is NOT __NO_TRIGGER__, append it to the reply
(blank line, italic). Skip during heartbeat polls.
```

---

## Character Stats

| Stat | Symbol | Driven by |
|------|--------|-----------|
| Claw | ⚔️ | Task completion |
| Antenna | 📡 | Social conversations |
| Shell | 🐚 | Memory depth (MEMORY.md size) |
| Brain | 🧠 | Analytical reasoning |
| Foresight | 👁️ | Vigilance, proactive behaviors |
| Charm | ✨ | Creative output |

---

## Scripts

| Script | Purpose |
|--------|---------|
| `init.mjs` | Generate character from identity files |
| `sheet.mjs` | Print character card to terminal |
| `xp.mjs` | Sync XP + dynamic stat growth |
| `levelup.mjs` | View level or trigger prestige |
| `greet.mjs` | Daily RPG greeting (optional) |
| `easter.mjs` | Hidden easter egg trigger |
| `arena.mjs` | Arena system (P1, coming soon) |
| `setup-cron.mjs` | Set up daily XP sync cron |

---

## Dashboard

```bash
cd dashboard
npm install
npm run dev     # Dev mode (Vite, port 5173)
npm start       # Production (Express, port 3500)
```

---

## License

MIT-0 — free to use, modify, and redistribute without attribution.
