import { useEffect, useState } from 'react'
import './App.css'

// ── Types ─────────────────────────────────────────────────────

interface Stats {
  claw: number; antenna: number; shell: number;
  brain: number; foresight: number; charm: number;
}
interface Character {
  name: string; class: string; level: number; prestige: number; xp: number;
  stats: Stats; abilities: string[];
  tokens: { consumed: number; produced: number };
  conversations: number;
  classHistory: Array<{ from: string; to: string; date: string }>;
  levelHistory: Array<{ level: number; date: string }>;
  updatedAt: string;
  prestigeXpMultiplier?: number;
  hp?: number; ac?: number; bab?: number;
  saves?: { fort: number; ref: number; will: number };
  initiative?: number; feats?: string[];
}

// ── Constants ─────────────────────────────────────────────────

const CLASSES: Record<string, { en: string; icon: string; color: string }> = {
  barbarian: { en: 'Berserker Lobster', icon: '🪓', color: '#ea580c' },
  fighter:   { en: 'Fighter Lobster',   icon: '⚔️',  color: '#dc2626' },
  paladin:   { en: 'Paladin Lobster',   icon: '🛡️',  color: '#d97706' },
  ranger:    { en: 'Ranger Lobster',    icon: '🏹',  color: '#16a34a' },
  cleric:    { en: 'Cleric Lobster',    icon: '✝️',  color: '#7c3aed' },
  druid:     { en: 'Druid Lobster',     icon: '🌿',  color: '#15803d' },
  monk:      { en: 'Monk Lobster',      icon: '👊',  color: '#0369a1' },
  rogue:     { en: 'Rogue Lobster',     icon: '🗡️',  color: '#ca8a04' },
  bard:      { en: 'Bard Lobster',      icon: '🎭',  color: '#be185d' },
  wizard:    { en: 'Wizard Lobster',    icon: '🧙',  color: '#1d4ed8' },
  sorcerer:  { en: 'Sorcerer Lobster',  icon: '🔮',  color: '#7e22ce' },
}

const TITLES = [
  'Apprentice', 'Warrior Lobster', 'Knight Lobster', 'Commander Lobster', 'General Lobster',
  'Legendary Lobster', 'Mythic Lobster', 'Epic Lobster', 'Ancient Lobster',
  'Eternal Lobster', 'Chaos Lobster',
]

const STAT_INFO: Record<string, { en: string; icon: string; dnd: string }> = {
  claw:      { en: 'Strength',     icon: '🦀', dnd: 'STR' },
  antenna:   { en: 'Dexterity',    icon: '📡', dnd: 'DEX' },
  shell:     { en: 'Constitution', icon: '🐚', dnd: 'CON' },
  brain:     { en: 'Intelligence', icon: '🧠', dnd: 'INT' },
  foresight: { en: 'Wisdom',       icon: '👁️', dnd: 'WIS' },
  charm:     { en: 'Charisma',     icon: '✨', dnd: 'CHA' },
}

const STAT_COLORS: Record<string, string> = {
  claw:      '#ef4444',
  antenna:   '#22c55e',
  shell:     '#f97316',
  brain:     '#3b82f6',
  foresight: '#eab308',
  charm:     '#a855f7',
}

const STAT_KEYS = ['claw', 'antenna', 'shell', 'brain', 'foresight', 'charm']

function deriveMBTI(stats: Stats, bab: number): string {
  const EI = stats.claw    > stats.brain     ? 'E' : 'I'
  const SN = stats.charm   > stats.foresight ? 'S' : 'N'
  const TF = stats.shell   > stats.antenna   ? 'T' : 'F'
  const JP = bab           > 5               ? 'J' : 'P'
  return EI + SN + TF + JP
}

const MBTI_NAMES: Record<string, string> = {
  'INTJ':'The Architect',   'INTP':'The Logician',
  'ENTJ':'The Commander',   'ENTP':'The Debater',
  'INFJ':'The Advocate',    'INFP':'The Mediator',
  'ENFJ':'The Protagonist', 'ENFP':'The Campaigner',
  'ISTJ':'The Logistician', 'ISFJ':'The Defender',
  'ESTJ':'The Executive',   'ESFJ':'The Consul',
  'ISTP':'The Virtuoso',    'ISFP':'The Adventurer',
  'ESTP':'The Entrepreneur','ESFP':'The Entertainer',
}

