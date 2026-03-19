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

const STAT_KEYS = ['claw', 'antenna', 'shell', 'brain', 'foresight', 'charm']

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
function mod(val: number): number { return Math.floor((val - 10) / 2) }
function modStr(val: number): string { const m = mod(val); return (m >= 0 ? '+' : '') + m }
function fmtNum(n: number): string { return n.toLocaleString() }
function fmtSign(n: number): string { return (n >= 0 ? '+' : '') + n }

// ── SoulWeb SVG Component ──────────────────────────────────────

interface SoulWebProps { stats: Stats; classColor: string; size?: number }

function SoulWeb({ stats, classColor, size = 320 }: SoulWebProps) {
  const cx = size / 2, cy = size / 2, R = size * 0.38, maxVal = 20
  const angles = [-90, -30, 30, 90, 150, 210]

  function hexPath(fraction: number): string {
    return angles.map((a, i) => {
      const ang = a * (Math.PI / 180)
      const r = R * fraction
      return `${i === 0 ? 'M' : 'L'}${cx + r * Math.cos(ang)},${cy + r * Math.sin(ang)}`
    }).join(' ') + ' Z'
  }

  function dataPath(): string {
    return STAT_KEYS.map((key, i) => {
      const ang = angles[i] * (Math.PI / 180)
      const val = stats[key as keyof Stats] ?? 10
      const r = (val / maxVal) * R
      return `${i === 0 ? 'M' : 'L'}${cx + r * Math.cos(ang)},${cy + r * Math.sin(ang)}`
    }).join(' ') + ' Z'
  }

  function labelPos(idx: number): [number, number] {
    const ang = angles[idx] * (Math.PI / 180)
    const r = R + 28
    return [cx + r * Math.cos(ang), cy + r * Math.sin(ang)]
  }

  return (
    <svg
      width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      className="soul-web-breathe"
      style={{ overflow: 'visible', display: 'block', margin: '0 auto' }}
    >
      <defs>
        <filter id="soul-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feFlood floodColor={classColor} floodOpacity="0.6" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
          <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Grid rings */}
      {[0.25, 0.5, 0.75, 1.0].map(f => (
        <path key={f} d={hexPath(f)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
      ))}

      {/* Axis lines */}
      {STAT_KEYS.map((_, i) => {
        const ang = angles[i] * (Math.PI / 180)
        return <line key={i} x1={cx} y1={cy}
          x2={cx + R * Math.cos(ang)} y2={cy + R * Math.sin(ang)}
          stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
      })}

      {/* Data polygon */}
      <path d={dataPath()} fill={classColor} fillOpacity={0.25}
        stroke={classColor} strokeWidth={2}
        className="soul-web-polygon" filter="url(#soul-glow)" />

      {/* Labels */}
      {STAT_KEYS.map((key, i) => {
        const [lx, ly] = labelPos(i)
        const info = STAT_INFO[key]
        const val  = stats[key as keyof Stats] ?? 10
        return (
          <g key={key} textAnchor="middle">
            <text x={lx} y={ly - 6} fontSize={11} fill="#94a3b8" dominantBaseline="auto">
              {info.icon} {info.en}
            </text>
            <text x={lx} y={ly + 9} fontSize={11} fill={classColor} dominantBaseline="auto">
              {info.dnd} {val}({modStr(val)})
            </text>
          </g>
        )
      })}

      <circle cx={cx} cy={cy} r={3} fill={classColor} />
    </svg>
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

  if (loading) return <div className="center-msg"><h2>🦞 Loading…</h2></div>

  if (error || !char) return (
    <div className="center-msg">
      <h2>No character found</h2>
      <p>Initialize first:</p><br />
      <code>node scripts/init.mjs</code><br /><br />
      <p style={{ color: '#475569', fontSize: 13 }}>Dashboard auto-connects via SSE</p>
    </div>
  )

  const cls        = CLASSES[char.class] || { en: char.class, icon: '🦞', color: '#14b8a6' }
  const classColor = cls.color
  const title      = TITLES[Math.min(char.prestige, TITLES.length - 1)]
  const progress   = levelProgress(char.xp, char.level)
  const toNext     = xpToNext(char.xp, char.level)

  const derivedItems = [
    { label: 'HP',   val: char.hp   != null ? String(char.hp)           : '—' },
    { label: 'AC',   val: char.ac   != null ? String(char.ac)           : '—' },
    { label: 'Init', val: char.initiative != null ? fmtSign(char.initiative) : '—' },
    { label: 'BAB',  val: char.bab  != null ? fmtSign(char.bab)         : '—' },
    { label: 'Fort', val: char.saves != null ? fmtSign(char.saves.fort) : '—' },
    { label: 'Ref',  val: char.saves != null ? fmtSign(char.saves.ref)  : '—' },
    { label: 'Will', val: char.saves != null ? fmtSign(char.saves.will) : '—' },
  ]

  const feats = char.feats ?? []
  const isClassFeat = (f: string) => /\[.+\]/.test(f)

  return (
    <div className="app">

      {/* ── Header ── */}
      <div className="header" style={{ borderLeft: `4px solid ${classColor}` }}>
        <div className="header-avatar">🦞</div>
        <div className="header-info">
          <div className="header-name">{char.name}</div>
          <span className="header-title">{title}</span>
          <div className="header-class" style={{ color: classColor }}>{cls.icon} {cls.en}</div>
        </div>
        <div className="header-level" style={{ borderColor: classColor + '66' }}>
          <div className="lv-label">LEVEL</div>
          <div className="lv-num" style={{ color: classColor }}>{char.level}</div>
          <div className="header-prestige" style={{ color: classColor }}>
            BAB {char.bab != null ? fmtSign(char.bab) : '—'}
          </div>
        </div>
      </div>

      {/* ── XP Bar ── */}
      <div className="xp-section">
        <div className="xp-labels">
          <span>Experience</span>
          <span>
            <strong>{fmtNum(char.xp)}</strong>
            {char.level < 999 && <> / {fmtNum(xpForLevel(char.level + 1))} XP</>}
          </span>
        </div>
        <div className="xp-bar-track">
          <div className="xp-bar-fill"
            style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${classColor}, ${classColor}bb)` }} />
        </div>
        <div className="xp-sub">
          {char.level >= 999
            ? '🌟 Max Level! Run: node scripts/levelup.mjs --prestige'
            : `${progress}%  ·  ${fmtNum(toNext)} XP to Lv.${char.level + 1}`}
        </div>
      </div>

      {/* ── Main 2-col ── */}
      <div className="grid-2">

        {/* Left: Soul Web + Combat Stats */}
        <div className="card">
          <div className="card-title">Soul Web</div>
          <SoulWeb stats={char.stats} classColor={classColor} size={300} />
          <div className="derived-grid">
            {derivedItems.map(item => (
              <div className="derived-item" key={item.label}>
                <div className="derived-val" style={{ color: classColor }}>{item.val}</div>
                <div className="derived-label">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Ability Scores + Class Features + Feats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          <div className="card">
            <div className="card-title">Ability Scores</div>
            <div className="stat-list">
              {Object.entries(STAT_INFO).map(([key, info]) => {
                const val = char.stats[key as keyof Stats] ?? 10
                return (
                  <div className="stat-row" key={key}>
                    <span className="stat-icon">{info.icon}</span>
                    <span className="stat-name">{info.en}</span>
                    <div className="stat-bar-track">
                      <div className="stat-bar-fill"
                        style={{ width: `${(val / 20) * 100}%`,
                          background: `linear-gradient(90deg, ${classColor}bb, ${classColor})` }} />
                    </div>
                    <span className="stat-val">{val}</span>
                    <span className="stat-mod" style={{ color: classColor }}>{modStr(val)}</span>
                    <span className="stat-dnd">{info.dnd}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="card">
            <div className="card-title">Class Features</div>
            {char.abilities?.length ? (
              <div className="ability-list">
                {char.abilities.map(a => (
                  <span className="ability-badge" key={a}
                    style={{ borderColor: classColor + '66', color: classColor }}>{a}</span>
                ))}
              </div>
            ) : (
              <p style={{ color: '#475569', fontSize: 13 }}>Level up to unlock class features</p>
            )}
          </div>

          <div className="card">
            <div className="card-title">Feats ({feats.length})</div>
            {feats.length ? (
              <div className="feat-list">
                {feats.map(f => (
                  <span key={f}
                    className={`feat-tag${isClassFeat(f) ? ' class-feat' : ''}`}
                    style={isClassFeat(f) ? { color: classColor, borderColor: classColor + '88' } : {}}>
                    {f}
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ color: '#475569', fontSize: 13 }}>No feats yet</p>
            )}
            {(char.classHistory?.length ?? 0) > 0 && (
              <>
                <div className="card-title" style={{ marginTop: 20 }}>Class History</div>
                {char.classHistory.map((h, i) => (
                  <div key={i} style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                    {CLASSES[h.from]?.en ?? h.from} → {CLASSES[h.to]?.en ?? h.to}
                    <span style={{ marginLeft: 6 }}>{h.date?.slice(0, 10)}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom stats ── */}
      <div className="grid-4">
        <div className="stat-card">
          <div className="stat-card-icon">💬</div>
          <div className="stat-card-val">{fmtNum(char.conversations)}</div>
          <div className="stat-card-label">Conversations</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">📥</div>
          <div className="stat-card-val">{fmtNum(char.tokens?.consumed ?? 0)}</div>
          <div className="stat-card-label">Tokens In</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">📤</div>
          <div className="stat-card-val">{fmtNum(char.tokens?.produced ?? 0)}</div>
          <div className="stat-card-label">Tokens Out</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">🌟</div>
          <div className="stat-card-val">{char.prestige}</div>
          <div className="stat-card-label">Prestiges</div>
        </div>
      </div>

      <div className="footer">
        🦞 Claw RPG · Last updated {char.updatedAt?.slice(0, 16).replace('T', ' ')} UTC · Live via SSE
      </div>
    </div>
  )
}
