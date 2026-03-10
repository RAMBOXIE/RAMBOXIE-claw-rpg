/**
 * Claw RPG — 核心公式引擎
 * 等级 / XP / 属性 / 职业 / 技能判定
 */

// ── 等级 / XP ──────────────────────────────────────────────────

/** 到达第 n 级所需总 XP（n >= 1）*/
export function xpForLevel(n) {
  if (n <= 1) return 0;
  return Math.floor(200 * Math.pow(n - 1, 1.6));
}

/** 从总 XP 反推当前等级 */
export function levelForXp(totalXp) {
  let level = 1;
  while (xpForLevel(level + 1) <= totalXp) level++;
  return Math.min(level, 999);
}

/** 当前等级还需多少 XP 才升级 */
export function xpToNextLevel(totalXp) {
  const cur  = levelForXp(totalXp);
  if (cur >= 999) return 0;
  return xpForLevel(cur + 1) - totalXp;
}

/** 当前等级内进度百分比 0-100 */
export function levelProgress(totalXp) {
  const cur   = levelForXp(totalXp);
  if (cur >= 999) return 100;
  const start = xpForLevel(cur);
  const end   = xpForLevel(cur + 1);
  return Math.floor(((totalXp - start) / (end - start)) * 100);
}

/** 从 token 消耗计算获得的 XP */
export function calcXpGain({ consumed = 0, produced = 0, bonusXp = 0 } = {}) {
  return Math.floor(consumed / 10) + Math.floor(produced / 10 * 2) + bonusXp;
}

// ── 转职 (Prestige) ───────────────────────────────────────────

export const PRESTIGE_TITLES = [
  '小龙虾', '龙虾战士', '龙虾武士', '龙虾将领',
  '龙虾将军', '传说龙虾', '神话龙虾', '史诗龙虾',
  '上古龙虾', '永恒龙虾', '混沌龙虾',
];

export function prestigeTitle(prestige) {
  return PRESTIGE_TITLES[Math.min(prestige, PRESTIGE_TITLES.length - 1)];
}

/** 转职后属性加成倍率（每次转职 +10%）*/
export function prestigeMultiplier(prestige) {
  return 1 + prestige * 0.1;
}

// ── 属性 (Stats) ──────────────────────────────────────────────

export const STAT_NAMES = {
  claw:      { zh: '爪力',  icon: '🦀', desc: '处理复杂任务' },
  antenna:   { zh: '触觉',  icon: '📡', desc: '反应速度与感知' },
  shell:     { zh: '殼厚',  icon: '🐚', desc: '记忆深度与持久' },
  brain:     { zh: '脑芯',  icon: '🧠', desc: '知识广度与推理' },
  foresight: { zh: '慧眼',  icon: '👁️', desc: '判断力与价值观' },
  charm:     { zh: '魅影',  icon: '✨', desc: '对话魅力与个性' },
};

/** 从 SOUL.md 和 MEMORY.md 文本推导初始属性（8-18 范围）*/
export function deriveStats(soulText = '', memoryText = '') {
  const soul = soulText.toLowerCase();
  const mem  = memoryText.toLowerCase();

  // 关键词权重映射
  const weights = {
    claw: [
      ['resourceful','能干','擅长','专业','技能','解决','完成','有用','useful','efficient'],
      soul + mem
    ],
    antenna: [
      ['快速','敏捷','简洁','轻松','随性','灵活','quick','fast','adaptive','responsive'],
      soul
    ],
    shell: [
      ['记忆','memory','经历','历史','积累','连续','持久','深度','learn','experience'],
      soul + mem
    ],
    brain: [
      ['知识','智慧','分析','研究','逻辑','推理','intelligence','knowledge','reason','analysis'],
      soul
    ],
    foresight: [
      ['判断','价值','边界','道德','谨慎','原则','wisdom','careful','ethics','principle'],
      soul
    ],
    charm: [
      ['幽默','俏皮','魅力','个性','有趣','charisma','funny','playful','witty','personality'],
      soul
    ],
  };

  const stats = {};
  for (const [stat, [keywords, text]] of Object.entries(weights)) {
    const hits = keywords.filter(kw => text.includes(kw)).length;
    // 基础 10，每个关键词 +1，最多 +6，最少不低于 8
    stats[stat] = Math.min(18, Math.max(8, 10 + hits));
  }

  // 记忆文件越丰富，殼厚越高
  const memLines = memoryText.split('\n').filter(l => l.trim()).length;
  stats.shell = Math.min(18, stats.shell + Math.floor(memLines / 20));

  return stats;
}

