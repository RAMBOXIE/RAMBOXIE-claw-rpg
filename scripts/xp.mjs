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
  getAbilities, shouldReclassify, CLASSES, levelProgress
} from './_formulas.mjs';
import { notify, msgLevelUp, msgClassChange, msgMaxLevel } from './_notify.mjs';

const args = process.argv.slice(2);
const get  = f => { const i = args.indexOf(f); return i !== -1 ? parseFloat(args[i+1]) || 0 : 0; };

async function run({ consumed = 0, produced = 0, bonusXp = 0, conversations = 0 } = {}) {
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

  // 职业重判（在 stat 被外部修改后调用 xp 时触发）
  const oldClass   = char.class;
  const newClass   = detectClass(char.stats);
  let classChanged = false;
  if (newClass !== oldClass) {
    char.classHistory = char.classHistory || [];
    char.classHistory.push({ from: oldClass, to: newClass, date: char.updatedAt, reason: 'stat-shift' });
    char.class    = newClass;
    char.abilities = getAbilities(newClass, char.level);
    classChanged  = true;
  }

  char.updatedAt = new Date().toISOString();
  writeFileSync(CHARACTER_FILE, JSON.stringify(char, null, 2), 'utf8');

  const leveled  = newLv > oldLv;
  const progress = levelProgress(char.xp);

  console.log(`\n⚔️  XP +${gained}  (in:${consumed} out:${produced} bonus:${bonusXp})`);
  console.log(`   ${char.name}  Lv.${char.level}  ${char.xp} XP`);
  if (char.level < 999) {
    const bar = '█'.repeat(Math.floor(progress/5)) + '░'.repeat(20 - Math.floor(progress/5));
    console.log(`   [${bar}] ${progress}%  还差 ${xpToNextLevel(char.xp)} XP 升级`);
  }
  if (leveled) {
    console.log(`\n   🎉 升级！${oldLv} → ${newLv}`);
    if (char.level === 999) console.log('   🌟 满级！可以转职了（node scripts/levelup.mjs --prestige）');
  }
  if (classChanged) {
    const oldCls = CLASSES[oldClass] || { zh: oldClass, icon: '?' };
    const newCls = CLASSES[newClass] || { zh: newClass, icon: '?' };
    console.log(`\n   🔄 职业变化：${oldCls.zh} → ${newCls.zh}`);
  }
  console.log('');

  // 推送通知（异步，不阻塞主流程）
  const notifications = [];
  if (leveled) {
    if (char.level === 999) notifications.push(notify(msgMaxLevel(char)));
    else                    notifications.push(notify(msgLevelUp(char, oldLv, newLv)));
  }
  if (classChanged) {
    const oldCls = CLASSES[oldClass] || { zh: oldClass, icon: '?' };
    const newCls = CLASSES[newClass] || { zh: newClass, icon: '?' };
    notifications.push(notify(msgClassChange(char, oldClass, newClass, oldCls.zh, newCls.zh, '某项', '📊')));
  }
  if (notifications.length) await Promise.allSettled(notifications);

  const result = { gained, xp: char.xp, level: char.level, leveled, classChanged, progress };
  process.stdout.write('\n__JSON_OUTPUT__\n' + JSON.stringify(result) + '\n');
  return result;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  run({
    consumed:      get('--in'),
    produced:      get('--out'),
    bonusXp:       get('--bonus'),
    conversations: get('--conversations'),
  }).catch(e => { console.error('❌', e.message); process.exit(1); });
}

export { run };
