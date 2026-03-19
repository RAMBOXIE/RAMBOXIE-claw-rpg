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

function SoulWeb({ stats, classColor, size = 280 }: SoulWebProps) {
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
    const r = R + 26
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
            <text x={lx} y={ly - 5} fontSize={10} fill="#94a3b8" dominantBaseline="auto">
              {info.icon} {info.dnd}
            </text>
            <text x={lx} y={ly + 8} fontSize={10} fill={classColor} dominantBaseline="auto">
              {val}({modStr(val)})
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

  if (loading) return (
    <div className="center-msg">
      <h2>🦞 Loading…</h2>
    </div>
  )

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
  const feats      = char.feats ?? []
  const isClassFeat = (f: string) => /\[.+\]/.test(f)

  return (
    <div className="page-bg">
      <div className="card-wrap">

        {/* 卡牌主體 */}
        <div className="card" style={{ '--class-color': classColor } as React.CSSProperties}>

          {/* 等級水晶 */}
          <div className="level-crystal">{char.level}</div>

          {/* 姓名橫幅 */}
          <div className="name-banner">
            <span className="name-text">{char.name}</span>
          </div>

          {/* 插畫區 */}
          <div className="portrait-frame">
            <SoulWeb stats={char.stats} classColor={classColor} size={280} />
          </div>

          {/* 職業橫幅 */}
          <div className="class-banner">
            {cls.icon} {cls.en}
          </div>

          {/* 描述框 */}
          <div className="desc-box">

            {/* 六屬性行 */}
            <div className="ability-row">
              {STAT_KEYS.map(k => {
                const info = STAT_INFO[k]
                const val  = char.stats[k as keyof Stats]
                return (
                  <div className="ability-cell" key={k}>
                    <div className="ability-dnd" style={{ color: classColor }}>{info.dnd}</div>
                    <div className="ability-num">{val}</div>
                    <div className="ability-mod">{modStr(val)}</div>
                  </div>
                )
              })}
            </div>

            <div className="divider" />

            {/* 衍生數值 */}
            <div className="combat-row">
              <span>AC <strong>{char.ac ?? '—'}</strong></span>
              <span>Init <strong style={{ color: classColor }}>{fmtSign(char.initiative ?? 0)}</strong></span>
              <span>Fort <strong>{fmtSign(char.saves?.fort ?? 0)}</strong></span>
              <span>Ref <strong>{fmtSign(char.saves?.ref ?? 0)}</strong></span>
              <span>Will <strong>{fmtSign(char.saves?.will ?? 0)}</strong></span>
            </div>

            <div className="divider" />

            {/* 職業特性 */}
            {char.abilities?.length > 0 && (
              <div className="features-text">
                {char.abilities.join(' · ')}
              </div>
            )}

            {/* Feats 緊湊 */}
            {feats.length > 0 && (
              <div className="feats-section">
                <span className="feats-label">Feats ({feats.length})</span>
                <div className="feats-compact">
                  {feats.map(f => (
                    <span
                      key={f}
                      className={`feat-chip${isClassFeat(f) ? ' class' : ''}`}
                      style={isClassFeat(f) ? { color: classColor } : {}}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

          </div>{/* .desc-box */}

          {/* 底部欄 */}
          <div className="card-footer">
            {/* 攻擊寶石（左） */}
            <div className="gem gem-atk">
              <span className="gem-val">{char.bab != null ? fmtSign(char.bab) : '—'}</span>
              <span className="gem-label">BAB</span>
            </div>

            {/* 中間稱號 */}
            <div className="footer-title">{title}</div>

            {/* 生命寶石（右） */}
            <div className="gem gem-hp">
              <span className="gem-val">{char.hp ?? '—'}</span>
              <span className="gem-label">HP</span>
            </div>
          </div>

        </div>{/* .card */}

        {/* XP 條（卡牌下方） */}
        <div className="xp-bar-outer">
          <div className="xp-bar-inner" style={{ width: `${progress}%`, background: classColor }} />
        </div>
        <div className="xp-label-row">
          <span>{fmtNum(char.xp)} XP</span>
          <span>{progress}% · {fmtNum(toNext)} to Lv.{char.level + 1}</span>
        </div>

        {/* 底部連接狀態 */}
        <div className="live-badge">⚡ Live via SSE · {char.updatedAt?.slice(11, 16)} UTC</div>

      </div>{/* .card-wrap */}
    </div>
  )
}
