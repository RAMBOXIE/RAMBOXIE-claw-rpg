import { useEffect, useState } from 'react'
import './App.css'

// ── Types ────────────────────────────────────────────────────────
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
  levelHistory:  Array<{ level: number; date: string }>;
  updatedAt: string;
  prestigeXpMultiplier?: number;
  hp?: number; ac?: number; bab?: number;
  saves?: { fort: number; ref: number; will: number };
  initiative?: number; feats?: string[];
}

// ── Constants ────────────────────────────────────────────────────
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
const CATCHPHRASES: Record<string, string> = {
  barbarian:'Rage first. Think later.',
  fighter:'My claws never missed.',
  paladin:'Justice is a weapon.',
  ranger:'I was watching before you walked in.',
  cleric:'The gods speak through me.',
  druid:'The tide rises for all.',
  monk:'Still water. Deep current.',
  rogue:'They never hear the second claw.',
  bard:"They'll write songs about this.",
  wizard:"I've read 17 books on this mistake.",
  sorcerer:'Born with it. Not learned.',
}
const TITLES = [
  'Apprentice','Warrior Lobster','Knight Lobster','Commander Lobster',
  'General Lobster','Legendary Lobster','Mythic Lobster','Epic Lobster',
  'Ancient Lobster','Eternal Lobster','Chaos Lobster',
]

// ── Helpers ──────────────────────────────────────────────────────
function xpForLevel(n: number) { return n <= 1 ? 0 : (n*(n-1)/2)*1000 }
function levelProgress(xp: number, level: number) {
  if (level >= 999) return 100
  const s = xpForLevel(level), e = xpForLevel(level+1)
  return Math.min(100, Math.floor(((xp-s)/(e-s))*100))
}
function xpToNext(xp: number, level: number) {
  return level >= 999 ? 0 : xpForLevel(level+1)-xp
}
function fmtNum(n: number) { return n.toLocaleString() }
function fmtSign(n: number) { return (n>=0?'+':'')+n }

function deriveMBTI(stats: Stats, bab: number): string {
  return (stats.claw > stats.brain ? 'E' : 'I')
       + (stats.charm > stats.foresight ? 'S' : 'N')
       + (stats.shell > stats.antenna  ? 'T' : 'F')
       + (bab > 5 ? 'J' : 'P')
}
function deriveAlignment(stats: Stats): string {
  const lc = stats.foresight + stats.shell
  const ge = stats.charm + stats.foresight
  const law  = lc >= 26 ? 'Lawful'  : lc <= 18 ? 'Chaotic' : 'Neutral'
  const good = ge >= 26 ? 'Good'    : ge <= 18 ? 'Evil'    : 'Neutral'
  return (law === 'Neutral' && good === 'Neutral') ? 'True Neutral' : `${law} ${good}`
}

// ── Pixel Lobster ────────────────────────────────────────────────
const LOBSTER_PIXELS: [number,number,string][] = [
  [3,0,'A'],[8,0,'A'],[2,1,'A'],[9,1,'A'],[1,2,'A'],[10,2,'A'],
  [4,3,'H'],[5,3,'H'],[6,3,'H'],[7,3,'H'],
  [3,4,'H'],[5,4,'H'],[6,4,'H'],[8,4,'H'],
  [3,5,'H'],[4,5,'H'],[5,5,'H'],[6,5,'H'],[7,5,'H'],[8,5,'H'],
  [4,4,'W'],[7,4,'W'],
  [2,4,'C'],[9,4,'C'],[1,5,'C'],[2,5,'C'],[9,5,'C'],[10,5,'C'],
  [0,6,'C'],[1,6,'C'],[10,6,'C'],[11,6,'C'],
  [0,7,'C'],[1,7,'C'],[10,7,'C'],[11,7,'C'],[1,8,'C'],[10,8,'C'],
  [3,6,'H'],[8,6,'H'],
  [4,6,'B'],[5,6,'B'],[6,6,'B'],[7,6,'B'],
  [4,7,'B'],[5,7,'B'],[6,7,'B'],[7,7,'B'],
  [4,8,'B'],[5,8,'B'],[6,8,'B'],[7,8,'B'],
  [4,9,'B'],[5,9,'B'],[6,9,'B'],[7,9,'B'],
  [3,10,'T'],[4,10,'T'],[5,10,'T'],[6,10,'T'],[7,10,'T'],[8,10,'T'],
  [2,11,'T'],[3,11,'T'],[5,11,'T'],[6,11,'T'],[8,11,'T'],[9,11,'T'],
  [1,12,'T'],[2,12,'T'],[5,12,'T'],[6,12,'T'],[9,12,'T'],[10,12,'T'],
  [0,13,'T'],[1,13,'T'],[10,13,'T'],[11,13,'T'],
]
function LobsterSprite({ classColor, size=160 }: { classColor: string; size?: number }) {
  const COLS=12, ROWS=14, px=size/COLS
  const cm: Record<string,string> = { A:'#94a3b8',H:classColor,W:'#fff',C:classColor,B:classColor,T:classColor }
  const om: Record<string,number> = { A:0.9,H:1,W:1,C:0.72,B:1,T:0.82 }
  return (
    <svg width={size} height={ROWS*px} viewBox={`0 0 ${size} ${ROWS*px}`}
      style={{ imageRendering:'pixelated', display:'block', margin:'0 auto' }}>
      <defs>
        <filter id="lg2" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feFlood floodColor={classColor} floodOpacity="0.6" result="c"/>
          <feComposite in="c" in2="blur" operator="in" result="g"/>
          <feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <g filter="url(#lg2)">
        {LOBSTER_PIXELS.map(([col,row,type],i)=>(
          <rect key={i} x={col*px} y={row*px} width={px} height={px}
            fill={cm[type]??classColor} opacity={om[type]??1}/>
        ))}
      </g>
    </svg>
  )
}