function deriveAlignment(stats: Stats): string {
  const lc = stats.foresight + stats.shell
  const ge = stats.charm + stats.foresight
  const law  = lc >= 26 ? 'Lawful'  : lc <= 18 ? 'Chaotic' : 'Neutral'
  const good = ge >= 26 ? 'Good'    : ge <= 18 ? 'Evil'    : 'Neutral'
  return (law === 'Neutral' && good === 'Neutral') ? 'True Neutral' : `${law} ${good}`
}

function getRarity(level: number): { label: string; color: string; glow: string } {
  if (level >= 100) return { label: 'MYTHIC',    color: '#f0abfc', glow: 'rgba(240,171,252,0.5)' }
  if (level >= 61)  return { label: 'LEGENDARY', color: '#fbbf24', glow: 'rgba(251,191,36,0.5)'  }
  if (level >= 31)  return { label: 'EPIC',       color: '#a78bfa', glow: 'rgba(167,139,250,0.4)' }
  if (level >= 16)  return { label: 'RARE',       color: '#60a5fa', glow: 'rgba(96,165,250,0.4)'  }
  if (level >= 6)   return { label: 'UNCOMMON',   color: '#4ade80', glow: 'rgba(74,222,128,0.4)'  }
  return                   { label: 'COMMON',     color: '#94a3b8', glow: 'rgba(148,163,184,0.3)' }
}

const CATCHPHRASES: Record<string, string> = {
  barbarian: "Rage first. Think later.",
  fighter:   "My claws never missed.",
  paladin:   "Justice is a weapon.",
  ranger:    "I was watching before you walked in.",
  cleric:    "The gods speak through me.",
  druid:     "The tide rises for all.",
  monk:      "Still water. Deep current.",
  rogue:     "They never hear the second claw.",
  bard:      "They'll write songs about this.",
  wizard:    "I've read 17 books on this.",
  sorcerer:  "Born with it. Not learned.",
}

const CLASS_RUNE: Record<string, string> = {
  barbarian:'🪓', fighter:'⚔️', paladin:'🛡️', ranger:'🏹',
  cleric:'✝️', druid:'🌿', monk:'👊', rogue:'🗡️',
  bard:'🎭', wizard:'🧙', sorcerer:'🔮',
}

const ABILITY_ICONS: Record<string, string[]> = {
  barbarian: ['💢','⚡','🔥','🔱'],
  fighter:   ['⚔️','🗡️','🏟️','🛡️'],
  paladin:   ['☀️','✨','🛡️','⚜️'],
  ranger:    ['🏹','🌲','💨','🦅'],
  cleric:    ['✝️','💀','🌟','👼'],
  druid:     ['🌿','🐺','🌊','🌀'],
  monk:      ['👊','💨','🧘','☯️'],
  rogue:     ['🗡️','👁️','💎','☠️'],
  bard:      ['🎵','💬','🎭','📖'],
  wizard:    ['🔮','📚','⚡','👁️'],
  sorcerer:  ['🐉','💫','⚡','🌀'],
}

// ── Pixel Lobster ───────────────────────────────────────────────

const LOBSTER_PIXELS: [number, number, string][] = [
  [3,0,'A'],[8,0,'A'],
  [2,1,'A'],[9,1,'A'],
  [1,2,'A'],[10,2,'A'],
  [4,3,'H'],[5,3,'H'],[6,3,'H'],[7,3,'H'],
  [3,4,'H'],[5,4,'H'],[6,4,'H'],[8,4,'H'],
  [3,5,'H'],[4,5,'H'],[5,5,'H'],[6,5,'H'],[7,5,'H'],[8,5,'H'],
  [4,4,'W'],[7,4,'W'],
  [2,4,'C'],[9,4,'C'],
  [1,5,'C'],[2,5,'C'],[9,5,'C'],[10,5,'C'],
  [0,6,'C'],[1,6,'C'],[10,6,'C'],[11,6,'C'],
  [0,7,'C'],[1,7,'C'],[10,7,'C'],[11,7,'C'],
  [1,8,'C'],[10,8,'C'],
  [3,6,'H'],[8,6,'H'],
  [4,6,'B'],[5,6,'B'],[6,6,'B'],[7,6,'B'],
  [4,7,'B'],[5,7,'B'],[6,7,'B'],[7,7,'B'],
  [4,8,'B'],[5,8,'B'],[6,8,'B'],[7,8,'B'],
  [4,9,'B'],[5,9,'B'],[6,9,'B'],[7,9,'B'],
  [3,10,'T'],[4,10,'T'],[5,10,'T'],[6,10,'T'],[7,10,'T'],[8,10,'T'],
  [2,11,'T'],[3,11,'T'],[5,11,'T'],[6,11,'T'],[8,11,'T'],[9,11,'T'],
  [1,12,'T'],[2,12,'T'],[5,12,'T'],[6,12,'T'],[9,12,'T'],[10,12,'T'],
  [0,13,'T'],[1,13,'T'],[10,13,'T'],[11,13,'T'],
  [5,3,'X'],[4,5,'X'],
]

