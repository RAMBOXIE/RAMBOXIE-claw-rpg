import { useEffect, useState } from 'react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip
} from 'recharts'
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
  hp?: number;
  ac?: number;
  bab?: number;
  saves?: { fort: number; ref: number; will: number };
  initiative?: number;
  feats?: string[];
}

// ── Constants ─────────────────────────────────────────────────

const CLASSES: Record<string, { zh: string; icon: string; color: string }> = {
  barbarian: { zh: '蠻勇龍蝦',   icon: '🪓', color: '#ea580c' },
  fighter:   { zh: '戰士龍蝦',   icon: '⚔️',  color: '#dc2626' },
  paladin:   { zh: '聖騎龍蝦',   icon: '🛡️',  color: '#d97706' },
  ranger:    { zh: '遊俠龍蝦',   icon: '🏹',  color: '#16a34a' },
  cleric:    { zh: '祭司龍蝦',   icon: '✝️',  color: '#7c3aed' },
  druid:     { zh: '德魯伊龍蝦', icon: '🌿', color: '#15803d' },
  monk:      { zh: '武僧龍蝦',   icon: '👊',  color: '#0369a1' },
  rogue:     { zh: '刺客龍蝦',   icon: '🗡️',  color: '#ca8a04' },
  bard:      { zh: '吟遊龍蝦',   icon: '🎭',  color: '#be185d' },
  wizard:    { zh: '法師龍蝦',   icon: '🧙',  color: '#1d4ed8' },
  sorcerer:  { zh: '術士龍蝦',   icon: '🔮',  color: '#7e22ce' },
}

const TITLES = [
  '小龍蝦','龍蝦戰士','龍蝦武士','龍蝦將領','龍蝦將軍',
  '傳說龍蝦','神話龍蝦','史詩龍蝦','上古龍蝦','永恆龍蝦','混沌龍蝦',
]

const STAT_INFO: Record<string, { zh: string; icon: string; dnd: string }> = {
  claw:      { zh: '爪力', icon: '🦀', dnd: 'STR' },
  antenna:   { zh: '敏捷', icon: '📡', dnd: 'DEX' },
  shell:     { zh: '體質', icon: '🐚', dnd: 'CON' },
  brain:     { zh: '智力', icon: '🧠', dnd: 'INT' },
  foresight: { zh: '感知', icon: '👁️', dnd: 'WIS' },
  charm:     { zh: '魅力', icon: '✨', dnd: 'CHA' },
}

// Stat key order for radar (clockwise from top)
const STAT_KEYS = ['claw', 'antenna', 'shell', 'brain', 'foresight', 'charm']

// ── Formulas ──────────────────────────────────────────────────

function xpForLevel(n: number): number {
  if (n <= 1) return 0
  return (n * (n - 1) / 2) * 1000
}
function levelProgress(xp: number, level: number): number {
  if (level >= 999) return 100
  const start = xpForLevel(level)
  const end   = xpForLevel(level + 1)
  return Math.min(100, Math.floor(((xp - start) / (end - start)) * 100))
}
function xpToNext(xp: number, level: number): number {
  if (level >= 999) return 0
  return xpForLevel(level + 1) - xp
}
function mod(val: number): number {
  return Math.floor((val - 10) / 2)
}
function modStr(val: number): string {
  const m = mod(val)
  return (m >= 0 ? '+' : '') + m
}
function fmtNum(n: number): string {
  return n.toLocaleString()
}
function fmtSign(n: number): string {
  return (n >= 0 ? '+' : '') + n
}

// ── SoulWeb SVG Component ──────────────────────────────────────

interface SoulWebProps {
  stats: Stats
  classColor: string
  size?: number
}

