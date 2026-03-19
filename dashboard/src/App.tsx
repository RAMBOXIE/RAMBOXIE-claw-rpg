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
  claw:      '#ef4444',  // STR 紅
  antenna:   '#22c55e',  // DEX 綠
  shell:     '#f97316',  // CON 橘
  brain:     '#3b82f6',  // INT 藍
  foresight: '#eab308',  // WIS 黃
  charm:     '#a855f7',  // CHA 紫
}

const STAT_KEYS = ['claw', 'antenna', 'shell', 'brain', 'foresight', 'charm']

// ── WC3 新增常量 ──────────────────────────────────────────────

function deriveMBTI(stats: Stats, bab: number): string {
  const EI = stats.claw    > stats.brain     ? 'E' : 'I'  // STR vs INT
  const SN = stats.charm   > stats.foresight ? 'S' : 'N'  // CHA vs WIS
  const TF = stats.shell   > stats.antenna   ? 'T' : 'F'  // CON vs DEX
  const JP = bab           > 5               ? 'J' : 'P'  // 高 BAB = 果斷
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
  const lc = stats.foresight + stats.shell  // WIS + CON
  const ge = stats.charm + stats.foresight  // CHA + WIS
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
  barbarian: "Rage first. Think later. Win anyway.",
  fighter:   "My claws have never missed. Not once.",
  paladin:   "Justice is not a shield — it's a weapon.",
  ranger:    "I was watching before you even walked in.",
  cleric:    "The gods speak through me. Mostly in complaints.",
  druid:     "The tide rises for all. Especially the foolish.",
  monk:      "Still water. Deep current. Sharp claws.",
  rogue:     "They never hear the second claw.",
  bard:      "They'll write songs about this. Probably me.",
  wizard:    "I have read seventeen books about this mistake.",
  sorcerer:  "I didn't learn this power. I was born with it.",
}

