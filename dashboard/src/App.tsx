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
  'Apprentice','Warrior Lobster','Knight Lobster','Commander Lobster','General Lobster',
  'Legendary Lobster','Mythic Lobster','Epic Lobster','Ancient Lobster','Eternal Lobster','Chaos Lobster',
]
const STAT_INFO: Record<string, { dnd: string }> = {
  claw:      { dnd: 'STR' },
  antenna:   { dnd: 'DEX' },
  shell:     { dnd: 'CON' },
  brain:     { dnd: 'INT' },
  foresight: { dnd: 'WIS' },
  charm:     { dnd: 'CHA' },
}
const STAT_COLORS: Record<string, string> = {
  claw:'#ef4444', antenna:'#22c55e', shell:'#f97316',
  brain:'#3b82f6', foresight:'#eab308', charm:'#a855f7',
}
const STAT_KEYS = ['claw','antenna','shell','brain','foresight','charm']

function deriveMBTI(stats: Stats, bab: number): string {
  const EI = stats.claw > stats.brain ? 'E' : 'I'
  const SN = stats.charm > stats.foresight ? 'S' : 'N'
  const TF = stats.shell > stats.antenna ? 'T' : 'F'
  const JP = bab > 5 ? 'J' : 'P'
  return EI + SN + TF + JP
}
const MBTI_NAMES: Record<string,string> = {
  'INTJ':'The Architect','INTP':'The Logician','ENTJ':'The Commander','ENTP':'The Debater',
  'INFJ':'The Advocate','INFP':'The Mediator','ENFJ':'The Protagonist','ENFP':'The Campaigner',
  'ISTJ':'The Logistician','ISFJ':'The Defender','ESTJ':'The Executive','ESFJ':'The Consul',
  'ISTP':'The Virtuoso','ISFP':'The Adventurer','ESTP':'The Entrepreneur','ESFP':'The Entertainer',
}
function deriveAlignment(stats: Stats): string {
  const lc = stats.foresight + stats.shell
  const ge = stats.charm + stats.foresight
  const law  = lc >= 26 ? 'Lawful'  : lc <= 18 ? 'Chaotic' : 'Neutral'
  const good = ge >= 26 ? 'Good'    : ge <= 18 ? 'Evil'    : 'Neutral'
  return (law === 'Neutral' && good === 'Neutral') ? 'True Neutral' : `${law} ${good}`
}
function getRarity(level: number) {
  if (level >= 100) return { label: 'MYTHIC',    color: '#f0abfc' }
  if (level >= 61)  return { label: 'LEGENDARY', color: '#fbbf24' }
  if (level >= 31)  return { label: 'EPIC',       color: '#a78bfa' }
  if (level >= 16)  return { label: 'RARE',       color: '#60a5fa' }
  if (level >= 6)   return { label: 'UNCOMMON',   color: '#4ade80' }
  return               { label: 'COMMON',     color: '#94a3b8' }
}
const CATCHPHRASES: Record<string,string> = {
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
const CLASS_RUNE: Record<string,string> = {
  barbarian:'🪓',fighter:'⚔️',paladin:'🛡️',ranger:'🏹',
  cleric:'✝️',druid:'🌿',monk:'👊',rogue:'🗡️',bard:'🎭',wizard:'🧙',sorcerer:'🔮',
}
const ABILITY_ICONS: Record<string,string[]> = {
  barbarian:['💢','⚡','🔥','🔱'],fighter:['⚔️','🗡️','🏟️','🛡️'],
  paladin:['☀️','✨','🛡️','⚜️'],ranger:['🏹','🌲','💨','🦅'],
  cleric:['✝️','💀','🌟','👼'],druid:['🌿','🐺','🌊','🌀'],
  monk:['👊','💨','🧘','☯️'],rogue:['🗡️','👁️','💎','☠️'],
  bard:['🎵','💬','🎭','📖'],wizard:['🔮','📚','⚡','👁️'],sorcerer:['🐉','💫','⚡','🌀'],
}

// ── Pixel Lobster ─────────────────────────────────────────────

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
  [5,3,'X'],[4,5,'X'],
]
function LobsterSprite({ classColor, size=160 }: { classColor:string; size?:number }) {
  const COLS=12, ROWS=14, px=size/COLS
  const cm: Record<string,string> = { A:'#94a3b8',H:classColor,W:'#fff',C:classColor,B:classColor,T:classColor,X:'rgba(255,255,255,0.25)' }
  const om: Record<string,number> = { A:0.9,H:1,W:1,C:0.72,B:1,T:0.82,X:1 }
  return (
    <svg width={size} height={ROWS*px} viewBox={`0 0 ${size} ${ROWS*px}`}
      style={{ imageRendering:'pixelated', display:'block', margin:'0 auto' }} className="lobster-sprite">
      <defs>
        <filter id="lg" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feFlood floodColor={classColor} floodOpacity="0.5" result="c"/>
          <feComposite in="c" in2="blur" operator="in" result="g"/>
          <feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <g filter="url(#lg)">
        {LOBSTER_PIXELS.map(([col,row,type],i) => (
          <rect key={i} x={col*px} y={row*px} width={px} height={px}
            fill={cm[type]??classColor} opacity={om[type]??1}
            className={type==='W'?'lobster-eye':undefined}/>
        ))}
      </g>
    </svg>
  )
}

