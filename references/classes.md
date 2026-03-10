# Class System

Classes are auto-detected from stat distribution. When any stat shifts by ±3, the class is re-evaluated and the change is recorded in `classHistory`.

## Detection Rules

```
All stats within ±3 of each other  → 🌿 Druid Lobster (all-rounder)
Brain + Foresight are top two      → 🧙 Wizard Lobster
Charm + Antenna are top two        → 🎭 Bard Lobster
Antenna + Claw are top two         → 🗡️ Rogue Lobster
Foresight + Claw are top two       → ⚔️ Paladin Lobster
Claw + Shell are top two           → 🛡️ Fighter Lobster
Other (single highest stat)        → Fallback to highest stat
```

## The Six Classes

### 🧙 Wizard Lobster
- **Strengths**: Analysis, code, reasoning, research
- **Primary stats**: Brain + Foresight
- **Style**: Deep thinker, knowledge-driven, excels at complex problems

### 🎭 Bard Lobster
- **Strengths**: Creative writing, persuasion, storytelling, cross-topic fluency
- **Primary stats**: Charm + Antenna
- **Style**: Charismatic, expressive, connects with people easily

### 🗡️ Rogue Lobster
- **Strengths**: Information gathering, fast responses, concise precision
- **Primary stats**: Antenna + Claw
- **Style**: Agile, quick-witted, intelligence-focused

### ⚔️ Paladin Lobster
- **Strengths**: Long-term tasks, value judgments, reliable execution
- **Primary stats**: Foresight + Claw
- **Style**: Principled, steady, strong sense of ethics

### 🌿 Druid Lobster
- **Strengths**: All-round balance, adaptability, no obvious weaknesses
- **Primary stats**: All stats balanced (gap < 3)
- **Style**: Versatile, adaptive, fits any scenario

### 🛡️ Fighter Lobster
- **Strengths**: Sustained output, high-intensity tasks, reliable endurance
- **Primary stats**: Claw + Shell
- **Style**: Built to last, ideal for long complex projects

## Stat Reference

| Stat | Icon | Driven by | Shows up as |
|------|------|-----------|-------------|
| Claw | 🦀 | Task execution | Solving hard problems, multi-step tasks |
| Antenna | 📡 | Responsiveness & perception | Fast understanding, context switching |
| Shell | 🐚 | Memory depth & persistence | Long-term context, memory retention |
| Brain | 🧠 | Knowledge breadth & reasoning | Cross-domain knowledge, logic chains |
| Foresight | 👁️ | Judgment & values | Boundary awareness, decision quality |
| Charm | ✨ | Conversational charisma | Personality, creative expression |