const CLASS_RUNE: Record<string, string> = {
  barbarian:'🪓', fighter:'⚔️', paladin:'🛡️', ranger:'🏹',
  cleric:'✝️', druid:'🌿', monk:'👊', rogue:'🗡️',
  bard:'🎭', wizard:'🧙', sorcerer:'🔮',
}

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

  // WC3 計算區
  const mbti        = deriveMBTI(char.stats, char.bab ?? 0)
  const mbtiName    = MBTI_NAMES[mbti] ?? ''
  const alignment   = deriveAlignment(char.stats)
  const rarity      = getRarity(char.level)
  const catchphrase = CATCHPHRASES[char.class] ?? "Ready for anything."
  const rune        = CLASS_RUNE[char.class] ?? '🦞'

  return (
    <div className="page-bg">
      <div className="card-wrap">
        <div className="card" style={{
          '--class-color': classColor,
          '--rarity-color': rarity.color,
          '--rarity-glow': rarity.glow,
        } as React.CSSProperties}>

          {/* ── 稀有度標籤（左上角）── */}
          <div className="rarity-badge" style={{ color: rarity.color }}>
            {rarity.label}
          </div>

          {/* ── 等級水晶（右上角）── */}
          <div className="level-crystal">{char.level}</div>

          {/* ── 姓名橫幅 ── */}
          <div className="name-banner">
            <span className="name-text">{char.name}</span>
          </div>

          {/* ── 插畫區（含職業圖騰水印 + SoulWeb）── */}
          <div className="portrait-frame">
            {/* WC3 風格：職業圖騰大符文，置於背景 */}
            <div className="class-rune-bg">{rune}</div>
            <SoulWeb stats={char.stats} classColor={classColor} size={260} />
          </div>

          {/* ── 職業橫幅 ── */}
          <div className="class-banner">
            {cls.icon} {cls.en}
          </div>

          {/* ── MBTI + Alignment（身份標籤，傳播核心）── */}
          <div className="identity-row">
            <span className="mbti-badge">{mbti}</span>
            <span className="mbti-name">· {mbtiName}</span>
            <span className="alignment-badge">{alignment}</span>
          </div>

          {/* ── 描述框 ── */}
          <div className="desc-box">

            {/* WC3 風格六屬性：彩色色塊 + 數值 */}
            <div className="stat-pips">
              {STAT_KEYS.map(k => {
                const info = STAT_INFO[k]
                const val  = char.stats[k as keyof Stats] ?? 10
                return (
                  <div className="pip" key={k} style={{ '--pip-color': STAT_COLORS[k] } as React.CSSProperties}>
                    <div className="pip-icon">{info.icon}</div>
                    <div className="pip-val">{val}</div>
                    <div className="pip-mod">{modStr(val)}</div>
                    <div className="pip-dnd">{info.dnd}</div>
                  </div>
                )
              })}
            </div>

            <div className="divider" />

            {/* 衍生數值 */}
            <div className="combat-row">
              {[
                { l: 'HP',   v: char.hp           ?? '—' },
                { l: 'AC',   v: char.ac            ?? '—' },
                { l: 'Init', v: char.initiative != null ? fmtSign(char.initiative) : '—' },
                { l: 'Fort', v: char.saves?.fort  != null ? fmtSign(char.saves.fort) : '—' },
                { l: 'Ref',  v: char.saves?.ref   != null ? fmtSign(char.saves.ref)  : '—' },
                { l: 'Will', v: char.saves?.will  != null ? fmtSign(char.saves.will) : '—' },
              ].map(({l, v}) => (
                <span key={l} className="combat-stat">
                  <span className="combat-label">{l}</span>
                  <strong className="combat-val">{v}</strong>
                </span>
              ))}
            </div>

            <div className="divider" />

            {/* 職業特性 */}
            <div className="features-text">
              {char.abilities?.join(' · ')}
            </div>

            {/* Feats 緊湊 */}
            {feats.length > 0 && (
              <div className="feats-section">
                <span className="feats-label">Feats ({feats.length})</span>
                <div className="feats-compact">
                  {feats.map(f => (
                    <span key={f}
                      className={`feat-chip${isClassFeat(f) ? ' class' : ''}`}
                      style={isClassFeat(f) ? { color: classColor, borderColor: classColor + '60' } : {}}>
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="divider" />

            {/* WC3 英雄台詞 */}
            <div className="catchphrase">
              <span className="cq-mark">❝</span>
              <span className="cq-text">{catchphrase}</span>
              <span className="cq-mark">❞</span>
            </div>

          </div>{/* .desc-box */}

          {/* ── 底部：BAB 寶石 / 稱號 / HP 寶石 ── */}
          <div className="card-footer">
            <div className="gem gem-atk">
              <span className="gem-val">{char.bab != null ? fmtSign(char.bab) : '—'}</span>
              <span className="gem-label">BAB</span>
            </div>
            <div className="footer-center">
              <div className="footer-title">{title}</div>
              <div className="footer-prestige">
                {char.prestige > 0 && `✦ Prestige ${char.prestige}`}
              </div>
            </div>
            <div className="gem gem-hp">
              <span className="gem-val">{char.hp ?? '—'}</span>
              <span className="gem-label">HP</span>
            </div>
          </div>

        </div>{/* .card */}

        {/* XP 條（卡牌外） */}
        <div className="xp-bar-outer">
          <div className="xp-bar-inner"
            style={{ width: `${progress}%`, background: rarity.color }} />
        </div>
        <div className="xp-label-row">
          <span>{fmtNum(char.xp)} XP</span>
          <span>
            {char.level < 999
              ? `${progress}% · ${fmtNum(toNext)} to Lv.${char.level + 1}`
              : '🌟 Max Level!'}
          </span>
        </div>
        <div className="live-badge">⚡ Live · {char.updatedAt?.slice(11,16)} UTC</div>
      </div>
    </div>
  )
}
