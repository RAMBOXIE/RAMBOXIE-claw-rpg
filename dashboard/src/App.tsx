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

// ── 像素龍蝦數據 ───────────────────────────────────────────────

const LOBSTER_PIXELS: [number, number, string][] = [
  // 觸角 (A = antenna)
  [3,0,'A'],[8,0,'A'],
  [2,1,'A'],[9,1,'A'],
  [1,2,'A'],[10,2,'A'],
  // 頭部 (H = head = classColor)
  [4,3,'H'],[5,3,'H'],[6,3,'H'],[7,3,'H'],
  [3,4,'H'],[5,4,'H'],[6,4,'H'],[8,4,'H'],
  [3,5,'H'],[4,5,'H'],[5,5,'H'],[6,5,'H'],[7,5,'H'],[8,5,'H'],
  // 眼睛 (W = white)
  [4,4,'W'],[7,4,'W'],
  // 螯 (C = claw = classColor, opacity 0.75)
  [2,4,'C'],[9,4,'C'],
  [1,5,'C'],[2,5,'C'],[9,5,'C'],[10,5,'C'],
  [0,6,'C'],[1,6,'C'],[10,6,'C'],[11,6,'C'],
  [0,7,'C'],[1,7,'C'],[10,7,'C'],[11,7,'C'],
  [1,8,'C'],[10,8,'C'],
  // 身體 (B = body = classColor)
  [3,6,'H'],[8,6,'H'],
  [4,6,'B'],[5,6,'B'],[6,6,'B'],[7,6,'B'],
  [4,7,'B'],[5,7,'B'],[6,7,'B'],[7,7,'B'],
  [4,8,'B'],[5,8,'B'],[6,8,'B'],[7,8,'B'],
  [4,9,'B'],[5,9,'B'],[6,9,'B'],[7,9,'B'],
  // 尾扇 (T = tail = classColor, opacity 0.85)
  [3,10,'T'],[4,10,'T'],[5,10,'T'],[6,10,'T'],[7,10,'T'],[8,10,'T'],
  [2,11,'T'],[3,11,'T'],[5,11,'T'],[6,11,'T'],[8,11,'T'],[9,11,'T'],
  [1,12,'T'],[2,12,'T'],[5,12,'T'],[6,12,'T'],[9,12,'T'],[10,12,'T'],
  [0,13,'T'],[1,13,'T'],[10,13,'T'],[11,13,'T'],
  // 高光 (X = highlight rgba(255,255,255,0.25))
  [5,3,'X'],[4,5,'X'],
]

// ── LobsterSprite 組件 ────────────────────────────────────────

interface LobsterSpriteProps { classColor: string; size?: number }

function LobsterSprite({ classColor, size = 192 }: LobsterSpriteProps) {
  const COLS = 12, ROWS = 14
  const px = size / COLS

  const colorMap: Record<string, string> = {
    A: '#94a3b8',
    H: classColor,
    W: '#ffffff',
    C: classColor,
    B: classColor,
    T: classColor,
    X: 'rgba(255,255,255,0.25)',
  }
  const opacityMap: Record<string, number> = {
    A: 0.9, H: 1, W: 1, C: 0.72, B: 1, T: 0.82, X: 1
  }

  return (
    <svg
      width={size} height={ROWS * px}
      viewBox={`0 0 ${size} ${ROWS * px}`}
      style={{ imageRendering: 'pixelated', display: 'block', margin: '0 auto' }}
      className="lobster-sprite"
    >
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
          <rect
            key={i}
            x={col * px} y={row * px}
            width={px} height={px}
            fill={colorMap[type] ?? classColor}
            opacity={opacityMap[type] ?? 1}
            className={type === 'W' ? 'lobster-eye' : undefined}
          />
        ))}
      </g>
    </svg>
  )
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