function LobsterSprite({ classColor, size = 160 }: { classColor: string; size?: number }) {
  const COLS = 12, ROWS = 14
  const px = size / COLS
  const colorMap: Record<string, string> = {
    A: '#94a3b8', H: classColor, W: '#ffffff',
    C: classColor, B: classColor, T: classColor, X: 'rgba(255,255,255,0.25)',
  }
  const opacityMap: Record<string, number> = {
    A: 0.9, H: 1, W: 1, C: 0.72, B: 1, T: 0.82, X: 1
  }
  return (
    <svg width={size} height={ROWS * px} viewBox={`0 0 ${size} ${ROWS * px}`}
      style={{ imageRendering: 'pixelated', display: 'block', margin: '0 auto' }}
      className="lobster-sprite">
      <defs>
        <filter id="lobster-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feFlood floodColor={classColor} floodOpacity="0.5" result="color"/>
          <feComposite in="color" in2="blur" operator="in" result="glow"/>
          <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <g filter="url(#lobster-glow)">
        {LOBSTER_PIXELS.map(([col, row, type], i) => (
          <rect key={i} x={col * px} y={row * px} width={px} height={px}
            fill={colorMap[type] ?? classColor}
            opacity={opacityMap[type] ?? 1}
            className={type === 'W' ? 'lobster-eye' : undefined}
          />
        ))}
      </g>
    </svg>
  )
}

// ── SoulWeb (kept, not rendered) ──────────────────────────────

interface SoulWebProps { stats: Stats; classColor: string; size?: number }
function SoulWeb(_props: SoulWebProps) { return null }

// ── Formulas ──────────────────────────────────────────────────

function xpForLevel(n: number): number {
  if (n <= 1) return 0
  return (n * (n - 1) / 2) * 1000
}
function levelProgress(xp: number, level: number): number {
  if (level >= 999) return 100
  const start = xpForLevel(level), end = xpForLevel(level + 1)
  return Math.min(100, Math.floor(((xp - start) / (end - start)) * 100))
}
function xpToNext(xp: number, level: number): number {
  if (level >= 999) return 0
  return xpForLevel(level + 1) - xp
}
function fmtNum(n: number): string { return n.toLocaleString() }
function fmtSign(n: number): string { return (n >= 0 ? '+' : '') + n }

// ── Speaker Component ─────────────────────────────────────────

