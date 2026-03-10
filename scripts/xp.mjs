#!/usr/bin/env node
/**
 * Claw RPG — XP 同步
 *
 * 由 cron（每日 03:00）或 heartbeat（每 20 次对话）调用
 *
 * 用法：
 *   node scripts/xp.mjs --in 2000 --out 800          # 直接传 token delta
 *   node scripts/xp.mjs --in 2000 --out 800 --bonus 20
 *   node scripts/xp.mjs --conversations 1             # 仅记录对话次数 +N
 *
 * 龙虾自报范例（heartbeat 里）：
 *   const status = await session_status();
 *   const delta_in  = status.tokens.input  - lastSnapshot.input;
 *   const delta_out = status.tokens.output - lastSnapshot.output;
 *   execSync(`node ${SCRIPTS}/xp.mjs --in ${delta_in} --out ${delta_out}`);
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { CHARACTER_FILE } from './_paths.mjs';
import {
  calcXpGain, levelForXp, xpToNextLevel, detectClass,
  getAbilities, shouldReclassify, CLASSES, levelProgress, STAT_NAMES
} from './_formulas.mjs';
import { notify, msgLevelUp, msgClassChange, msgMaxLevel, msgStatUp } from './_notify.mjs';

const args = process.argv.slice(2);
const get  = f => { const i = args.indexOf(f); return i !== -1 ? parseFloat(args[i+1]) || 0 : 0; };
const getS = f => { const i = args.indexOf(f); return i !== -1 ? (args[i+1] || '') : ''; };

// 对话类型 → 属性映射
const TYPE_TO_STAT = {
  creative:   'charm',      // ✨ 魅影：创意写作、故事、营销文案
  analytical: 'brain',      // 🧠 脑芯：分析、代码、推理
  task:       'claw',       // 🦀 爪力：多步骤任务、项目执行
  social:     'antenna',    // 📡 触觉：闲聊、情绪、快速问答
  memory:     'shell',      // 🐚 殼厚：长上下文、记忆整理
  vigilant:   'foresight',  // 👁️ 慧眼：决策、风险判断、边界
};
const ACCUM_THRESHOLD = 20; // 每 20 次同类对话，对应属性 +1

async function run({ consumed = 0, produced = 0, bonusXp = 0, conversations = 0, type = '' } = {}) {
  if (!existsSync(CHARACTER_FILE)) {
    console.error('❌ character.json 未找到，请先运行 init.mjs');
    process.exit(1);
  }

  const char = JSON.parse(readFileSync(CHARACTER_FILE, 'utf8'));
  const gained = calcXpGain({ consumed, produced, bonusXp });
  const oldXp  = char.xp;
  const oldLv  = char.level;

  // 累加
  char.xp           += gained;
  char.conversations += conversations;
  char.tokens.consumed += consumed;
  char.tokens.produced += produced;
  char.tokens.lastSnapshotConsumed += consumed;
  char.tokens.lastSnapshotProduced += produced;
  char.lastXpSync = new Date().toISOString();
  char.updatedAt  = char.lastXpSync;

  // 等级同步
  const newLv = Math.min(levelForXp(char.xp), 999);
  if (newLv > char.level) {
    char.levelHistory = char.levelHistory || [];
    for (let lv = char.level + 1; lv <= newLv; lv++) {
      char.levelHistory.push({ level: lv, date: char.updatedAt });
    }
    char.level = newLv;
  }

  // 技能更新
  char.abilities = getAbilities(char.class, char.level);

  // ── 属性成长（对话类型积累）─────────────────────────────────
  const statChanges = []; // [{ stat, old, new }]
  if (type && TYPE_TO_STAT[type]) {
    const statKey = TYPE_TO_STAT[type];
    char.statAccum = char.statAccum || {};
    char.statAccum[type] = (char.statAccum[type] || 0) + 1;

    if (char.statAccum[type] >= ACCUM_THRESHOLD) {
      const oldVal = char.stats[statKey];
      char.stats[statKey] = Math.min(99, oldVal + 1); // 转职后属性可超 18
      char.statAccum[type] = 0; // 重置计数
      statChanges.push({ stat: statKey, old: oldVal, new: char.stats[statKey] });
    }
  }

  // ── 职业重判（属性变化后触发）────────────────────────────────
  const oldClass   = char.class;
  const newClass   = detectClass(char.stats);
  let classChanged = false;
  if (newClass !== oldClass) {
    char.classHistory = char.classHistory || [];
    char.classHistory.push({ from: oldClass, to: newClass, date: char.updatedAt, reason: 'stat-growth' });
    char.class     = newClass;
    char.abilities = getAbilities(newClass, char.level);
    classChanged   = true;
  }

  char.updatedAt = new Date().toISOString();
  writeFileSync(CHARACTER_FILE, JSON.stringify(char, null, 2), 'utf8');

  const leveled  = newLv > oldLv;
  const progress = levelProgress(char.xp);

  // ── 对话小尾巴 ───────────────────────────────────────────────
  const lines = [];
  lines.push(`\n⚔️  本次对话结算`);
  lines.push(`   XP +${gained}  (输入:${consumed} 输出:${produced}${bonusXp ? ' 奖励:'+bonusXp : ''})`);

  // XP 进度条
  const bar20 = '█'.repeat(Math.floor(progress/5)) + '░'.repeat(20 - Math.floor(progress/5));
  lines.push(`   ${char.name}  Lv.${char.level}  [${bar20}] ${progress}%`);
  if (char.level < 999) lines.push(`   距升级还差 ${xpToNextLevel(char.xp).toLocaleString()} XP`);

  // 升级
  if (leveled) {
    lines.push(`\n   🎉 升级！Lv.${oldLv} → Lv.${newLv}${newLv - oldLv > 1 ? `（连升 ${newLv-oldLv} 级！）` : ''}`);
    if (char.level === 999) lines.push('   🌟 满级！可以转职了');
  }

  // 属性成长
  if (statChanges.length) {
    lines.push('');
    for (const sc of statChanges) {
      const info   = STAT_NAMES[sc.stat];
      const accumP = Math.round(((char.statAccum?.[type] || 0) / ACCUM_THRESHOLD) * 10);
      const accumBar = '█'.repeat(accumP) + '░'.repeat(10 - accumP);
      lines.push(`   ${info.icon} ${info.zh} +1！  ${sc.old} → ${sc.new}`);
      lines.push(`   [${accumBar}] 0/${ACCUM_THRESHOLD}（已重置）`);
    }
  } else if (type && TYPE_TO_STAT[type]) {
    // 显示积累进度
    const cur      = char.statAccum?.[type] || 0;
    const statKey  = TYPE_TO_STAT[type];
    const info     = STAT_NAMES[statKey];
    const accumP   = Math.round((cur / ACCUM_THRESHOLD) * 10);
    const accumBar = '█'.repeat(accumP) + '░'.repeat(10 - accumP);
    lines.push(`\n   ${info.icon} ${info.zh} 积累  [${accumBar}] ${cur}/${ACCUM_THRESHOLD}`);
  }

  // 职业变化
  if (classChanged) {
    const oldCls = CLASSES[oldClass] || { zh: oldClass };
    const newCls = CLASSES[newClass] || { zh: newClass };
    lines.push(`\n   🔄 职业转变！${oldCls.zh} → ${newCls.zh}`);
  }

  lines.push('');
  console.log(lines.join('\n'));

  // ── 推送通知 ─────────────────────────────────────────────────
  const notifications = [];
  if (leveled) {
    notifications.push(notify(char.level === 999 ? msgMaxLevel(char) : msgLevelUp(char, oldLv, newLv)));
  }
  if (classChanged) {
    const oldCls = CLASSES[oldClass] || { zh: oldClass, icon: '?' };
    const newCls = CLASSES[newClass] || { zh: newClass, icon: '?' };
    notifications.push(notify(msgClassChange(char, oldClass, newClass, oldCls.zh, newCls.zh, '某项', '📊')));
  }
  for (const sc of statChanges) {
    notifications.push(notify(msgStatUp(char, sc.stat, sc.old, sc.new)));
  }
  if (notifications.length) await Promise.allSettled(notifications);

  const result = { gained, xp: char.xp, level: char.level, leveled, classChanged, statChanges, progress };
  process.stdout.write('\n__JSON_OUTPUT__\n' + JSON.stringify(result) + '\n');
  return result;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  run({
    consumed:      get('--in'),
    produced:      get('--out'),
    bonusXp:       get('--bonus'),
    conversations: get('--conversations'),
    type:          getS('--type'),
  }).catch(e => { console.error('❌', e.message); process.exit(1); });
}

export { run };