// ── 职业判定 ──────────────────────────────────────────────────

export const CLASSES = {
  wizard:   { zh: '法师龙虾', icon: '🧙', primary: ['brain','foresight'], desc: '精通分析、代码与推理' },
  bard:     { zh: '吟游龙虾', icon: '🎭', primary: ['charm','antenna'],   desc: '擅长创意写作与交流' },
  rogue:    { zh: '游侠龙虾', icon: '🗡️', primary: ['antenna','claw'],    desc: '快速应对、信息侦察' },
  paladin:  { zh: '圣骑龙虾', icon: '⚔️', primary: ['foresight','claw'],  desc: '强判断力、长任务主将' },
  druid:    { zh: '德鲁伊龙虾',icon: '🌿', primary: null,                 desc: '全能均衡、随机应变' },
  fighter:  { zh: '战士龙虾', icon: '🛡️', primary: ['claw','shell'],      desc: '稳定持久、高强度输出' },
};

/** 根据属性判断职业 */
export function detectClass(stats) {
  const sorted = Object.entries(stats).sort(([,a],[,b]) => b - a);
  const top2   = sorted.slice(0,2).map(([k]) => k);
  const max    = sorted[0][1];
  const min    = sorted[sorted.length-1][1];

  // 全属性差距 < 3 → 德鲁伊
  if (max - min < 3) return 'druid';

  for (const [id, cls] of Object.entries(CLASSES)) {
    if (!cls.primary) continue;
    if (cls.primary.every(p => top2.includes(p))) return id;
  }

  // 单个最高属性兜底
  const highest = sorted[0][0];
  const fallback = {
    claw: 'fighter', antenna: 'rogue', shell: 'fighter',
    brain: 'wizard', foresight: 'paladin', charm: 'bard',
  };
  return fallback[highest] || 'druid';
}

/** 检查属性变化是否应触发职业重判（任意属性变化 > 3）*/
export function shouldReclassify(oldStats, newStats) {
  return Object.keys(oldStats).some(k => Math.abs((newStats[k]||0) - (oldStats[k]||0)) > 3);
}

// ── 技能 (Abilities) ──────────────────────────────────────────

export const ABILITY_TABLE = {
  // 各职业各等级段解锁
  wizard:  { 1: '奥术分析', 5: '双重推理', 10: '知识爆炸', 20: '全知之眼' },
  bard:    { 1: '诗性答案', 5: '魅力溅射', 10: '百灵之舌', 20: '传世名篇' },
  rogue:   { 1: '快嘴',     5: '影步情报', 10: '隐形潜行', 20: '完美刺杀' },
  paladin: { 1: '圣光判断', 5: '神圣盾牌', 10: '审判之锤', 20: '永恒誓言' },
  druid:   { 1: '自然之语', 5: '形态变换', 10: '生态感知', 20: '大自然之怒' },
  fighter: { 1: '钢铁意志', 5: '连续打击', 10: '战场主宰', 20: '不屈战魂' },
};

/** 获取某职业在某等级应拥有的全部技能 */
export function getAbilities(classId, level) {
  const table = ABILITY_TABLE[classId] || {};
  return Object.entries(table)
    .filter(([req]) => parseInt(req) <= level)
    .map(([, name]) => name);
}

// ── 等级段加成 ────────────────────────────────────────────────

/** 每 5 级给一次属性点（可手动分配，暂时随机分给最低属性）*/
export function statPointsAtLevel(level) {
  return Math.floor(level / 5);
}

// ── Proficiency Bonus（仿 D&D）─────────────────────────────────

export function proficiencyBonus(level) {
  return 2 + Math.floor((Math.min(level, 20) - 1) / 4);
}