function Speaker({ color, delay = 0 }: { color: string; delay?: number }) {
  return (
    <div className="speaker-unit" style={{ animationDelay: `${delay}s` }}>
      <svg width="58" height="58" viewBox="0 0 58 58">
        <defs>
          <radialGradient id={`sg-${delay}`} cx="38%" cy="32%" r="60%">
            <stop offset="0%"   stopColor="#484860" />
            <stop offset="40%"  stopColor="#1e1e2e" />
            <stop offset="100%" stopColor="#080810" />
          </radialGradient>
          <radialGradient id={`sc-${delay}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#2a2a3a" />
            <stop offset="100%" stopColor="#0a0a14" />
          </radialGradient>
        </defs>
        {/* Outer ring */}
        <circle cx="29" cy="29" r="27" fill={`url(#sg-${delay})`} />
        <circle cx="29" cy="29" r="27" fill="none" stroke="#555" strokeWidth="1.5" />
        {/* Highlight */}
        <ellipse cx="22" cy="18" rx="10" ry="6" fill="rgba(255,255,255,0.06)" />
        {/* Mid ring */}
        <circle cx="29" cy="29" r="19" fill="none" stroke="#3a3a4a" strokeWidth="1" />
        {/* Inner cone */}
        <circle cx="29" cy="29" r="13" fill={`url(#sc-${delay})`} />
        <circle cx="29" cy="29" r="13" fill="none" stroke="#2a2a3a" strokeWidth="1" />
        {/* Center dot */}
        <circle cx="29" cy="29" r="5" fill="#111118" stroke="#333" strokeWidth="1" />
        {/* Color ring glow */}
        <circle cx="29" cy="29" r="27" fill="none" stroke={color} strokeWidth="1.5" opacity="0.35" />
      </svg>
    </div>
  )
}

// ── App ───────────────────────────────────────────────────────

export default function App() {
  const [char, setChar]       = useState<Character | null>(null)
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/character')
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(d => { setChar(d); setError(null) })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))

    const es = new EventSource('/api/events')
    es.onmessage = (e) => {
      try { const d = JSON.parse(e.data); setChar(d); setError(null); setLoading(false) } catch {}
    }
    return () => es.close()
  }, [])

  if (loading) return (
    <div className="center-msg"><h2>🦞 Loading…</h2></div>
  )
  if (error || !char) return (
    <div className="center-msg">
      <h2>No character found</h2>
      <p>Run: <code>node scripts/init.mjs</code></p>
    </div>
  )

  const cls        = CLASSES[char.class] || { en: char.class, icon: '🦞', color: '#14b8a6' }
  const classColor = cls.color
  const title      = TITLES[Math.min(char.prestige, TITLES.length - 1)]
  const progress   = levelProgress(char.xp, char.level)
  const toNext     = xpToNext(char.xp, char.level)
  const mbti       = deriveMBTI(char.stats, char.bab ?? 0)
  const mbtiName   = MBTI_NAMES[mbti] ?? ''
  const alignment  = deriveAlignment(char.stats)
  const rarity     = getRarity(char.level)
  const catchphrase = CATCHPHRASES[char.class] ?? 'Ready.'
  const rune       = CLASS_RUNE[char.class] ?? '🦞'
  const feats      = char.feats ?? []
  const abilities  = char.abilities ?? []
  const saves      = char.saves ?? { fort: 0, ref: 0, will: 0 }

  void (SoulWeb as unknown)

  const EQ_SEGS = 14

  return (
    <div className="page-wrap" style={{
      '--class-color': classColor,
      '--rarity-color': rarity.color,
    } as React.CSSProperties}>

      {/* ════════════════════════════════════════════════════
          WINAMP GRID — head spans rows 1-3, wings row 2 only
          ════════════════════════════════════════════════════ */}
      <div className="winamp-grid">

        {/* ── Left speakers (col 1, rows 1-3) ── */}
        <div className="spk-col spk-left">
          <Speaker color={classColor} delay={0} />
          <Speaker color={classColor} delay={0.4} />
          <Speaker color={classColor} delay={0.8} />
        </div>

        {/* ── Left EQ wing (col 2, row 2 ONLY) ── */}
        <div className="wing wing-left">
          <div className="wing-hdr">EQUALIZER</div>

          {/* 6 stat EQ bars */}
          <div className="eq-bars">
            {STAT_KEYS.map(k => {
              const val   = char.stats[k as keyof Stats] ?? 10
              const color = STAT_COLORS[k]
              const lit   = Math.round((val / 20) * EQ_SEGS)
              return (
                <div className="eq-col" key={k}>
                  <div className="eq-track">
                    {Array.from({ length: EQ_SEGS }, (_, i) => (
                      <div key={i}
                        className={`eq-seg${EQ_SEGS - 1 - i < lit ? ' lit' : ''}`}
                        style={{ '--seg-color': color } as React.CSSProperties}
                      />
                    ))}
                  </div>
                  <div className="eq-lbl" style={{ color }}>{STAT_INFO[k].dnd}</div>
                  <div className="eq-val">{val}</div>
                </div>
              )
            })}
          </div>

          {/* Save sliders */}
          <div className="saves-section">
            {[
              { l: 'FORT', v: saves.fort ?? 0 },
              { l: 'REF',  v: saves.ref  ?? 0 },
              { l: 'WILL', v: saves.will ?? 0 },
            ].map(s => (
              <div className="save-row" key={s.l}>
                <span className="save-lbl">{s.l}</span>
                <div className="save-track">
                  <div className="save-fill"
                    style={{ width: `${Math.min(100, Math.max(5, ((s.v + 12) / 24) * 100))}%` }} />
                  <div className="save-thumb"
                    style={{ left: `${Math.min(95, Math.max(2, ((s.v + 12) / 24) * 100))}%` }} />
                </div>
                <span className="save-val">{fmtSign(s.v)}</span>
              </div>
            ))}
          </div>

          {/* HP / AC / BAB strip at bottom */}
          <div className="wing-stats-row">
            {[
              { l: 'HP',  v: char.hp   ?? '—' },
              { l: 'AC',  v: char.ac   ?? '—' },
              { l: 'BAB', v: char.bab  != null ? fmtSign(char.bab) : '—' },
            ].map(s => (
              <div className="wing-stat" key={s.l}>
                <span className="ws-val" style={{ color: classColor }}>{String(s.v)}</span>
                <span className="ws-lbl">{s.l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════
            CENTER: ALIEN HEAD (col 3, rows 1-3)
            Taller than wings — protrudes above and below
            ══════════════════════════════════════════════════ */}
        <div className="alien-head">

          {/* ── TOP ZONE (row 1): transport controls ── */}
          <div className="head-top">
            <div className="head-title-bar">CLAW RPG</div>
            <div className="transport-row">
              <div className="tport-btn">
                {char.prestige > 0 ? `★${char.prestige}` : '◀◀'}
              </div>
              <div className="tport-btn cls-icon">{cls.icon}</div>
              <div className="tport-btn lvl-num">{char.level}</div>
              <div className="tport-btn rar-tag"
                style={{ color: rarity.color, textShadow: `0 0 8px ${rarity.color}` }}>
                {rarity.label.slice(0,3)}
              </div>
              <div className="tport-btn xp-pct">{progress}%</div>
            </div>
          </div>

          {/* ── MIDDLE ZONE (row 2): CRT screen ── */}
          <div className="head-middle">
            <div className="crt-monitor">
              <div className="crt-scanlines" />
              <div className="crt-rune">{rune}</div>
              <LobsterSprite classColor={classColor} size={160} />
            </div>
            <div className="head-id-row">
              <span className="head-mbti" style={{
                color: classColor,
                textShadow: `0 0 10px ${classColor}`
              }}>{mbti}</span>
              <span className="head-dot"> · </span>
              <span className="head-align">{alignment}</span>
            </div>
            <div className="head-mbti-name">{mbtiName}</div>
          </div>

          {/* ── BOTTOM ZONE (row 3): chin / name ── */}
          <div className="head-bottom">
            <div className="head-name" style={{
              color: '#fff',
              textShadow: `0 0 8px #fff, 0 0 24px ${classColor}`
            }}>{char.name}</div>
            <div className="head-class-line">
              {cls.icon} <span style={{ color: classColor }}>{cls.en}</span>
            </div>
            <div className="head-quote">"{catchphrase}"</div>
            <div className="xp-bar-outer">
              <div className="xp-bar-inner" style={{ width: `${progress}%` }} />
            </div>
            <div className="xp-row">
              <span>{fmtNum(char.xp)} XP</span>
              <span>{char.level < 999 ? `${fmtNum(toNext)} to Lv.${char.level + 1}` : 'MAX'}</span>
            </div>
            <div className="live-badge">⚡ {title} · LIVE {char.updatedAt?.slice(11,16)}</div>
          </div>

        </div>{/* .alien-head */}

        {/* ── Right playlist wing (col 4, row 2 ONLY) ── */}
        <div className="wing wing-right">
          <div className="wing-hdr">
            FEATS
            <span className="feat-count">{String(feats.length).padStart(2, '0')}</span>
          </div>

          <div className="playlist">
            {feats.length === 0
              ? <div className="pl-empty">— no feats —</div>
              : feats.map((f, i) => (
                <div key={f} className={`pl-row${i === 0 ? ' pl-active' : ''}`}>
                  <span className="pl-idx">{String(i + 1).padStart(2, '0')}</span>
                  <span className="pl-name">{f.length > 21 ? f.slice(0, 20) + '…' : f}</span>
                </div>
              ))
            }
          </div>

          <div className="abil-section">
            <div className="abil-hdr">ABILITIES</div>
            <div className="abil-grid">
              {abilities.slice(0, 4).map((ab, i) => (
                <div key={ab} className="abil-chip"
                  style={{ '--chip-color': classColor } as React.CSSProperties}>
                  <span className="abil-icon">{ABILITY_ICONS[char.class]?.[i] ?? '⚡'}</span>
                  <span className="abil-name">{ab.length > 13 ? ab.slice(0,12)+'…' : ab}</span>
                </div>
              ))}
            </div>
          </div>

          {/* INIT / WILL corner stats */}
          <div className="wing-stats-row">
            {[
              { l: 'INIT', v: char.initiative != null ? fmtSign(char.initiative) : '—' },
              { l: 'WILL', v: saves.will != null ? fmtSign(saves.will) : '—' },
              { l: 'XP',   v: `${progress}%` },
            ].map(s => (
              <div className="wing-stat" key={s.l}>
                <span className="ws-val" style={{ color: classColor }}>{s.v}</span>
                <span className="ws-lbl">{s.l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right speakers (col 5, rows 1-3) ── */}
        <div className="spk-col spk-right">
          <Speaker color={classColor} delay={0.2} />
          <Speaker color={classColor} delay={0.6} />
          <Speaker color={classColor} delay={1.0} />
        </div>

      </div>{/* .winamp-grid */}
    </div>
  )
}