function SoulWeb({ stats, classColor, size = 320 }: SoulWebProps) {
  const cx = size / 2
  const cy = size / 2
  const R  = size * 0.38
  const maxVal = 20
  // angles: start at -90° (top), clockwise every 60°
  const angles = [-90, -30, 30, 90, 150, 210]

  // Grid hex at a given fraction of R
  function hexPath(fraction: number): string {
    return angles.map((a, i) => {
      const ang = a * (Math.PI / 180)
      const r   = R * fraction
      const x   = cx + r * Math.cos(ang)
      const y   = cy + r * Math.sin(ang)
      return `${i === 0 ? 'M' : 'L'}${x},${y}`
    }).join(' ') + ' Z'
  }

  // Data polygon
  function dataPath(): string {
    return STAT_KEYS.map((key, i) => {
      const ang = angles[i] * (Math.PI / 180)
      const val = stats[key as keyof Stats] ?? 10
      const r   = (val / maxVal) * R
      const x   = cx + r * Math.cos(ang)
      const y   = cy + r * Math.sin(ang)
      return `${i === 0 ? 'M' : 'L'}${x},${y}`
    }).join(' ') + ' Z'
  }

  // Label position (100% R + 28px outward)
  function labelPos(idx: number): [number, number] {
    const ang = angles[idx] * (Math.PI / 180)
    const r   = R + 28
    return [cx + r * Math.cos(ang), cy + r * Math.sin(ang)]
  }

  const filterId = 'soul-glow'

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="soul-web-breathe"
      style={{ overflow: 'visible', display: 'block', margin: '0 auto' }}
    >
      <defs>
        <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feFlood floodColor={classColor} floodOpacity="0.6" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Grid hexagons: 25%, 50%, 75%, 100% */}
      {[0.25, 0.5, 0.75, 1.0].map(f => (
        <path
          key={f}
          d={hexPath(f)}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={1}
        />
      ))}

      {/* Axis lines */}
      {STAT_KEYS.map((_, i) => {
        const ang = angles[i] * (Math.PI / 180)
        const x2  = cx + R * Math.cos(ang)
        const y2  = cy + R * Math.sin(ang)
        return (
          <line
            key={i}
            x1={cx} y1={cy}
            x2={x2} y2={y2}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={1}
          />
        )
      })}

      {/* Data polygon */}
      <path
        d={dataPath()}
        fill={classColor}
        fillOpacity={0.25}
        stroke={classColor}
        strokeWidth={2}
        className="soul-web-polygon"
        filter={`url(#${filterId})`}
      />

      {/* Axis labels */}
      {STAT_KEYS.map((key, i) => {
        const [lx, ly] = labelPos(i)
        const info = STAT_INFO[key]
        const val  = stats[key as keyof Stats] ?? 10
        const m    = mod(val)
        const mTxt = (m >= 0 ? '+' : '') + m
        return (
          <g key={key} textAnchor="middle">
            <text x={lx} y={ly - 6} fontSize={12} fill="#f1f5f9" dominantBaseline="auto">
              {info.icon} {info.zh}
            </text>
            <text x={lx} y={ly + 10} fontSize={11} fill={classColor} dominantBaseline="auto">
              {info.dnd} {val}({mTxt})
            </text>
          </g>
        )
      })}

      {/* Center dot */}
      <circle cx={cx} cy={cy} r={3} fill={classColor} />
    </svg>
  )
}

// ── Component ─────────────────────────────────────────────────