// ── SoulWeb SVG Component（保留定義，不使用）─────────────────

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
      {[0.25, 0.5, 0.75, 1.0].map(f => (
        <path key={f} d={hexPath(f)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
      ))}
      {STAT_KEYS.map((_, i) => {
        const ang = angles[i] * (Math.PI / 180)
        return <line key={i} x1={cx} y1={cy}
          x2={cx + R * Math.cos(ang)} y2={cy + R * Math.sin(ang)}
          stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
      })}
      <path d={dataPath()} fill={classColor} fillOpacity={0.25}
        stroke={classColor} strokeWidth={2}
        className="soul-web-polygon" filter="url(#soul-glow)" />
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

  // WC3 計算區
  const mbti        = deriveMBTI(char.stats, char.bab ?? 0)
  const mbtiName    = MBTI_NAMES[mbti] ?? ''
  const alignment   = deriveAlignment(char.stats)
  const rarity      = getRarity(char.level)
  const catchphrase = CATCHPHRASES[char.class] ?? "Ready for anything."
  const rune        = CLASS_RUNE[char.class] ?? '🦞'

  // 抑制 SoulWeb 未使用警告（保留定義但不渲染）
  void (SoulWeb as unknown)

  return (
    <div className="page-bg">
      <div className="card-wrap">
        <div className="card" style={{
          '--class-color': classColor,
          '--rarity-color': rarity.color,
          '--rarity-glow': rarity.glow,
        } as React.CSSProperties}>

          {/* 稀有度 */}
          <div className={`rarity-badge${rarity.label === 'MYTHIC' ? ' mythic-rarity' : ''}`}
            style={{ color: rarity.color }}>{rarity.label}</div>

          {/* 等級水晶 */}
          <div className="level-crystal">{char.level}</div>

          {/* 姓名橫幅 */}
          <div className="name-banner">
            <span className="name-text">{char.name}</span>
          </div>

          {/* 像素龍蝦（替換雷達圖）*/}
          <div className="portrait-frame">
            <div className="class-rune-bg">{rune}</div>
            <LobsterSprite classColor={classColor} size={192} />
          </div>

          {/* 職業橫幅 */}
          <div className="class-banner">{cls.icon} {cls.en}</div>

          {/* 描述框 */}
          <div className="desc-box">

            {/* 1. MBTI */}
            <div className="mbti-section">
              <div className="mbti-code" style={{ color: classColor,
                textShadow: `0 0 12px ${classColor}, 0 0 30px ${classColor}` }}>
                {mbti}
              </div>
              <div className="mbti-sub">
                <span className="mbti-name-text">{mbtiName}</span>
                <span className="mbti-dot"> · </span>
                <span className="alignment-text">{alignment}</span>
              </div>
            </div>

            <div className="divider" />

            {/* 2. 名言 */}
            <div className="quote-section">
              <span className="cq-mark">❝</span>
              <span className="cq-text">{catchphrase}</span>
              <span className="cq-mark">❞</span>
            </div>

            <div className="divider" />

            {/* 3. 核心數值 */}
            <div className="key-stats-section">
              <div className="ks-row">
                {[
                  { l: 'HP',   v: char.hp   ?? '—' },
                  { l: 'AC',   v: char.ac   ?? '—' },
                  { l: 'BAB',  v: char.bab  != null ? fmtSign(char.bab) : '—' },
                  { l: 'INIT', v: char.initiative != null ? fmtSign(char.initiative) : '—' },
                ].map(s => (
                  <div className="ks-cell" key={s.l}>
                    <div className="ks-val" style={{ color: classColor,
                      textShadow: `0 0 8px ${classColor}` }}>{String(s.v)}</div>
                    <div className="ks-label">{s.l}</div>
                  </div>
                ))}
              </div>
              <div className="ks-row ks-saves">
                {[
                  { l: 'FORT', v: char.saves?.fort != null ? fmtSign(char.saves.fort) : '—' },
                  { l: 'REF',  v: char.saves?.ref  != null ? fmtSign(char.saves.ref)  : '—' },
                  { l: 'WILL', v: char.saves?.will != null ? fmtSign(char.saves.will) : '—' },
                ].map(s => (
                  <div className="ks-cell wide" key={s.l}>
                    <div className="ks-val">{s.v}</div>
                    <div className="ks-label">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="divider" />

            {/* 4. 職業能力圖標 */}
            <div className="ability-icons-grid">
              {(char.abilities ?? []).map((ab, i) => (
                <div className="ab-icon-chip" key={ab}
                  style={{ borderColor: classColor + '60', background: classColor + '18' }}>
                  <span className="ab-icon-emoji">{ABILITY_ICONS[char.class]?.[i] ?? '⚡'}</span>
                  <span className="ab-icon-name" style={{ color: classColor }}>{ab}</span>
                </div>
              ))}
            </div>

            <div className="divider" />

            {/* 5. 六屬性小行 */}
            <div className="mini-stat-row">
              {STAT_KEYS.map(k => {
                const val = char.stats[k as keyof Stats] ?? 10
                return (
                  <div className="mini-stat" key={k}
                    style={{ '--pip-color': STAT_COLORS[k] } as React.CSSProperties}>
                    <div className="ms-val">{val}</div>
                    <div className="ms-mod">{modStr(val)}</div>
                    <div className="ms-label">{STAT_INFO[k].dnd}</div>
                  </div>
                )
              })}
            </div>

          </div>{/* .desc-box */}

          {/* 底部寶石 */}
          <div className="card-footer">
            <div className="gem gem-atk">
              <span className="gem-val">{char.bab != null ? fmtSign(char.bab) : '—'}</span>
              <span className="gem-label">BAB</span>
            </div>
            <div className="footer-center">
              <div className="footer-title">{title}</div>
              {char.prestige > 0 && (
                <div className="footer-prestige">✦ Prestige {char.prestige}</div>
              )}
            </div>
            <div className="gem gem-hp">
              <span className="gem-val">{char.hp ?? '—'}</span>
              <span className="gem-label">HP</span>
            </div>
          </div>

        </div>{/* .card */}

        {/* XP 條 */}
        <div className="xp-bar-outer">
          <div className="xp-bar-inner"
            style={{ width: `${progress}%`, '--bar-color': rarity.color } as React.CSSProperties} />
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
