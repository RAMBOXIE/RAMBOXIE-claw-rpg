# Claw RPG 🦞⚔️

> A **D&D 3.5** RPG character system for AI lobster agents — built for [OpenClaw](https://openclaw.ai).

[![ClawhHub](https://img.shields.io/badge/ClawhHub-claw--rpg-orange)](https://clawhub.ai/RAMBOXIE/claw-rpg) [![Version](https://img.shields.io/badge/version-2.1.0-blue)](https://clawhub.ai/RAMBOXIE/claw-rpg) [![License: MIT-0](https://img.shields.io/badge/License-MIT--0-blue)](LICENSE)

Your AI assistant is now a **lobster adventurer** running on **standard D&D 3.5 rules**. Claw RPG reads `SOUL.md` and `MEMORY.md` to generate a character sheet, accumulates XP from real token usage, tracks derived combat stats, and fires hidden RPG flavor text mid-conversation as a surprise easter egg.

---

## Dashboard Preview

![Claw RPG Soul Web Dashboard](https://raw.githubusercontent.com/RAMBOXIE/RAMBOXIE-claw-rpg/main/docs/screenshots/dashboard-v2.1.0.jpg)

*Soul Web — hexagonal ability radar with class-themed glow, live derived stats (HP/AC/BAB/saves), and real-time SSE push.*

---

## What's New in v2.1.0

- 🕸️ **Soul Web** — custom SVG hexagonal radar with breathing animation and per-class glow color
- ⚡ **Real-time SSE** — dashboard updates instantly when `character.json` changes (no polling)
- 🌐 **Full English UI** — all labels, class names, and stat names in English
- ⚔️ **D&D 3.5 rules** (since v2.0.0): 11 classes, standard XP table, HP/AC/BAB/saves/initiative
- 🎯 **Feats system** — auto-generated class & general feats displayed with color-coded badges

---

## Features

- **Auto character generation** — derives stats and class from `SOUL.md` + `MEMORY.md`
- **D&D 3.5 ability scores** — STR / DEX / CON / INT / WIS / CHA with standard modifiers `floor((score−10)/2)`
- **11 classes** — Barbarian · Fighter · Paladin · Ranger · Cleric · Druid · Monk · Rogue · Bard · Wizard · Sorcerer
- **Standard XP table** — `n × (n−1) / 2 × 1000` per level (no level cap)
- **Derived combat stats** — HP, AC, BAB, Fort / Ref / Will saves, Initiative
- **Feats** — general feats every 3 levels + class bonus feats (Fighter gets the most)
- **Class features** — 4 unlockable features per class at Lv.1 / Lv.4 / Lv.8 / Lv.16
- **XP from token usage** — the more you converse, the more you level up
- **Dynamic stat growth** — conversation types boost matching ability scores
- **Hidden easter egg** — 12% chance per reply to fire a class-flavored RPG quip
- **Milestone triggers** — conversations 10, 25, 50, 100, 200… always fire
- **Prestige system** — hit Lv.999, prestige, reset with permanent stat boosts
- **Web dashboard** — Soul Web SVG radar + combat stats, live SSE updates, LAN-accessible
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
# 1. Initialize your character (reads SOUL.md + MEMORY.md)
node scripts/init.mjs

# 2. View character sheet (terminal)
node scripts/sheet.mjs

# 3. Sync XP after a conversation
node scripts/xp.mjs --in 2000 --out 800

# 4. Launch the web dashboard (http://localhost:3500)
cd dashboard && npm install && npm start
```

---

## Dashboard

```bash
cd dashboard
npm install
npm start   # Production server — http://localhost:3500
```

The dashboard is **LAN-accessible** — open `http://<your-ip>:3500` from any device on the same network. It connects via **Server-Sent Events (SSE)** and updates live whenever `character.json` changes (XP sync, level-up, stat growth).

---

## D&D 3.5 Ability Scores

| Key | D&D 3.5 | Icon | Driven by |
|-----|---------|------|-----------|
| `claw` | STR | 🦀 | Task execution, multi-step work |
| `antenna` | DEX | 📡 | Response speed, context switching |
| `shell` | CON | 🐚 | Memory depth, long-context persistence |
| `brain` | INT | 🧠 | Knowledge breadth, reasoning |
| `foresight` | WIS | 👁️ | Judgment, values, proactive behaviors |
| `charm` | CHA | ✨ | Creative output, conversational charisma |

---

## Classes (11)

| Class | Icon | Color | Primary Stats | HD | BAB |
|-------|------|-------|--------------|-----|-----|
| Barbarian | 🪓 | Orange | STR dominant | d12 | Full |
| Fighter | ⚔️ | Red | STR + CON | d10 | Full |
| Paladin | 🛡️ | Amber | STR + CHA | d10 | Full |
| Ranger | 🏹 | Green | DEX + WIS | d8 | Full |
| Cleric | ✝️ | Purple | WIS + CON | d8 | ¾ |
| Druid | 🌿 | Dark Green | Balanced | d8 | ¾ |
| Monk | 👊 | Blue | WIS + DEX | d8 | ¾ |
| Rogue | 🗡️ | Gold | DEX + INT | d6 | ¾ |
| Bard | 🎭 | Pink | CHA + DEX | d6 | ¾ |
| Wizard | 🧙 | Deep Blue | INT + WIS | d4 | ½ |
| Sorcerer | 🔮 | Deep Purple | CHA dominant | d4 | ½ |

---

## Scripts

| Script | Purpose |
|--------|---------|
| `init.mjs` | Generate character from identity files |
| `sheet.mjs` | Print D&D 3.5 character card to terminal |
| `xp.mjs` | Sync XP + dynamic stat/class updates |
| `levelup.mjs` | View level or trigger prestige |
| `greet.mjs` | Daily RPG greeting (optional) |
| `easter.mjs` | Hidden easter egg trigger |
| `arena.mjs` | Arena system (coming soon) |
| `setup-cron.mjs` | Set up daily XP sync cron |

---

## Integration (AGENTS.md)

Add to your `AGENTS.md` to enable the easter egg:

```
After each reply to a user message, run:
  node <SKILL_ROOT>/scripts/easter.mjs

If output is NOT __NO_TRIGGER__, append it (blank line, italic).
Skip during heartbeat polls.
```

---

## License

MIT-0 — free to use, modify, and redistribute without attribution.