export default function App() {
  const [char, setChar]       = useState<Character | null>(null)
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchChar = () => {
    fetch('/api/character')
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(d => { setChar(d); setError(null) })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchChar()
    const t = setInterval(fetchChar, 30000)
    return () => clearInterval(t)
  }, [])

  if (loading) return (
    <div className="center-msg">
      <h2>🦞 加載中…</h2>
    </div>
  )

  if (error || !char) return (
    <div className="center-msg">
      <h2>未找到角色卡</h2>
      <p>請先初始化：</p>
      <br />
      <code>node scripts/init.mjs</code>
      <br /><br />
      <p style={{ color: '#475569', fontSize: 13 }}>Dashboard 每 30 秒自動刷新</p>
    </div>
  )

  const cls       = CLASSES[char.class] || { zh: char.class, icon: '🦞', color: '#14b8a6' }
  const classColor = cls.color
  const title     = TITLES[Math.min(char.prestige, TITLES.length - 1)]
  const progress  = levelProgress(char.xp, char.level)
  const toNext    = xpToNext(char.xp, char.level)

  // Derived stats display
  const derivedItems = [
    { icon: '❤️', label: 'HP',   val: char.hp   != null ? String(char.hp)           : '—' },
    { icon: '🛡️', label: 'AC',   val: char.ac   != null ? String(char.ac)           : '—' },
    { icon: '⚡', label: '先攻',  val: char.initiative != null ? fmtSign(char.initiative) : '—' },
    { icon: '⚔️', label: 'BAB',  val: char.bab  != null ? fmtSign(char.bab)         : '—' },
    { icon: '🛡', label: '韌性',  val: char.saves != null ? fmtSign(char.saves.fort) : '—' },
    { icon: '💨', label: '反射',  val: char.saves != null ? fmtSign(char.saves.ref)  : '—' },
    { icon: '🧘', label: '意志',  val: char.saves != null ? fmtSign(char.saves.will) : '—' },
  ]

  // Feats: split class feats vs normal
  const feats = char.feats ?? []
  const isClassFeat = (f: string) => /\[.+\]/.test(f)

  // Suppress unused recharts warning — keep import alive
  void RadarChart; void Radar; void PolarGrid; void PolarAngleAxis
  void ResponsiveContainer; void Tooltip

  return (
    <div className="app">

      {/* ── Header ── */}
      <div
        className="header"
        style={{ borderLeft: `4px solid ${classColor}` }}
      >
        <div className="header-avatar">🦞</div>
        <div className="header-info">
          <div className="header-name">{char.name}</div>
          <div><span className="header-title">{title}</span></div>
          <div className="header-class" style={{ color: classColor }}>{cls.icon} {cls.zh}</div>
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
          <span>經驗值</span>
          <span>
            <strong>{fmtNum(char.xp)}</strong>
            {char.level < 999 && <> / {fmtNum(xpForLevel(char.level + 1))} XP</>}
          </span>
        </div>
        <div className="xp-bar-track">
          <div className="xp-bar-fill" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${classColor}, ${classColor}bb)` }} />
        </div>
        <div className="xp-sub">
          {char.level >= 999
            ? '🌟 滿級！運行 node scripts/levelup.mjs --prestige 轉職'
            : `${progress}%  ·  還差 ${fmtNum(toNext)} XP 升級`}
        </div>
      </div>

      {/* ── Main 2-col ── */}
      <div className="grid-2">

        {/* Left: Soul Web + Derived Stats */}
        <div className="card">
          <div className="card-title">靈魂蛛網</div>
          <SoulWeb stats={char.stats} classColor={classColor} size={300} />

          {/* Derived Stats */}
          <div className="derived-grid">
            {derivedItems.map(item => (
              <div className="derived-item" key={item.label}>
                <div className="derived-val" style={{ color: classColor }}>
                  {item.icon} {item.val}
                </div>
                <div className="derived-label">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Stat bars + Abilities + Feats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Stat bars */}
          <div className="card">
            <div className="card-title">屬性明細</div>
            <div className="stat-list">
              {Object.entries(STAT_INFO).map(([key, info]) => {
                const val = char.stats[key as keyof Stats] ?? 10
                return (
                  <div className="stat-row" key={key}>
                    <span className="stat-icon">{info.icon}</span>
                    <span className="stat-name">{info.zh}</span>
                    <div className="stat-bar-track">
                      <div
                        className="stat-bar-fill"
                        style={{
                          width: `${(val / 20) * 100}%`,
                          background: `linear-gradient(90deg, ${classColor}bb, ${classColor})`,
                        }}
                      />
                    </div>
                    <span className="stat-val">{val}</span>
                    <span className="stat-mod" style={{ color: classColor }}>{modStr(val)}</span>
                    <span className="stat-dnd">{info.dnd}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Class Abilities */}
          <div className="card">
            <div className="card-title">職業特性</div>
            {char.abilities?.length ? (
              <div className="ability-list">
                {char.abilities.map(a => (
                  <span
                    className="ability-badge"
                    key={a}
                    style={{ borderColor: classColor + '66', color: classColor }}
                  >
                    {a}
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ color: '#475569', fontSize: 13 }}>暫無特性，繼續升級解鎖</p>
            )}
          </div>

          {/* Feats */}
          <div className="card">
            <div className="card-title">專長 ({feats.length})</div>
            {feats.length ? (
              <div className="feat-list">
                {feats.map(f => (
                  <span
                    className={`feat-tag${isClassFeat(f) ? ' class-feat' : ''}`}
                    key={f}
                    style={isClassFeat(f) ? { color: classColor, borderColor: classColor + '88' } : {}}
                  >
                    {f}
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ color: '#475569', fontSize: 13 }}>暫無專長</p>
            )}

            {(char.classHistory?.length ?? 0) > 0 && (
              <>
                <div className="card-title" style={{ marginTop: 20 }}>職業歷史</div>
                {char.classHistory.map((h, i) => (
                  <div key={i} style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                    {CLASSES[h.from]?.zh ?? h.from} → {CLASSES[h.to]?.zh ?? h.to}
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
          <div className="stat-card-label">對話次數</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">📥</div>
          <div className="stat-card-val">{fmtNum(char.tokens?.consumed ?? 0)}</div>
          <div className="stat-card-label">消耗 Token</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">📤</div>
          <div className="stat-card-val">{fmtNum(char.tokens?.produced ?? 0)}</div>
          <div className="stat-card-label">產出 Token</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">🌟</div>
          <div className="stat-card-val">{char.prestige}</div>
          <div className="stat-card-label">轉職次數</div>
        </div>
      </div>

      <div className="footer">
        🦞 Claw RPG · 最後更新 {char.updatedAt?.slice(0, 16).replace('T', ' ')} UTC · 每 30 秒自動刷新
      </div>
    </div>
  )
}