// ── Alien Head SVG Shape ──────────────────────────────────────
// Draws the full alien head with actual FACE FEATURES:
// forehead dome → CRT zone → face (eyes + nose + chin)

function AlienHeadShape({ color, width=300, height=550 }: { color:string; width?:number; height?:number }) {
  const w = width, h = height

  // Shield silhouette:
  // - Top: flat / square corners (like a heater shield)
  // - Sides: straight down to ~68% height
  // - Bottom: two curves converging to a pointed tip
  const head = `
    M 0,0
    L ${w},0
    L ${w},${h*0.68}
    Q ${w*0.98},${h*0.80} ${w*0.72},${h*0.90}
    Q ${w*0.56},${h*0.97} ${w*0.5},${h}
    Q ${w*0.44},${h*0.97} ${w*0.28},${h*0.90}
    Q ${w*0.02},${h*0.80} 0,${h*0.68}
    Z
  `

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ position:'absolute', inset:0, width:'100%', height:'100%', zIndex:0, overflow:'visible' }}
    >
      <defs>
        {/* Radial gradient: slight class-color glow in middle, dark edges */}
        <radialGradient id="hbg" cx="50%" cy="38%" r="60%">
          <stop offset="0%"  stopColor={color} stopOpacity="0.12"/>
          <stop offset="55%" stopColor="#0c0620" stopOpacity="1"/>
          <stop offset="100%" stopColor="#060412" stopOpacity="1"/>
        </radialGradient>

        {/* Face-zone gradient: slightly lighter so features are visible */}
        <radialGradient id="facebg" cx="50%" cy="30%" r="70%">
          <stop offset="0%"  stopColor={color} stopOpacity="0.08"/>
          <stop offset="100%" stopColor="#070314" stopOpacity="1"/>
        </radialGradient>

        {/* Glow filter for outline */}
        <filter id="hglow" x="-25%" y="-10%" width="150%" height="120%">
          <feGaussianBlur stdDeviation="10" result="blur"/>
          <feFlood floodColor={color} floodOpacity="0.7" result="c"/>
          <feComposite in="c" in2="blur" operator="in" result="g"/>
          <feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>


      </defs>

      {/* ── 1. Head fill ── */}
      <path d={head} fill="url(#hbg)"/>

      {/* ── 2. Glowing border (most important visual) ── */}
      <path d={head} fill="none" stroke={color} strokeWidth="2.5"
        filter="url(#hglow)" opacity="0.95"/>

      {/* ── 3. Inner shield bevel (1px inset of the border) ── */}
      <path d={head} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1"
        transform={`translate(5,4) scale(${(w-10)/w},${(h-6)/h})`}/>

      {/* ── 4. Central vertical dividing line (heraldic) ── */}
      <line x1={w*0.5} y1={h*0.04} x2={w*0.5} y2={h*0.62}
        stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>

      {/* ── 5. Horizontal dividing line (top quarter) ── */}
      <line x1={w*0.04} y1={h*0.28} x2={w*0.96} y2={h*0.28}
        stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>

      {/* ── 6. Top-left corner highlight (shield face catch light) ── */}
      <ellipse cx={w*0.22} cy={h*0.09} rx={w*0.14} ry={h*0.06}
        fill="rgba(255,255,255,0.05)"/>

      {/* ── 7. Shield boss / umbo circle (center of lower half) ── */}
      <circle cx={w*0.5} cy={h*0.48} r={w*0.07}
        fill="none" stroke={color} strokeWidth="1" opacity="0.25"/>

      {/* ── 8. Bottom point shadow ── */}
      <ellipse cx={w*0.5} cy={h*0.97} rx={w*0.08} ry={h*0.018}
        fill="rgba(0,0,0,0.5)"/>
    </svg>
  )
}

