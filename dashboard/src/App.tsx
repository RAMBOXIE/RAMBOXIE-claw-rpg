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
}

// ── Constants ─────────────────────────────────────────────────

const CLASSES: Record<string, { zh: string; icon: string }> = {
  wizard:  { zh: '法师龙虾', icon: '🧙' },
  bard:    { zh: '吟游龙虾', icon: '🎭' },
  rogue:   { zh: '游侠龙虾', icon: '🗡️' },
  paladin: { zh: '圣骑龙虾', icon: '⚔️' },
  druid:   { zh: '德鲁伊龙虾', icon: '🌿' },
  fighter: { zh: '战士龙虾', icon: '🛡️' },
}

const TITLES = [
  '小龙虾','龙虾战士','龙虾武士','龙虾将领','龙虾将军',
  '传说龙虾','神话龙虾','史诗龙虾','上古龙虾','永恒龙虾','混沌龙虾',
]

const STAT_INFO: Record<string, { zh: string; icon: string }> = {
  claw:      { zh: '爪力', icon: '🦀' },
  antenna:   { zh: '触觉', icon: '📡' },
  shell:     { zh: '殼厚', icon: '🐚' },
  brain:     { zh: '脑芯', icon: '🧠' },
  foresight: { zh: '慧眼', icon: '👁️' },
  charm:     { zh: '魅影', icon: '✨' },
}

// ── Formulas ──────────────────────────────────────────────────

function xpForLevel(n: number): number {
  if (n <= 1) return 0
  return Math.floor(200 * Math.pow(n - 1, 1.6))
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
function modStr(val: number): string {
  const m = Math.floor((val - 10) / 2)
  return (m >= 0 ? '+' : '') + m
}
function fmtNum(n: number): string {
  return n.toLocaleString()
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
      <h2>🦞 加载中…</h2>
    </div>
  )

  if (error || !char) return (
    <div className="center-msg">
      <h2>未找到角色卡</h2>
      <p>请先初始化：</p>
      <br />
      <code>node scripts/init.mjs</code>
      <br /><br />
      <p style={{ color: '#475569', fontSize: 13 }}>Dashboard 每 30 秒自动刷新</p>
    </div>
  )

  const cls      = CLASSES[char.class] || { zh: char.class, icon: '🦞' }
  const title    = TITLES[Math.min(char.prestige, TITLES.length - 1)]
  const progress = levelProgress(char.xp, char.level)
  const toNext   = xpToNext(char.xp, char.level)

  // Radar data
  const radarData = Object.entries(STAT_INFO).map(([key, info]) => ({
    stat: info.zh,
    icon: info.icon,
    value: char.stats[key as keyof Stats] ?? 10,
    fullMark: 20,
  }))

  return (
    <div className="app">

      {/* ── Header ── */}
      <div className="header">
        <div className="header-avatar">🦞</div>
        <div className="header-info">
          <div className="header-name">{char.name}</div>
          <div><span className="header-title">{title}</span></div>
          <div className="header-class">{cls.icon} {cls.zh}</div>
        </div>
        <div className="header-level">
          <div className="lv-label">LEVEL</div>
          <div className="lv-num">{char.level}</div>
          <div className="header-prestige">转职 ×{char.prestige}</div>
        </div>
      </div>

      {/* ── XP Bar ── */}
      <div className="xp-section">
        <div className="xp-labels">
          <span>经验值</span>
          <span>
            <strong>{fmtNum(char.xp)}</strong>
            {char.level < 999 && <> / {fmtNum(xpForLevel(char.level + 1))} XP</>}
          </span>
        </div>
        <div className="xp-bar-track">
          <div className="xp-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="xp-sub">
          {char.level >= 999
            ? '🌟 满级！运行 node scripts/levelup.mjs --prestige 转职'
            : `${progress}%  ·  还差 ${fmtNum(toNext)} XP 升级`}
        </div>
      </div>

      {/* ── Middle 3-col ── */}
      <div className="grid-3">

        {/* Radar */}
        <div className="card radar-card">
          <div className="card-title">属性雷达</div>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(20,184,166,.2)" />
              <PolarAngleAxis
                dataKey="stat"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
              />
              <Radar
                dataKey="value"
                stroke="#f97316"
                fill="#14b8a6"
                fillOpacity={0.35}
                strokeWidth={2}
              />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid rgba(20,184,166,.3)', borderRadius: 8, fontSize: 13 }}
                labelStyle={{ color: '#f1f5f9' }}
                itemStyle={{ color: '#14b8a6' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Stat bars */}
        <div className="card">
          <div className="card-title">属性明细</div>
          <div className="stat-list">
            {Object.entries(STAT_INFO).map(([key, info]) => {
              const val = char.stats[key as keyof Stats] ?? 10
              return (
                <div className="stat-row" key={key}>
                  <span className="stat-icon">{info.icon}</span>
                  <span className="stat-name">{info.zh}</span>
                  <div className="stat-bar-track">
                    <div className="stat-bar-fill" style={{ width: `${(val / 20) * 100}%` }} />
                  </div>
                  <span className="stat-val">{val}</span>
                  <span className="stat-mod">{modStr(val)}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Abilities */}
        <div className="card">
          <div className="card-title">已解锁技能</div>
          {char.abilities?.length ? (
            <div className="ability-list">
              {char.abilities.map(a => (
                <span className="ability-badge" key={a}>{a}</span>
              ))}
            </div>
          ) : (
            <p style={{ color: '#475569', fontSize: 13 }}>暂无技能，继续升级解锁</p>
          )}
          {(char.classHistory?.length ?? 0) > 0 && (
            <>
              <div className="card-title" style={{ marginTop: 20 }}>职业历史</div>
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

      {/* ── Bottom stats ── */}
      <div className="grid-4">
        <div className="stat-card">
          <div className="stat-card-icon">💬</div>
          <div className="stat-card-val">{fmtNum(char.conversations)}</div>
          <div className="stat-card-label">对话次数</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">📥</div>
          <div className="stat-card-val">{fmtNum(char.tokens?.consumed ?? 0)}</div>
          <div className="stat-card-label">消耗 Token</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">📤</div>
          <div className="stat-card-val">{fmtNum(char.tokens?.produced ?? 0)}</div>
          <div className="stat-card-label">产出 Token</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">🌟</div>
          <div className="stat-card-val">{char.prestige}</div>
          <div className="stat-card-label">转职次数</div>
        </div>
      </div>

      <div className="footer">
        🦞 Claw RPG · 最后更新 {char.updatedAt?.slice(0, 16).replace('T', ' ')} UTC · 每 30 秒自动刷新
      </div>
    </div>
  )
}