// ── App ──────────────────────────────────────────────────────────
export default function App() {
  const [char, setChar]       = useState<Character|null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string|null>(null)

  useEffect(() => {
    fetch('/api/character')
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(d => { setChar(d); setError(null) })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
    const es = new EventSource('/api/events')
    es.onmessage = e => {
      try { const d=JSON.parse(e.data); setChar(d); setError(null); setLoading(false) } catch {}
    }
    return () => es.close()
  }, [])

  if (loading) return <div className="skin-msg">🦞 Loading…</div>
  if (error || !char) return <div className="skin-msg">No character data.<br/><code>node scripts/init.mjs</code></div>

  const cls          = CLASSES[char.class] || { en: char.class, icon:'🦞', color:'#dc2626' }
  const lobsterColor = cls.color
  const progress     = levelProgress(char.xp, char.level)
  const toNext       = xpToNext(char.xp, char.level)
  const mbti         = deriveMBTI(char.stats, char.bab??0)
  const alignment    = deriveAlignment(char.stats)
  const title        = TITLES[Math.min(char.prestige, TITLES.length-1)]
  const phrase       = CATCHPHRASES[char.class] ?? 'Ready.'
  const saves        = char.saves ?? { fort:0, ref:0, will:0 }

  // ── Coordinate map (percentages of 1280×960 image) ─────────────
  // Black screen : x=500, y=155, w=290, h=250
  // Left  panel  : x=160, y=330, w=370, h=150
  // Right panel  : x=760, y=330, w=370, h=150
  // Face area    : x=480, y=490, w=320, h=310
  const pct = (x: number, y: number, w: number, h: number) => ({
    position: 'absolute' as const,
    left:   `${(x/1280*100).toFixed(3)}%`,
    top:    `${(y/960*100).toFixed(3)}%`,
    width:  `${(w/1280*100).toFixed(3)}%`,
    height: `${(h/960*100).toFixed(3)}%`,
  })

  return (
    <div className="skin-wrap">
      {/* ── Base image ── */}
      <img src="/winamp-skin.jpg" className="skin-img" alt="Winamp skin"/>

      {/* ════════════════════════════════════════════════════════
          CENTER BLACK SCREEN — Lobster + identity
          ════════════════════════════════════════════════════════ */}
      <div className="skin-screen" style={pct(500,155,290,250)}>
        <div className="screen-scanlines"/>
        <div className="screen-inner">
          <LobsterSprite classColor={lobsterColor} size={130}/>
          <div className="screen-id">
            <span className="sc-mbti">{mbti}</span>
            <span className="sc-dot"> · </span>
            <span className="sc-align">{alignment}</span>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          LEFT GREEN PANEL — Name · Level · Class
          Most viral: who is this character?
          ════════════════════════════════════════════════════════ */}
      <div className="skin-panel skin-left" style={pct(164,330,365,150)}>
        <div className="lp-name">{char.name}</div>
        <div className="lp-row">
          <span className="lp-lv">Lv.{char.level}</span>
          <span className="lp-cls">{cls.icon} {cls.en}</span>
        </div>
        <div className="lp-title">{title}</div>
        <div className="lp-xp">
          <div className="lp-xpbar">
            <div className="lp-xpfill" style={{width:`${progress}%`}}/>
          </div>
          <div className="lp-xplabel">{fmtNum(char.xp)} XP · {char.level<999?`${fmtNum(toNext)} to Lv.${char.level+1}`:'MAX'}</div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          RIGHT GREEN PANEL — Combat stats
          Most viral: HP / AC / BAB + saves
          ════════════════════════════════════════════════════════ */}
      <div className="skin-panel skin-right" style={pct(755,330,365,150)}>
        <div className="rp-stats">
          <div className="rp-stat">
            <span className="rp-v">{char.hp ?? '—'}</span>
            <span className="rp-l">HP</span>
          </div>
          <div className="rp-stat">
            <span className="rp-v">{char.ac ?? '—'}</span>
            <span className="rp-l">AC</span>
          </div>
          <div className="rp-stat">
            <span className="rp-v">{char.bab != null ? fmtSign(char.bab) : '—'}</span>
            <span className="rp-l">BAB</span>
          </div>
        </div>
        <div className="rp-saves">
          {([['FORT',saves.fort??0],['REF',saves.ref??0],['WILL',saves.will??0]] as [string,number][]).map(([l,v])=>(
            <div key={l} className="rp-save">
              <span className="rp-sl">{l}</span>
              <span className="rp-sv">{fmtSign(v)}</span>
            </div>
          ))}
        </div>
        <div className="rp-convs">⚡ {char.conversations ?? 0} conversations</div>
      </div>

      {/* ════════════════════════════════════════════════════════
          FACE AREA — Catch phrase + prestige
          ════════════════════════════════════════════════════════ */}
      <div className="skin-face" style={pct(480,490,320,310)}>
        <div className="fa-phrase">"{phrase}"</div>
        {char.prestige > 0 && <div className="fa-prestige">★ Prestige {char.prestige}</div>}
        <div className="fa-updated">{char.updatedAt?.slice(11,16)}</div>
      </div>
    </div>
  )
}