// ── SoulWeb (kept, not rendered) ──────────────────────────────
function SoulWeb(_p: { stats:Stats; classColor:string; size?:number }) { return null }

// ── Formulas ──────────────────────────────────────────────────
function xpForLevel(n:number) { return n<=1 ? 0 : (n*(n-1)/2)*1000 }
function levelProgress(xp:number, level:number) {
  if (level>=999) return 100
  const s=xpForLevel(level), e=xpForLevel(level+1)
  return Math.min(100, Math.floor(((xp-s)/(e-s))*100))
}
function xpToNext(xp:number, level:number) { return level>=999 ? 0 : xpForLevel(level+1)-xp }
function fmtNum(n:number) { return n.toLocaleString() }
function fmtSign(n:number) { return (n>=0?'+':'')+n }



// ── App ───────────────────────────────────────────────────────

export default function App() {
  const [char, setChar]       = useState<Character|null>(null)
  const [error, setError]     = useState<string|null>(null)
  const [loading, setLoading] = useState(true)

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

  if (loading) return <div className="center-msg"><h2>🦞 Loading…</h2></div>
  if (error || !char) return (
    <div className="center-msg">
      <h2>No character found</h2>
      <code>node scripts/init.mjs</code>
    </div>
  )

  const cls        = CLASSES[char.class] || { en:char.class, icon:'🦞', color:'#14b8a6' }
  const cc         = cls.color                          // classColor shorthand
  const title      = TITLES[Math.min(char.prestige, TITLES.length-1)]
  const progress   = levelProgress(char.xp, char.level)
  const toNext     = xpToNext(char.xp, char.level)
  const mbti       = deriveMBTI(char.stats, char.bab??0)
  const mbtiName   = MBTI_NAMES[mbti]??''
  const alignment  = deriveAlignment(char.stats)
  const rarity     = getRarity(char.level)
  const phrase     = CATCHPHRASES[char.class]??'Ready.'
  const rune       = CLASS_RUNE[char.class]??'🦞'
  const feats      = char.feats??[]
  const abilities  = char.abilities??[]
  const saves      = char.saves??{ fort:0, ref:0, will:0 }
  const EQ_SEGS    = 12
  void (SoulWeb as unknown)

  return (
    <div className="page-wrap" style={{ '--cc':cc, '--rc':rarity.color } as React.CSSProperties}>

      {/*
        ╔═══════════════════════════════════════════════════════════════╗
        ║  WINAMP GRID                                                  ║
        ║  Cols: [spk-L] [wing-L] [HEAD] [wing-R] [spk-R]              ║
        ║  Rows: [r1-top 110px] [r2-wings 280px] [r3-chin 160px]        ║
        ║                                                               ║
        ║  spk-L/R  → rows 1-3 (full height, invisible filler in r1/r3)║
        ║  wing-L/R → row 2 ONLY (the horizontal "arms")               ║
        ║  HEAD     → rows 1-3 (protrudes above and below wings)        ║
        ╚═══════════════════════════════════════════════════════════════╝
      */}
      <div className="wg">



        {/* ─── Left EQ wing: col 2, ROW 2 ONLY ─── */}
        <div className="wing wl">
          <div className="axe-handle"/>
          <div className="wing-hdr">EQUALIZER</div>

          <div className="eq-bars">
            {STAT_KEYS.map(k => {
              const val   = char.stats[k as keyof Stats]??10
              const color = STAT_COLORS[k]
              const lit   = Math.round((val/20)*EQ_SEGS)
              return (
                <div className="eq-col" key={k}>
                  <div className="eq-track">
                    {Array.from({length:EQ_SEGS},(_,i)=>(
                      <div key={i} className={`eq-seg${EQ_SEGS-1-i<lit?' lit':''}`}
                        style={{'--sc':color} as React.CSSProperties}/>
                    ))}
                  </div>
                  <div className="eq-lbl" style={{color}}>{STAT_INFO[k].dnd}</div>
                  <div className="eq-num">{val}</div>
                </div>
              )
            })}
          </div>

          <div className="saves">
            {([['FORT',saves.fort??0],['REF',saves.ref??0],['WILL',saves.will??0]] as [string,number][])
              .map(([l,v])=>(
              <div className="save-row" key={l}>
                <span className="s-lbl">{l}</span>
                <div className="s-track">
                  <div className="s-fill" style={{width:`${Math.min(100,Math.max(4,((v+12)/24)*100))}%`}}/>
                  <div className="s-thumb" style={{left:`${Math.min(94,Math.max(2,((v+12)/24)*100))}%`}}/>
                </div>
                <span className="s-val">{fmtSign(v)}</span>
              </div>
            ))}
          </div>

          <div className="wing-stats">
            {[{l:'HP',v:String(char.hp??'—')},{l:'AC',v:String(char.ac??'—')},{l:'BAB',v:char.bab!=null?fmtSign(char.bab):'—'}]
              .map(s=>(
              <div className="ws" key={s.l}>
                <span className="ws-v" style={{color:cc}}>{s.v}</span>
                <span className="ws-l">{s.l}</span>
              </div>
            ))}
          </div>
        </div>

        {/*
          ══════════════════════════════════════════════
          CENTER HEAD — col 3, rows 1-3
          AlienHeadShape SVG provides the head silhouette.
          Content is layered on top in 3 zones.
          ══════════════════════════════════════════════
        */}
        <div className="head">
          {/* The actual head shape drawn as SVG */}
          <AlienHeadShape color={cc} width={300} height={550}/>

          {/* ── Zone 1: TOP (above wings, 110px) ── */}
          <div className="hz hz-top">
            <div className="h-title">CLAW RPG</div>
            <div className="trow">
              <div className="tbtn">{char.prestige>0?`★${char.prestige}`:'◀◀'}</div>
              <div className="tbtn t-cls">{cls.icon}</div>
              <div className="tbtn t-lvl">{char.level}</div>
              <div className="tbtn t-rar" style={{color:rarity.color}}>{rarity.label.slice(0,3)}</div>
              <div className="tbtn">{progress}%</div>
            </div>
          </div>

          {/* ── Zone 2: MIDDLE (wings level, 280px) ── */}
          <div className="hz hz-mid">
            <div className="crt">
              <div className="crt-inner">
                <div className="crt-scanlines"/>
                <div className="crt-rune">{rune}</div>
                <LobsterSprite classColor={cc} size={155}/>
              </div>
            </div>
            <div className="h-id">
              <span className="h-mbti" style={{color:cc,textShadow:`0 0 10px ${cc}`}}>{mbti}</span>
              <span className="h-dot"> · </span>
              <span className="h-align">{alignment}</span>
            </div>
            <div className="h-mname">{mbtiName}</div>
          </div>

          {/* ── Zone 3: BOTTOM chin (160px) ── */}
          <div className="hz hz-bot">
            <div className="h-name">{char.name}</div>
            <div className="h-class">{cls.icon} <span style={{color:cc}}>{cls.en}</span></div>
            <div className="h-quote">"{phrase}"</div>
            <div className="xp-outer">
              <div className="xp-inner" style={{width:`${progress}%`}}/>
            </div>
            <div className="xp-row">
              <span>{fmtNum(char.xp)} XP</span>
              <span>{char.level<999?`${fmtNum(toNext)} to Lv.${char.level+1}`:'MAX'}</span>
            </div>
            <div className="live">⚡ {title} · {char.updatedAt?.slice(11,16)}</div>
          </div>
        </div>

        {/* ─── Right playlist wing: col 4, ROW 2 ONLY ─── */}
        <div className="wing wr">
          <div className="axe-handle"/>
          <div className="wing-hdr">
            FEATS <span className="f-cnt">{String(feats.length).padStart(2,'0')}</span>
          </div>

          <div className="playlist">
            {feats.length===0
              ? <div className="pl-empty">— no feats —</div>
              : feats.map((f,i)=>(
                <div key={f} className={`pl-row${i===0?' pl-on':''}`}>
                  <span className="pl-i">{String(i+1).padStart(2,'0')}</span>
                  <span className="pl-n">{f.length>20?f.slice(0,19)+'…':f}</span>
                </div>
              ))
            }
          </div>

          <div className="abil-sec">
            <div className="abil-hdr">ABILITIES</div>
            <div className="abil-grid">
              {abilities.slice(0,4).map((ab,i)=>(
                <div key={ab} className="abil-chip" style={{'--cc':cc} as React.CSSProperties}>
                  <span className="abil-ico">{ABILITY_ICONS[char.class]?.[i]??'⚡'}</span>
                  <span className="abil-n">{ab.length>12?ab.slice(0,11)+'…':ab}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="wing-stats">
            {[
              {l:'INIT',v:char.initiative!=null?fmtSign(char.initiative):'—'},
              {l:'WILL',v:fmtSign(saves.will??0)},
              {l:'XP',  v:`${progress}%`},
            ].map(s=>(
              <div className="ws" key={s.l}>
                <span className="ws-v" style={{color:cc}}>{s.v}</span>
                <span className="ws-l">{s.l}</span>
              </div>
            ))}
          </div>
        </div>



      </div>{/* .wg */}
    </div>
  )
}
